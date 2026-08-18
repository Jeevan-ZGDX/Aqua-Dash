"""Report generation API routes."""

from typing import Optional

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import Permissions, ReportFormat
from app.database.session import get_db_session
from app.dependencies.auth import CurrentUser, require_permissions
from app.reports.engine import ReportEngine
from app.schemas.common import StandardResponse
from app.schemas.reports import ReportGenerationResult, ReportRequest
from app.utils.responses import success_response

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post(
    "/generate",
    response_model=StandardResponse[ReportGenerationResult],
    summary="Generate a report",
    description="Generate admission summary, seat matrix, district/category analysis, cutoff, "
    "academic statistics, student list, gender or verification report. Returns a downloadable file.",
)
async def generate_report(
    request: ReportRequest,
    session: AsyncSession = Depends(get_db_session),
    _: CurrentUser = Depends(require_permissions(Permissions.REPORT_GENERATE)),
) -> dict:
    content, metadata = await ReportEngine(session).generate(request)
    download_url = f"/api/v1/reports/download/{metadata.filename}"
    return success_response(
        data=ReportGenerationResult(
            report_type=request.report_type,
            format=metadata.format,
            filename=metadata.filename,
            rows=metadata.rows,
            download_url=download_url,
        ).model_dump(),
        message="Report generated.",
    )


@router.get(
    "/download/{filename}",
    summary="Download a generated report",
    description="Serve a previously generated report file (CSV/XLSX/PDF).",
)
async def download_report(
    filename: str,
    session: AsyncSession = Depends(get_db_session),
    _: CurrentUser = Depends(require_permissions(Permissions.REPORT_EXPORT)),
) -> Response:
    import os

    from fastapi.responses import FileResponse

    from app.reports.engine import REPORT_DIR

    safe = os.path.basename(filename)
    path = os.path.join(REPORT_DIR, safe)
    if not os.path.exists(path):
        from app.core.exceptions import NotFoundError

        raise NotFoundError("Report file not found.")
    media_types = {".csv": "text/csv", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".pdf": "application/pdf"}
    ext = os.path.splitext(safe)[1]
    return FileResponse(path, media_type=media_types.get(ext, "application/octet-stream"), filename=safe)


@router.get(
    "/types",
    response_model=StandardResponse[list],
    summary="Available report types",
    description="List report types and supported export formats.",
)
async def report_types(
    _: CurrentUser = Depends(require_permissions(Permissions.REPORT_GENERATE)),
) -> dict:
    from app.reports.engine import REPORT_NAMES

    data = [
        {"type": key, "label": label, "formats": [f.value for f in ReportFormat]}
        for key, label in REPORT_NAMES.items()
    ]
    return success_response(data=data, message="Report types retrieved.")
