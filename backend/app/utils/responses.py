"""Response serialization utilities.

Standard JSON envelope used by every endpoint:

    {
      "status": "success",
      "message": "...",
      "data": {...},
      "pagination": {...},
      "timestamp": "...",
      "request_id": "..."
    }
"""

from datetime import datetime, timezone
from typing import Any, Dict, Generic, List, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def success_response(
    *,
    data: Any = None,
    message: str = "Success",
    pagination: Optional[Dict[str, Any]] = None,
    meta: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None,
) -> Dict[str, Any]:
    body: Dict[str, Any] = {
        "status": "success",
        "message": message,
        "data": data,
        "pagination": pagination,
        "meta": meta,
        "timestamp": utc_now_iso(),
        "request_id": request_id,
    }
    return body


def error_response(
    *,
    message: str,
    code: str,
    status_code: int,
    details: Any = None,
    request_id: Optional[str] = None,
) -> Dict[str, Any]:
    body: Dict[str, Any] = {
        "status": "error",
        "message": message,
        "code": code,
        "details": details,
        "status_code": status_code,
        "timestamp": utc_now_iso(),
        "request_id": request_id,
    }
    return body


def build_pagination(
    *,
    page: int,
    page_size: int,
    total: int,
) -> Dict[str, Any]:
    total_pages = (total + page_size - 1) // page_size if page_size else 0
    return {
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }


class PaginatedData(BaseModel, Generic[T]):
    """Typed container for paginated payloads."""

    items: List[T]
    total: int
    page: int
    page_size: int
