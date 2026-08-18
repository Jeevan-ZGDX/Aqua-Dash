"""Student repository - aggregation, search and analytics queries."""

from datetime import datetime, timezone
from typing import Any, Optional, Sequence

from sqlalchemy import and_, case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import AdmissionStatus
from app.core.exceptions import DuplicateRecordError
from app.models.academic_detail import AcademicDetail
from app.models.academic_year import AcademicYear
from app.models.admission_detail import AdmissionDetail
from app.models.admission_round import AdmissionRound
from app.models.department import Department
from app.models.student import Student
from app.repositories.base import BaseRepository
from app.schemas.search import StudentSearchRequest
from app.utils.pagination import Page, PageParams


class StudentRepository(BaseRepository[Student]):
    model = Student

    # ------------------------------------------------------------------
    # Lookups
    # ------------------------------------------------------------------
    async def get_profile(self, student_id: int) -> Student:
        stmt = (
            select(Student)
            .options(
                # relationships are configured with selectin loading already
            )
            .where(Student.id == student_id)
        )
        student = await self.session.scalar(stmt)
        if student is None:
            from app.core.exceptions import NotFoundError

            raise NotFoundError(f"Student with id={student_id} not found.")
        return student

    async def ensure_unique(self, *, register_number: str, application_number: str, academic_year_id: int | None, exclude_id: int | None = None) -> None:
        stmt = select(Student).where(
            and_(
                or_(
                    Student.register_number == register_number,
                    Student.application_number == application_number,
                ),
                Student.academic_year_id == academic_year_id,
            )
        )
        if exclude_id:
            stmt = stmt.where(Student.id != exclude_id)
        existing = await self.session.scalar(stmt)
        if existing:
            if existing.register_number == register_number:
                raise DuplicateRecordError(f"Register number '{register_number}' already exists for this academic year.")
            raise DuplicateRecordError(f"Application number '{application_number}' already exists for this academic year.")

    # ------------------------------------------------------------------
    # Dynamic search (global + column filters, pagination, sorting)
    # ------------------------------------------------------------------
    SORTABLE_FIELDS = {
        "name": Student.name,
        "register_number": Student.register_number,
        "application_number": Student.application_number,
        "cutoff_score": Student.cutoff_score,
        "district": Student.district,
        "admission_status": Student.admission_status,
        "community": Student.community,
        "created_at": Student.created_at,
    }

    def build_filters(self, req: StudentSearchRequest) -> list[Any]:
        conditions: list[Any] = []
        if req.q:
            like = f"%{req.q.strip()}%"
            conditions.append(
                or_(
                    Student.register_number.ilike(like),
                    Student.application_number.ilike(like),
                    Student.name.ilike(like),
                    Student.district.ilike(like),
                    Student.email.ilike(like),
                )
            )
        if req.register_number:
            conditions.append(Student.register_number.ilike(f"%{req.register_number.strip()}%"))
        if req.application_number:
            conditions.append(Student.application_number.ilike(f"%{req.application_number.strip()}%"))
        if req.name:
            conditions.append(Student.name.ilike(f"%{req.name.strip()}%"))
        if req.district:
            conditions.append(Student.district == req.district)
        if req.community:
            conditions.append(Student.community == req.community.upper())
        if req.gender:
            conditions.append(Student.gender == req.gender)
        if req.admission_status:
            conditions.append(Student.admission_status == req.admission_status.upper())
        if req.cutoff_min is not None:
            conditions.append(Student.cutoff_score >= req.cutoff_min)
        if req.cutoff_max is not None:
            conditions.append(Student.cutoff_score <= req.cutoff_max)
        if req.academic_year:
            conditions.append(AcademicYear.year == req.academic_year)
        if req.round_number is not None:
            conditions.append(AdmissionRound.round_number == req.round_number)
        if req.department_id is not None:
            conditions.append(Student.department_id == req.department_id)
        return conditions

    async def search(self, req: StudentSearchRequest) -> Page[Student]:
        base_conditions = self.build_filters(req)
        count_stmt = (
            select(func.count())
            .select_from(Student)
            .join(AcademicYear, Student.academic_year_id == AcademicYear.id, isouter=True)
            .join(AdmissionRound, Student.round_id == AdmissionRound.id, isouter=True)
            .where(and_(*base_conditions))
        )
        total = int((await self.session.scalar(count_stmt)) or 0)

        order_column = self.SORTABLE_FIELDS.get(req.sort_by, Student.created_at)
        order = order_column.desc() if req.sort_order == "desc" else order_column.asc()

        stmt = (
            select(Student)
            .join(AcademicYear, Student.academic_year_id == AcademicYear.id, isouter=True)
            .join(AdmissionRound, Student.round_id == AdmissionRound.id, isouter=True)
            .where(and_(*base_conditions))
            .order_by(order)
            .offset((req.page - 1) * req.page_size)
            .limit(req.page_size)
        )
        items = (await self.session.scalars(stmt)).all()
        params = PageParams(page=req.page, page_size=req.page_size)
        return Page(items, total, params)

    # ------------------------------------------------------------------
    # Analytics aggregations
    # ------------------------------------------------------------------
    async def kpi_aggregates(self, *, filters: list[Any] | None = None) -> dict[str, int]:
        base = select(func.count()).select_from(Student)
        if filters:
            base = base.where(and_(*filters))
        total = int((await self.session.scalar(base)) or 0)
        return {"total": total}

    async def group_by_field(self, field: str, *, filters: list[Any] | None = None, limit: int = 100) -> list[tuple[str, int]]:
        column = getattr(Student, field)
        stmt = select(column, func.count()).select_from(Student)
        if filters:
            stmt = stmt.where(and_(*filters))
        stmt = stmt.group_by(column).order_by(func.count().desc()).limit(limit)
        rows = (await self.session.execute(stmt)).all()
        return [(str(r[0]) if r[0] is not None else "UNKNOWN", int(r[1])) for r in rows]

    async def count_by_status(self, *, filters: list[Any] | None = None) -> dict[str, int]:
        base_filters = list(filters or [])
        result: dict[str, int] = {}
        for status in AdmissionStatus:
            stmt = select(func.count()).select_from(Student).where(Student.admission_status == status.value)
            if base_filters:
                stmt = stmt.where(and_(*base_filters))
            result[status.value] = int((await self.session.scalar(stmt)) or 0)
        return result

    async def cutoff_buckets(self, *, filters: list[Any] | None = None, bucket_size: float = 10.0) -> list[dict]:
        base = select(Student.cutoff_score).select_from(Student).where(Student.cutoff_score.is_not(None))
        if filters:
            base = base.where(and_(*filters))
        rows = (await self.session.execute(base)).all()
        buckets: dict[tuple[float, float], int] = {}
        for (score,) in rows:
            low = int(score // bucket_size) * bucket_size
            high = low + bucket_size
            key = (low, high)
            buckets[key] = buckets.get(key, 0) + 1
        ordered = sorted(buckets.items(), key=lambda kv: kv[0][0])
        return [
            {"label": f"{low:.0f}-{high:.0f}", "from_value": low, "to_value": high, "count": count}
            for (low, high), count in ordered
        ]

    async def round_wise_trends(self, *, filters: list[Any] | None = None) -> list[dict]:
        stmt = (
            select(AdmissionRound.round_number, func.count(Student.id))
            .join(Student, Student.round_id == AdmissionRound.id)
        )
        if filters:
            stmt = stmt.where(and_(*filters))
        stmt = stmt.group_by(AdmissionRound.round_number).order_by(AdmissionRound.round_number)
        rows = (await self.session.execute(stmt)).all()
        return [{"label": f"Round {r}", "applications": int(c)} for r, c in rows]

    async def monthly_trends(self, *, year: int | None = None) -> list[dict]:
        month_expr = func.to_char(Student.created_at, "Mon") if not self._is_sqlite() else func.strftime("%m", Student.created_at)
        stmt = (
            select(month_expr, func.count(Student.id))
            .select_from(Student)
            .group_by(month_expr)
        )
        if year:
            year_expr = func.date_part("year", Student.created_at) if not self._is_sqlite() else func.strftime("%Y", Student.created_at)
            stmt = stmt.where(year_expr == year)
        rows = (await self.session.execute(stmt)).all()
        return [{"label": str(r[0]), "applications": int(r[1])} for r in rows]

    async def yearly_comparison(self) -> list[dict]:
        if self._is_sqlite():
            year_expr = func.strftime("%Y", Student.created_at)
        else:
            year_expr = func.date_part("year", Student.created_at)
        admitted = func.sum(case((Student.admission_status == AdmissionStatus.ADMITTED.value, 1), else_=0))
        stmt = (
            select(year_expr, func.count(Student.id), admitted)
            .select_from(Student)
            .group_by(year_expr)
            .order_by(year_expr)
        )
        rows = (await self.session.execute(stmt)).all()
        return [
            {"year": str(r[0]), "applications": int(r[1]), "admissions": int(r[2] or 0)}
            for r in rows
        ]

    async def seat_utilization(self, *, academic_year_id: int | None = None) -> dict:
        filters = []
        if academic_year_id:
            filters.append(Student.academic_year_id == academic_year_id)
        admitted = await self.count_by_status(filters=filters)
        seats_filled = admitted.get(AdmissionStatus.ADMITTED.value, 0) + admitted.get(AdmissionStatus.CONFIRMED.value, 0)
        return {
            "total_seats": 0,
            "seats_filled": seats_filled,
            "vacant_seats": 0,
            "utilization_percentage": 0.0,
        }

    async def recent_students(self, limit: int = 10) -> Sequence[Student]:
        stmt = select(Student).order_by(Student.created_at.desc()).limit(limit)
        return (await self.session.scalars(stmt)).all()

    @staticmethod
    def _is_sqlite() -> bool:
        from app.core.config import settings

        return settings.is_sqlite

    async def list_for_export(self, req: StudentSearchRequest, max_rows: int = 10_000) -> list[Student]:
        conditions = self.build_filters(req)
        order_column = self.SORTABLE_FIELDS.get(req.sort_by, Student.created_at)
        order = order_column.desc() if req.sort_order == "desc" else order_column.asc()
        stmt = (
            select(Student)
            .where(and_(*conditions))
            .order_by(order)
            .limit(max_rows)
        )
        return list((await self.session.scalars(stmt)).all())
