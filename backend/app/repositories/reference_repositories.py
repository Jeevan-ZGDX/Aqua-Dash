"""Reference-data repositories: departments, academic years, rounds, settings."""

from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateRecordError, NotFoundError
from app.models.academic_year import AcademicYear
from app.models.admission_round import AdmissionRound
from app.models.app_setting import AppSetting
from app.models.department import Department
from app.models.import_batch import ImportBatch
from app.repositories.base import BaseRepository


class DepartmentRepository(BaseRepository[Department]):
    model = Department

    async def ensure_unique_code(self, code: str, exclude_id: Optional[int] = None) -> None:
        stmt = select(Department).where(Department.code == code)
        if exclude_id:
            stmt = stmt.where(Department.id != exclude_id)
        if await self.session.scalar(stmt):
            raise DuplicateRecordError(f"Department code '{code}' already exists.")


class AcademicYearRepository(BaseRepository[AcademicYear]):
    model = AcademicYear

    async def get_active(self) -> Optional[AcademicYear]:
        return await self.session.scalar(select(AcademicYear).where(AcademicYear.is_active.is_(True)))

    async def get_or_create(self, year: str) -> AcademicYear:
        existing = await self.session.scalar(select(AcademicYear).where(AcademicYear.year == year))
        if existing:
            return existing
        instance = AcademicYear(year=year, is_active=True)
        self.session.add(instance)
        await self.session.flush()
        return instance


class AdmissionRoundRepository(BaseRepository[AdmissionRound]):
    model = AdmissionRound

    async def get_active_round(self, academic_year_id: int | None) -> Optional[AdmissionRound]:
        stmt = select(AdmissionRound).where(AdmissionRound.is_active.is_(True))
        if academic_year_id:
            stmt = stmt.where(AdmissionRound.academic_year_id == academic_year_id)
        return await self.session.scalar(stmt)

    async def ensure_unique_round(self, academic_year_id: int, round_number: int, exclude_id: Optional[int] = None) -> None:
        stmt = select(AdmissionRound).where(
            AdmissionRound.academic_year_id == academic_year_id,
            AdmissionRound.round_number == round_number,
        )
        if exclude_id:
            stmt = stmt.where(AdmissionRound.id != exclude_id)
        if await self.session.scalar(stmt):
            raise DuplicateRecordError(f"Round {round_number} already exists for this academic year.")


class SettingRepository(BaseRepository[AppSetting]):
    model = AppSetting

    async def get_value(self, key: str, default=None):  # noqa: ANN001
        instance = await self.session.scalar(select(AppSetting).where(AppSetting.key == key))
        return instance.value if instance else default

    async def set_value(self, key: str, value, description: Optional[str] = None) -> AppSetting:  # noqa: ANN001
        instance = await self.session.scalar(select(AppSetting).where(AppSetting.key == key))
        if instance:
            instance.value = value
            if description is not None:
                instance.description = description
        else:
            instance = AppSetting(key=key, value=value, description=description)
            self.session.add(instance)
        await self.session.flush()
        return instance

    async def all_settings(self) -> Sequence[AppSetting]:
        return (await self.session.scalars(select(AppSetting).order_by(AppSetting.key))).all()


class ImportBatchRepository(BaseRepository):
    model = ImportBatch
