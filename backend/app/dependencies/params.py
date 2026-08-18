"""Query-parameter dependencies: pagination and analytics scope."""

from typing import Optional

from fastapi import Depends, Query

from app.dependencies.auth import scoped_by_department
from app.utils.pagination import PageParams


def pagination_params(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
) -> PageParams:
    return PageParams(page=page, page_size=page_size)


def analytics_scope_params(
    academic_year: Optional[str] = Query(None, description="e.g. 2024-2025"),
    department_id: Optional[int] = Query(None, description="Filter by department"),
    round_id: Optional[int] = Query(None, description="Filter by admission round"),
    scope_dept: Optional[int] = Depends(scoped_by_department()),
) -> dict:
    """Resolve the effective analytics scope, applying RBAC department scoping."""
    effective_department = scope_dept if scope_dept is not None else department_id
    return {
        "academic_year": academic_year,
        "department_id": effective_department,
        "round_id": round_id,
    }
