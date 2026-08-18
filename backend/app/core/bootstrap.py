"""Database bootstrap: creates reference data, admin user and defaults."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.constants import Roles
from app.core.logging import get_logger
from app.models.academic_year import AcademicYear
from app.models.department import Department
from app.repositories.activity_repository import ActivityRepository
from app.repositories.reference_repositories import AcademicYearRepository, DepartmentRepository, SettingRepository
from app.repositories.user_repository import UserRepository

logger = get_logger("app.bootstrap")


async def bootstrap_database(session: AsyncSession) -> None:
    """Seed reference data idempotently on application startup."""
    departments = DepartmentRepository(session)
    years = AcademicYearRepository(session)
    users = UserRepository(session)
    settings_repo = SettingRepository(session)
    activities = ActivityRepository(session)

    # CSE department
    cse = await departments.get_by_field("code", "CSE", raise_if_missing=False)
    if cse is None:
        cse = Department(code="CSE", name="Computer Science and Engineering", is_active=True)
        session.add(cse)
        await session.flush()
        logger.info("Seeded department CSE")

    # Active academic year
    active_year = await years.get_by_field("year", "2025-2026", raise_if_missing=False)
    if active_year is None:
        active_year = AcademicYear(year="2025-2026", is_active=True)
        session.add(active_year)
        await session.flush()
        logger.info("Seeded academic year 2025-2026")

    # Admin user
    admin = await users.find_by_email(settings.ADMIN_EMAIL)
    if admin is None:
        admin = await users.create_user(
            username=settings.ADMIN_USERNAME,
            email=settings.ADMIN_EMAIL,
            name=settings.ADMIN_NAME,
            plain_password=settings.ADMIN_PASSWORD,
            role=Roles.AHOD.value,
            department_id=cse.id,
        )
        admin.is_superuser = True
        await session.flush()
        logger.info("Seeded administrator user '%s'", settings.ADMIN_USERNAME)

    # Default settings
    defaults = {
        "total_seats": 120,
        "department_name": cse.name,
        "admission_open": True,
        "enable_cache": settings.CACHE_ENABLED,
    }
    for key, value in defaults.items():
        if await settings_repo.get_value(key) is None:
            await settings_repo.set_value(key, value, f"Default {key}")

    await activities.log(
        user_id=admin.id,
        action="system.bootstrap",
        description="System bootstrapped with reference data",
        entity_type="system",
    )
    await session.commit()
    logger.info("Database bootstrap completed")
