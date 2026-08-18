"""Application settings service."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.repositories.reference_repositories import SettingRepository
from app.schemas.settings import SettingUpdate
from app.utils.cache import invalidate


class SettingsService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = SettingRepository(session)

    async def get_all(self) -> list[dict]:
        entries = await self.repo.all_settings()
        return [{"key": e.key, "value": e.value, "description": e.description} for e in entries]

    async def get(self, key: str):
        return await self.repo.get_value(key)

    async def update(self, key: str, payload: SettingUpdate) -> dict:
        entry = await self.repo.set_value(key, payload.value, payload.description)
        invalidate("dashboard:overview")
        invalidate("analytics:summary")
        return {"key": entry.key, "value": entry.value, "description": entry.description}

    async def app_config(self) -> dict:
        return {
            "app_name": settings.APP_NAME,
            "app_version": settings.APP_VERSION,
            "environment": settings.APP_ENV,
            "features": {
                "rate_limiting": settings.RATE_LIMIT_ENABLED,
                "caching": settings.CACHE_ENABLED,
                "auth": True,
                "analytics": True,
                "reports": True,
                "imports": True,
            },
        }

    async def seed_defaults(self) -> None:
        defaults = {
            "total_seats": 120,
            "department_name": "Computer Science and Engineering",
            "admission_open": True,
        }
        for key, value in defaults.items():
            if await self.repo.get_value(key) is None:
                await self.repo.set_value(key, value, f"Default {key}")
        await self.session.commit()
