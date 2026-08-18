"""Centralized search API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import Permissions
from app.database.session import get_db_session
from app.dependencies.auth import CurrentUser, require_permissions
from app.schemas.common import StandardResponse
from app.schemas.search import StudentSearchRequest
from app.services.search_service import SearchService
from app.utils.responses import build_pagination, success_response

router = APIRouter(prefix="/search", tags=["Search"])


@router.post(
    "/students",
    response_model=StandardResponse[list],
    summary="Search students",
    description="Generic, column-aware search with pagination, sorting and filtering. "
    "Supports global query, register/application number, name, district, community, "
    "gender, status, cutoff range, academic year and round.",
)
async def search_students(
    payload: StudentSearchRequest,
    session: AsyncSession = Depends(get_db_session),
    _: CurrentUser = Depends(require_permissions(Permissions.SEARCH_GLOBAL)),
) -> dict:
    page = await SearchService(session).search_students(payload)
    data = [
        {
            "id": s.id,
            "register_number": s.register_number,
            "application_number": s.application_number,
            "name": s.name,
            "gender": s.gender,
            "district": s.district,
            "community": s.community,
            "cutoff_score": s.cutoff_score,
            "admission_status": s.admission_status,
            "is_verified": s.is_verified,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in page.items
    ]
    pagination = build_pagination(page=page.page, page_size=page.page_size, total=page.total)
    return success_response(data=data, pagination=pagination, message="Search completed.")
