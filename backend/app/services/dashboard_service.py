"""Dashboard aggregation service.

Computes the KPI overview + recent activity in a single, cacheable call
instead of many frontend round-trips.
"""

from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import AdmissionStatus
from app.core.logging import Timer, log_analytics
from app.models.academic_year import AcademicYear
from app.models.student import Student
from app.repositories.activity_repository import ActivityRepository
from app.repositories.student_repository import StudentRepository
from app.utils.cache import build_cache_key, cache_get, cache_set


class DashboardService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.students = StudentRepository(session)
        self.activities = ActivityRepository(session)

    async def overview(self, *, department_id: Optional[int] = None, academic_year: Optional[str] = None, use_cache: bool = True) -> dict:
        timer = Timer()
        key = build_cache_key("dashboard:overview", department_id=department_id, academic_year=academic_year)
        if use_cache:
            cached = cache_get(key)
            if cached:
                return cached

        filters: list = []
        if department_id is not None:
            filters.append(Student.department_id == department_id)
        if academic_year:
            filters.append(AcademicYear.year == academic_year)

        status_counts = await self.students.count_by_status(filters=filters)
        total = sum(status_counts.values())

        gender = dict(await self.students.group_by_field("gender", filters=filters))
        admitted = status_counts.get(AdmissionStatus.ADMITTED.value, 0)
        confirmed = status_counts.get(AdmissionStatus.CONFIRMED.value, 0)
        seats_filled = admitted + confirmed

        total_seats = await self._total_seats(department_id=department_id)
        vacant = max(total_seats - seats_filled, 0)
        admission_pct = round(seats_filled / total_seats * 100, 2) if total_seats else 0.0
        confirmation_rate = round(confirmed / max(total, 1) * 100, 2)

        year_label = academic_year or await self._active_year_label()

        payload = {
            "total_applications": total,
            "total_seats": total_seats,
            "seats_filled": seats_filled,
            "vacant_seats": vacant,
            "admission_percentage": admission_pct,
            "confirmation_rate": confirmation_rate,
            "male_students": gender.get("MALE", 0),
            "female_students": gender.get("FEMALE", 0),
            "other_students": gender.get("OTHER", 0),
            "applied": status_counts.get(AdmissionStatus.APPLIED.value, 0),
            "admitted": admitted,
            "confirmed": confirmed,
            "waitlisted": status_counts.get(AdmissionStatus.WAITLISTED.value, 0),
            "rejected": status_counts.get(AdmissionStatus.REJECTED.value, 0),
            "academic_year": year_label,
            "department": None,
        }
        log_analytics("dashboard_overview", scope="overview", duration_ms=timer.elapsed_ms())
        if use_cache:
            cache_set(key, payload)
        return payload

    async def recent_activities(self, limit: int = 10) -> list[dict]:
        return await self.activities.recent(limit=limit)

    async def _total_seats(self, department_id: Optional[int]) -> int:
        # Seats are configured per academic year as an app setting; fall back
        # to the count of admitted + vacant in the active year.
        from app.core.config import settings
        from app.repositories.reference_repositories import SettingRepository

        repo = SettingRepository(self.session)
        seats = await repo.get_value("total_seats", default=None)
        if seats is not None:
            return int(seats)
        return await self._infer_seats(department_id)

    async def _infer_seats(self, department_id: Optional[int]) -> int:
        # Inference: assume the max number of admitted students in any recent
        # active year is the seat capacity.
        stmt = (
            select(func.max(func.count()))
            .select_from(Student)
            .where(Student.admission_status.in_([AdmissionStatus.ADMITTED.value, AdmissionStatus.CONFIRMED.value]))
        )
        if department_id is not None:
            stmt = stmt.where(Student.department_id == department_id)
        grouped = stmt.group_by(Student.academic_year_id)
        result = await self.session.scalar(grouped)
        return int(result or 0)

    async def _active_year_label(self) -> Optional[str]:
        stmt = select(AcademicYear.year).where(AcademicYear.is_active.is_(True)).limit(1)
        return await self.session.scalar(stmt)
