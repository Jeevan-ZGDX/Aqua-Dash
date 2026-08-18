"""Health check endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.database.session import get_db_session
from app.utils.responses import success_response

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Liveness check")
async def health() -> dict:
    return success_response(
        data={
            "status": "ok",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.APP_ENV,
        },
        message="Service is healthy.",
    )


@router.get("/health/db", summary="Database connectivity check")
async def db_health(session: AsyncSession = Depends(get_db_session)) -> dict:
    await session.execute(text("SELECT 1"))
    return success_response(data={"database": "connected"}, message="Database is reachable.")
