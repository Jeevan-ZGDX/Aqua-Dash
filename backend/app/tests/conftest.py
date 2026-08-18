"""Pytest conftest: test configuration, fixtures & factory helpers.

Uses SQLite (aiosqlite) for fast, isolated test runs.  A single
function-scoped ``db_env`` engine owns the schema lifecycle and is
depended on by both the direct ``session`` fixture and the ``client``
fixture, guaranteeing tables exist before any test code runs.
"""

import os
from typing import AsyncGenerator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

# ----------------------------------------------------------------------
# Force test settings *before* importing any app code
# ----------------------------------------------------------------------
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
os.environ["APP_ENV"] = "testing"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-override-32chars"
os.environ["RATE_LIMIT_ENABLED"] = "false"
os.environ["CACHE_ENABLED"] = "false"

TEST_DB_URL = "sqlite+aiosqlite:///./test.db"


@pytest_asyncio.fixture
async def db_env() -> AsyncGenerator[AsyncEngine, None]:
    """Fresh schema for every test, dropped afterwards.

    Also binds the application's global engine to this fixture engine so
    API requests share the same database file across tests.
    """
    import app.core.database as database_module
    import app.models  # noqa: F401  (registers all tables on Base.metadata)
    from app.database.base import Base

    engine = create_async_engine(TEST_DB_URL, echo=False)
    previous_engine = database_module._engine
    previous_factory = database_module._session_factory
    database_module._engine = engine
    database_module._session_factory = None

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    database_module._engine = previous_engine
    database_module._session_factory = previous_factory

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
    try:
        os.remove("test.db")
    except OSError:
        pass


@pytest_asyncio.fixture
async def session(db_env: AsyncEngine) -> AsyncGenerator[AsyncSession, None]:
    """Async SQLAlchemy session for direct repository/service tests."""
    factory = async_sessionmaker(db_env, class_=AsyncSession, expire_on_commit=False)
    async with factory() as s:
        yield s


@pytest_asyncio.fixture
async def client(db_env: AsyncEngine) -> AsyncGenerator[AsyncClient, None]:
    """Async HTTP client for end-to-end API tests."""
    from app.main import app

    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


# ----------------------------------------------------------------------
# Auth header fixtures (commit so the app's own session can see them)
# ----------------------------------------------------------------------
@pytest_asyncio.fixture
async def admin_headers(session: AsyncSession) -> dict:
    from app.core.security import create_access_token, hash_password
    from app.models.department import Department
    from app.models.user import User

    dept = Department(code="CSE", name="Computer Science and Engineering", is_active=True)
    session.add(dept)
    await session.flush()

    user = User(
        username="admin", email="admin@test.com", name="Admin User",
        hashed_password=hash_password("Admin@12345"), role="AHOD",
        department_id=dept.id, is_active=True, is_superuser=True,
    )
    session.add(user)
    await session.flush()
    await session.commit()

    token, _ = create_access_token(str(user.id), extra={"role": "AHOD"})
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def hod_headers(session: AsyncSession) -> dict:
    from app.core.security import create_access_token, hash_password
    from app.models.department import Department
    from app.models.user import User

    dept = Department(code="CSE", name="Computer Science and Engineering", is_active=True)
    session.add(dept)
    await session.flush()

    user = User(
        username="hod", email="hod@test.com", name="HOD User",
        hashed_password=hash_password("Hod123456"), role="HOD",
        department_id=dept.id, is_active=True,
    )
    session.add(user)
    await session.flush()
    await session.commit()

    token, _ = create_access_token(str(user.id), extra={"role": "HOD"})
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def cse_department(session: AsyncSession):
    from sqlalchemy import select

    from app.models.department import Department

    existing = await session.scalar(select(Department).where(Department.code == "CSE"))
    if existing:
        return existing
    dept = Department(code="CSE", name="CSE", is_active=True)
    session.add(dept)
    await session.flush()
    await session.commit()
    return dept


@pytest_asyncio.fixture
async def academic_year(session: AsyncSession):
    from sqlalchemy import select

    from app.models.academic_year import AcademicYear

    existing = await session.scalar(select(AcademicYear).where(AcademicYear.year == "2024-2025"))
    if existing:
        return existing
    year = AcademicYear(year="2024-2025", is_active=True)
    session.add(year)
    await session.flush()
    await session.commit()
    return year