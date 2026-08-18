"""Activity feed and audit log repositories."""

from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import Activity
from app.models.audit_log import AuditLog
from app.models.user import User
from app.repositories.base import BaseRepository


class ActivityRepository(BaseRepository[Activity]):
    model = Activity

    async def log(self, *, user_id: Optional[int], action: str, description: str,
                  entity_type: Optional[str] = None, entity_id: Optional[int] = None,
                  ip_address: Optional[str] = None) -> Activity:
        entry = Activity(
            user_id=user_id,
            action=action,
            description=description,
            entity_type=entity_type,
            entity_id=entity_id,
            ip_address=ip_address,
        )
        self.session.add(entry)
        await self.session.flush()
        return entry

    async def recent(self, limit: int = 10) -> list[dict]:
        stmt = (
            select(Activity, User.name, User.role)
            .join(User, Activity.user_id == User.id, isouter=True)
            .order_by(Activity.created_at.desc())
            .limit(limit)
        )
        rows = (await self.session.execute(stmt)).all()
        return [
            {
                "id": a.id,
                "action": a.action,
                "description": a.description,
                "user_name": user_name,
                "user_role": user_role,
                "entity_type": a.entity_type,
                "created_at": a.created_at.isoformat(),
            }
            for a, user_name, user_role in rows
        ]

    async def count(self) -> int:
        return int((await self.session.scalar(select(func.count()).select_from(Activity))) or 0)


class AuditLogRepository(BaseRepository[AuditLog]):
    model = AuditLog

    async def record(self, *, user_id: Optional[int], action: str, entity_type: str,
                     entity_id: Optional[int] = None, old_value: Optional[dict] = None,
                     new_value: Optional[dict] = None, ip_address: Optional[str] = None) -> AuditLog:
        entry = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
        )
        self.session.add(entry)
        await self.session.flush()
        return entry

    async def list_for_entity(self, entity_type: str, entity_id: int, limit: int = 100) -> Sequence[AuditLog]:
        stmt = (
            select(AuditLog)
            .where(AuditLog.entity_type == entity_type, AuditLog.entity_id == entity_id)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        return (await self.session.scalars(stmt)).all()
