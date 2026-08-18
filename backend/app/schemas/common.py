"""Shared/common schemas: standard envelope, pagination, ORM config."""

from typing import Any, Dict, Generic, List, Optional, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ORMModel(BaseModel):
    """Base schema configured to serialize SQLAlchemy ORM objects."""

    model_config = ConfigDict(from_attributes=True)


class Pagination(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int
    has_next: bool
    has_prev: bool


class StandardResponse(BaseModel, Generic[T]):
    """Standard JSON envelope returned by every endpoint."""

    status: str
    message: str
    data: Optional[T] = None
    pagination: Optional[Pagination] = None
    meta: Optional[Dict[str, Any]] = None
    timestamp: str
    request_id: Optional[str] = None


class MessageOut(BaseModel):
    message: str


class KeyValueOut(BaseModel):
    key: str
    value: Any
