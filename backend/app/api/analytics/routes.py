"""Analytics API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.analytics.engine import AnalyticsEngine
from app.core.constants import Permissions
from app.database.session import get_db_session
from app.dependencies.auth import CurrentUser, require_permissions
from app.dependencies.params import analytics_scope_params
from app.schemas.common import StandardResponse
from app.utils.responses import success_response

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/summary",
    response_model=StandardResponse[dict],
    summary="Analytics summary",
    description="Dynamic analytics: admission/acceptance rates, department, community, gender, "
    "school-type and district distributions, cutoff analysis, seat utilization, vacancy, "
    "round-wise and monthly trends, and yearly comparison. Computed live from database records.",
)
async def analytics_summary(
    scope: dict = Depends(analytics_scope_params),
    session: AsyncSession = Depends(get_db_session),
    _: CurrentUser = Depends(require_permissions(Permissions.ANALYTICS_READ)),
) -> dict:
    payload = await AnalyticsEngine(session).run(**scope)
    return success_response(data=payload, message="Analytics computed.")


@router.get(
    "/distribution/{field}",
    response_model=StandardResponse[list],
    summary="Single-dimension distribution",
    description="Distribution for one dimension: gender, community, district, school_type.",
)
async def distribution(
    field: str,
    scope: dict = Depends(analytics_scope_params),
    session: AsyncSession = Depends(get_db_session),
    _: CurrentUser = Depends(require_permissions(Permissions.ANALYTICS_READ)),
) -> dict:
    if field not in ("gender", "community", "district", "school_type"):
        from app.core.exceptions import BadRequestError

        raise BadRequestError("field must be one of: gender, community, district, school_type.")
    from app.repositories.student_repository import StudentRepository

    repo = StudentRepository(session)
    engine = AnalyticsEngine(session)
    filters = engine.compose_filters(**scope)
    data = await repo.group_by_field(field, filters=filters)
    total = sum(v for _, v in data)
    payload = [
        {"label": label, "value": count, "percentage": round(count / max(total, 1) * 100, 2)}
        for label, count in data
    ]
    return success_response(data=payload, message=f"{field} distribution computed.")
