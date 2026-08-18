"""Async SQLAlchemy engine + session factory.

Uses connection pooling (defaults tuned for Supabase PostgreSQL via
asyncpg). Falls back to SQLite + aiosqlite for local development/tests.
"""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("app.database")

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def create_engine() -> AsyncEngine:
    """Build the async engine with environment-appropriate options."""
    if settings.is_sqlite:
        return create_async_engine(
            settings.DATABASE_URL,
            echo=settings.DB_ECHO,
            connect_args={"check_same_thread": False},
        )
    return create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DB_ECHO,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_timeout=settings.DB_POOL_TIMEOUT,
        pool_pre_ping=True,
        pool_recycle=1800,
    )


def get_engine() -> AsyncEngine:
    global _engine
    if _engine is None:
        _engine = create_engine()
        logger.debug("Created async engine for %s", "postgres" if not settings.is_sqlite else "sqlite")
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            bind=get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )
    return _session_factory


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an async session.

    Commits on success, rolls back on error. Services may also call
    ``commit()`` explicitly; a second commit is a no-op.
    """
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def dispose_engine() -> None:
    """Gracefully dispose of the engine (called on app shutdown)."""
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None
