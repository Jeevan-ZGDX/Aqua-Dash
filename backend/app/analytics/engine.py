"""Reusable analytics engine.

All metrics are computed dynamically from live database records; nothing
is stored. Filters (academic year, department, round) are composed and
passed to every aggregation, so the same engine serves dashboard,
analytics, and report consumers.
"""

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import AdmissionStatus
from app.core.logging import Timer, log_analytics
from app.models.admission_detail import AdmissionDetail
from app.models.student import Student
from app.repositories.student_repository import StudentRepository
from app.utils.cache import build_cache_key, cache_get, cache_set


class AnalyticsEngine:
    """Compose standard analytics payloads from a single data source."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.students = StudentRepository(session)

    # ------------------------------------------------------------------
    # Filter composition
    # ------------------------------------------------------------------
    def compose_filters(
        self,
        *,
        academic_year: Optional[str] = None,
        department_id: Optional[int] = None,
        round_id: Optional[int] = None,
    ) -> list[Any]:
        filters: list[Any] = []
        if department_id is not None:
            filters.append(Student.department_id == department_id)
        if round_id is not None:
            filters.append(Student.round_id == round_id)
        if academic_year:
            from app.models.academic_year import AcademicYear

            filters.append(Student.academic_year_id == AcademicYear.id)
            filters.append(AcademicYear.year == academic_year)
        return filters

    async def run(
        self,
        *,
        academic_year: Optional[str] = None,
        department_id: Optional[int] = None,
        round_id: Optional[int] = None,
        use_cache: bool = True,
    ) -> dict:
        timer = Timer()
        filters = self.compose_filters(
            academic_year=academic_year, department_id=department_id, round_id=round_id
        )
        key = build_cache_key(
            "analytics:summary",
            academic_year=academic_year,
            department_id=department_id,
            round_id=round_id,
        )
        if use_cache:
            cached = cache_get(key)
            if cached:
                log_analytics("cache_hit", scope="summary", duration_ms=timer.elapsed_ms())
                return cached

        payload = await self._compute(filters)
        log_analytics("computed", scope="summary", duration_ms=timer.elapsed_ms())
        if use_cache:
            cache_set(key, payload)
        return payload

    async def _compute(self, filters: list[Any]) -> dict:
        status_counts = await self.students.count_by_status(filters=filters)
        total = sum(status_counts.values())

        admitted = status_counts.get(AdmissionStatus.ADMITTED.value, 0)
        confirmed = status_counts.get(AdmissionStatus.CONFIRMED.value, 0)
        total_admitted = admitted + confirmed

        admission_rate = round((total_admitted / total * 100), 2) if total else 0.0
        acceptance_rate = admission_rate  # accepted from applied pool
        seats_filled = total_admitted
        vacancy_percentage = round((1 - seats_filled / max(total, 1)) * 100, 2) if total else 0.0

        gender = dict(await self.students.group_by_field("gender", filters=filters))
        community = [{"label": k, "value": v} for k, v in await self.students.group_by_field("community", filters=filters)]
        district = [{"label": k, "value": v} for k, v in await self.students.group_by_field("district", filters=filters)]
        school_type = [{"label": k, "value": v} for k, v in await self.students.group_by_field("school_type", filters=filters)]

        gender_with_pct = [
            {"label": k, "value": v, "percentage": round(v / max(total, 1) * 100, 2)}
            for k, v in gender.items()
        ]

        cutoff = {
            "overall_min": None,
            "overall_max": None,
            "overall_avg": None,
            "buckets": await self.students.cutoff_buckets(filters=filters),
        }
        cutoff_values = await self._cutoff_stats(filters)
        cutoff.update(cutoff_values)

        rounds = await self.students.round_wise_trends(filters=filters)
        monthly = await self.students.monthly_trends()
        yearly = await self.students.yearly_comparison()

        department_stats = await self._department_stats(filters)

        seat = await self.students.seat_utilization()

        return {
            "admission_rate": {
                "total_applications": total,
                "total_admissions": total_admitted,
                "admission_rate": admission_rate,
                "acceptance_rate": acceptance_rate,
            },
            "department_stats": department_stats,
            "community_distribution": self._percentify(community, total),
            "gender_distribution": gender_with_pct,
            "school_type_distribution": self._percentify(school_type, total),
            "district_distribution": self._percentify(district, total),
            "cutoff_analysis": cutoff,
            "seat_utilization": seat,
            "vacancy_percentage": vacancy_percentage,
            "round_wise_trends": rounds,
            "monthly_trends": monthly,
            "yearly_comparison": yearly,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

    async def _cutoff_stats(self, filters: list[Any]) -> dict:
        stmt = select(
            func.min(Student.cutoff_score),
            func.max(Student.cutoff_score),
            func.avg(Student.cutoff_score),
        ).select_from(Student).where(Student.cutoff_score.is_not(None))
        if filters:
            stmt = stmt.where(and_(*filters))
        row = (await self.session.execute(stmt)).one()
        return {
            "overall_min": round(row[0], 2) if row[0] is not None else None,
            "overall_max": round(row[1], 2) if row[1] is not None else None,
            "overall_avg": round(row[2], 2) if row[2] is not None else None,
        }

    async def _department_stats(self, filters: list[Any]) -> list[dict]:
        from app.models.department import Department

        stmt = (
            select(Department.code, Department.name, Student.admission_status)
            .join(Student, Student.department_id == Department.id, isouter=True)
        )
        if filters:
            stmt = stmt.where(and_(*filters))
        rows = (await self.session.execute(stmt)).all()
        grouped: dict[str, dict] = {}
        for code, name, status in rows:
            entry = grouped.setdefault(code or "UNKNOWN", {"code": code, "name": name, "count": 0, "admitted": 0})
            if status is not None:
                entry["count"] += 1
                if status in (AdmissionStatus.ADMITTED.value, AdmissionStatus.CONFIRMED.value):
                    entry["admitted"] += 1
        return list(grouped.values())

    @staticmethod
    def _percentify(distribution: list[dict], total: int) -> list[dict]:
        for point in distribution:
            point["percentage"] = round(point["value"] / total * 100, 2) if total else 0.0
        return distribution
