"""Dashboard API routes: aggregation endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import Permissions
from app.database.session import get_db_session
from app.dependencies.auth import CurrentUser, require_permissions, scoped_by_department
from app.schemas.common import StandardResponse
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import DashboardService
from app.utils.responses import success_response

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "/overview",
    response_model=StandardResponse[dict],
    summary="Dashboard overview",
    description="Aggregated KPI payload: applications, seats, gender split, "
    "admission/confirmation rates and recent activities in a single call.",
)
async def overview(
    academic_year: Optional[str] = Query(None, description="e.g. 2024-2025"),
    department_id: Optional[int] = Depends(scoped_by_department()),
    session: AsyncSession = Depends(get_db_session),
    _: CurrentUser = Depends(require_permissions(Permissions.DASHBOARD_OVERVIEW)),
) -> dict:
    service = DashboardService(session)
    overview_data = await service.overview(department_id=department_id, academic_year=academic_year)
    activities = await service.recent_activities(limit=10)
    payload = DashboardResponse(overview=overview_data, recent_activities=activities).model_dump(mode="json")
    return success_response(data=payload, message="Dashboard overview retrieved.")


@router.get(
    "/recent-activities",
    response_model=StandardResponse[list],
    summary="Recent activities",
    description="Latest audit/activity events for the activity feed.",
)
async def recent_activities(
    limit: int = Query(10, ge=1, le=50),
    session: AsyncSession = Depends(get_db_session),
    _: CurrentUser = Depends(require_permissions(Permissions.DASHBOARD_RECENT)),
) -> dict:
    data = await DashboardService(session).recent_activities(limit=limit)
    return success_response(data=data, message="Recent activities retrieved.")
