"""Generic async base repository.

Provides type-safe CRUD primitives. Feature repositories inherit and add
domain-specific queries. All database access in the application flows
through repository instances.
"""

from typing import Any, Dict, Generic, Optional, Sequence, Type, TypeVar

from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.base import Base
from app.core.exceptions import NotFoundError

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    """Abstract data-access layer for a single ORM model."""

    model: Type[ModelT]

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------
    async def get(self, obj_id: int, *, raise_if_missing: bool = True) -> Optional[ModelT]:
        result = await self.session.get(self.model, obj_id)
        if result is None and raise_if_missing:
            raise NotFoundError(f"{self.model.__name__} with id={obj_id} not found.")
        return result

    async def get_by_field(
        self, field: str, value: Any, *, raise_if_missing: bool = True
    ) -> Optional[ModelT]:
        column = getattr(self.model, field)
        result = await self.session.scalar(select(self.model).where(column == value))
        if result is None and raise_if_missing:
            raise NotFoundError(f"{self.model.__name__} with {field}={value!r} not found.")
        return result

    async def list_all(self, *, limit: int = 1000) -> Sequence[ModelT]:
        result = await self.session.scalars(select(self.model).limit(limit))
        return result.all()

    async def exists(self, field: str, value: Any) -> bool:
        column = getattr(self.model, field)
        result = await self.session.scalar(select(func.count()).select_from(self.model).where(column == value))
        return bool(result and result > 0)

    async def count(self, *filters: Any) -> int:
        stmt = select(func.count()).select_from(self.model)
        if filters:
            stmt = stmt.where(*filters)
        result = await self.session.scalar(stmt)
        return int(result or 0)

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------
    async def create(self, data: dict | BaseModel) -> ModelT:
        payload = data.model_dump(exclude_unset=True) if isinstance(data, BaseModel) else data
        instance = self.model(**payload)
        self.session.add(instance)
        await self.session.flush()
        return instance

    async def update(self, instance: ModelT, data: dict | BaseModel) -> ModelT:
        payload = data.model_dump(exclude_unset=True) if isinstance(data, BaseModel) else data
        for key, value in payload.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
        await self.session.flush()
        return instance

    async def delete(self, instance: ModelT) -> None:
        await self.session.delete(instance)
        await self.session.flush()

    async def delete_by_id(self, obj_id: int) -> None:
        instance = await self.get(obj_id)
        await self.delete(instance)

    async def refresh(self, instance: ModelT) -> ModelT:
        await self.session.refresh(instance)
        return instance
