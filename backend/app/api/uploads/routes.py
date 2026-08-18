"""File import API routes: CSV/Excel upload, preview, and batch status."""

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.constants import Permissions
from app.core.exceptions import InvalidFileError
from app.database.session import get_db_session
from app.dependencies.auth import CurrentUser, require_permissions
from app.schemas.common import StandardResponse
from app.schemas.reports import ImportPreviewResult, ImportSummary
from app.services.import_service import ImportService
from app.utils.responses import success_response

router = APIRouter(prefix="/imports", tags=["File Import"])


@router.post(
    "/preview",
    response_model=StandardResponse[ImportPreviewResult],
    summary="Preview an import file",
    description="Parse a CSV/Excel file, validate rows and detect duplicates before importing.",
)
async def preview_import(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db_session),
    _: CurrentUser = Depends(require_permissions(Permissions.IMPORT_CREATE)),
) -> dict:
    content = await file.read()
    filename = file.filename or "import"
    _validate_file(filename, len(content))
    result = await ImportService(session).preview(content, filename)
    return success_response(data=result, message="Preview generated.")


@router.post(
    "/upload",
    response_model=StandardResponse[ImportSummary],
    summary="Import students from file",
    description="Batch-import students from CSV/Excel with validation, duplicate detection "
    "and transactional rollback on failure. Returns an import summary.",
)
async def import_file(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db_session),
    actor: CurrentUser = Depends(require_permissions(Permissions.IMPORT_CREATE)),
) -> dict:
    content = await file.read()
    filename = file.filename or "import"
    _validate_file(filename, len(content))
    summary = await ImportService(session).import_file(content, filename, actor_id=actor.id)
    return success_response(data=summary.model_dump(mode="json"), message="Import processed.")


@router.get(
    "/batches/{batch_id}",
    response_model=StandardResponse[ImportSummary],
    summary="Get import batch status",
)
async def batch_status(
    batch_id: int,
    session: AsyncSession = Depends(get_db_session),
    _: CurrentUser = Depends(require_permissions(Permissions.IMPORT_READ)),
) -> dict:
    from app.core.exceptions import NotFoundError

    batch = await ImportService(session).get_batch(batch_id)
    if batch is None:
        raise NotFoundError("Import batch not found.")
    summary = ImportSummary(
        batch_id=batch.id,
        filename=batch.filename,
        status=batch.status,
        total_rows=batch.total_rows,
        imported_rows=batch.imported_rows,
        error_rows=batch.error_rows,
        duplicate_rows=batch.duplicate_rows,
        error_report=batch.error_report,
        summary=batch.summary,
    )
    return success_response(data=summary.model_dump(mode="json"), message="Batch status retrieved.")


def _validate_file(filename: str, size: int) -> None:
    ext = "." + (filename.rsplit(".", 1)[-1].lower() if "." in filename else "")
    if ext not in settings.ALLOWED_IMPORT_EXTENSIONS:
        raise InvalidFileError(f"Unsupported file type '{ext}'. Allowed: {', '.join(settings.ALLOWED_IMPORT_EXTENSIONS)}")
    if size > settings.max_upload_bytes:
        raise InvalidFileError(f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB} MB.")
