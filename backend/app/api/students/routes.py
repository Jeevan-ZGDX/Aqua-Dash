"""Student API routes: profile CRUD, verification, documents, audit history."""

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.constants import Permissions
from app.core.exceptions import InvalidFileError
from app.database.session import get_db_session
from app.dependencies.auth import CurrentUser, require_permissions
from app.dependencies.params import pagination_params
from app.schemas.common import StandardResponse
from app.schemas.student import (
    DocumentOut,
    StudentCreateRequest,
    StudentProfileOut,
    StudentUpdateRequest,
    VerificationUpdateRequest,
)
from app.services.student_service import StudentService
from app.utils.pagination import PageParams
from app.utils.responses import build_pagination, success_response

router = APIRouter(prefix="/students", tags=["Students"])


@router.get(
    "",
    response_model=StandardResponse[list],
    summary="List students",
    description="Paginated list of students with optional status filter.",
)
async def list_students(
    params: PageParams = Depends(pagination_params),
    status: str | None = None,
    session: AsyncSession = Depends(get_db_session),
    _: CurrentUser = Depends(require_permissions(Permissions.STUDENT_LIST)),
) -> dict:
    page = await StudentService(session).list_students(params, status=status)
    data = [_student_row(s) for s in page.items]
    pagination = build_pagination(page=page.page, page_size=page.page_size, total=page.total)
    return success_response(data=data, pagination=pagination, message="Students retrieved.")


@router.get(
    "/search",
    response_model=StandardResponse[list],
    summary="Search students",
    description="Search students by any combination of fields.",
)
async def search_students(
    q: str | None = None,
    register_number: str | None = None,
    application_number: str | None = None,
    name: str | None = None,
    district: str | None = None,
    community: str | None = None,
    gender: str | None = None,
    admission_status: str | None = None,
    cutoff_min: float | None = None,
    cutoff_max: float | None = None,
    academic_year: str | None = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    params: PageParams = Depends(pagination_params),
    session: AsyncSession = Depends(get_db_session),
    _: CurrentUser = Depends(require_permissions(Permissions.SEARCH_GLOBAL)),
) -> dict:
    from app.schemas.search import StudentSearchRequest

    req = StudentSearchRequest(
        q=q, register_number=register_number, application_number=application_number,
        name=name, district=district, community=community, gender=gender,
        admission_status=admission_status, cutoff_min=cutoff_min, cutoff_max=cutoff_max,
        academic_year=academic_year, sort_by=sort_by, sort_order=sort_order,
        page=params.page, page_size=params.page_size,
    )
    from app.services.search_service import SearchService

    page = await SearchService(session).search_students(req)
    data = [_student_row(s) for s in page.items]
    pagination = build_pagination(page=page.page, page_size=page.page_size, total=page.total)
    return success_response(data=data, pagination=pagination, message="Search completed.")


@router.get(
    "/{student_id}",
    response_model=StandardResponse[StudentProfileOut],
    summary="Get student profile",
    description="Aggregated profile: personal, academic, admission, community and document details.",
)
async def get_student(
    student_id: int,
    session: AsyncSession = Depends(get_db_session),
    _: CurrentUser = Depends(require_permissions(Permissions.STUDENT_READ)),
) -> dict:
    student = await StudentService(session).get_profile(student_id)
    return success_response(
        data=_profile_dict(student), message="Student profile retrieved."
    )


@router.post(
    "",
    response_model=StandardResponse[StudentProfileOut],
    summary="Create student",
    description="Create a student with optional academic and admission details.",
    status_code=201,
)
async def create_student(
    payload: StudentCreateRequest,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
    actor: CurrentUser = Depends(require_permissions(Permissions.STUDENT_CREATE)),
) -> dict:
    student = await StudentService(session).create_student(payload, actor, _ip(request))
    return success_response(data=_profile_dict(student), message="Student created.")


@router.patch(
    "/{student_id}",
    response_model=StandardResponse[StudentProfileOut],
    summary="Update student",
    description="Partially update a student's details.",
)
async def update_student(
    student_id: int,
    payload: StudentUpdateRequest,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
    actor: CurrentUser = Depends(require_permissions(Permissions.STUDENT_UPDATE)),
) -> dict:
    student = await StudentService(session).update_student(student_id, payload, actor, _ip(request))
    return success_response(data=_profile_dict(student), message="Student updated.")


@router.delete(
    "/{student_id}",
    response_model=StandardResponse[None],
    summary="Delete student",
)
async def delete_student(
    student_id: int,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
    actor: CurrentUser = Depends(require_permissions(Permissions.STUDENT_DELETE)),
) -> dict:
    await StudentService(session).delete_student(student_id, actor, _ip(request))
    return success_response(data=None, message="Student deleted.")


@router.post(
    "/{student_id}/verify",
    response_model=StandardResponse[StudentProfileOut],
    summary="Set verification status",
)
async def verify_student(
    student_id: int,
    payload: VerificationUpdateRequest,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
    actor: CurrentUser = Depends(require_permissions(Permissions.STUDENT_VERIFY)),
) -> dict:
    student = await StudentService(session).set_verification(student_id, payload, actor, _ip(request))
    return success_response(data=_profile_dict(student), message="Verification status updated.")


@router.get(
    "/{student_id}/documents",
    response_model=StandardResponse[list],
    summary="List student documents",
)
async def list_documents(
    student_id: int,
    session: AsyncSession = Depends(get_db_session),
    _: CurrentUser = Depends(require_permissions(Permissions.STUDENT_DOCUMENTS)),
) -> dict:
    student = await StudentService(session).get_profile(student_id)
    docs = [DocumentOut.model_validate(d, from_attributes=True).model_dump(mode="json") for d in student.documents]
    return success_response(data=docs, message="Documents retrieved.")


@router.post(
    "/{student_id}/documents",
    response_model=StandardResponse[DocumentOut],
    summary="Upload student document",
)
async def upload_document(
    student_id: int,
    request: Request,
    file: UploadFile = File(...),
    document_type: str = Form(...),
    remarks: str | None = Form(None),
    session: AsyncSession = Depends(get_db_session),
    actor: CurrentUser = Depends(require_permissions(Permissions.STUDENT_DOCUMENTS)),
) -> dict:
    from app.utils.sanitization import safe_filename

    content = await file.read()
    if len(content) > settings.max_upload_bytes:
        raise InvalidFileError(f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB} MB.")
    ext = "." + (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in settings.ALLOWED_DOCUMENT_EXTENSIONS:
        raise InvalidFileError(f"File type {ext} not allowed for documents.")
    stored_path = await _store_file(content, safe_filename(file.filename or "document"))
    doc = await StudentService(session).add_document(
        student_id, document_type=document_type, filename=safe_filename(file.filename or "document"),
        stored_path=stored_path, mime_type=file.content_type, size_bytes=len(content),
        remarks=remarks, actor=actor,
    )
    return success_response(data=DocumentOut.model_validate(doc, from_attributes=True).model_dump(mode="json"), message="Document uploaded.")


@router.patch(
    "/documents/{document_id}/verify",
    response_model=StandardResponse[DocumentOut],
    summary="Verify a document",
)
async def verify_document(
    document_id: int,
    payload: VerificationUpdateRequest,
    session: AsyncSession = Depends(get_db_session),
    actor: CurrentUser = Depends(require_permissions(Permissions.STUDENT_VERIFY)),
) -> dict:
    doc = await StudentService(session).verify_document(document_id, payload, actor)
    return success_response(data=DocumentOut.model_validate(doc, from_attributes=True).model_dump(mode="json"), message="Document verified.")


@router.get(
    "/{student_id}/audit",
    response_model=StandardResponse[list],
    summary="Student audit history",
)
async def audit_history(
    student_id: int,
    session: AsyncSession = Depends(get_db_session),
    _: CurrentUser = Depends(require_permissions(Permissions.STUDENT_READ)),
) -> dict:
    entries = await StudentService(session).audit_history(student_id)
    data = [
        {
            "id": e.id, "action": e.action, "entity_type": e.entity_type,
            "entity_id": e.entity_id, "old_value": e.old_value,
            "new_value": e.new_value, "created_at": e.created_at.isoformat(),
        }
        for e in entries
    ]
    return success_response(data=data, message="Audit history retrieved.")


# ----------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------
def _ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def _student_row(s) -> dict:
    return {
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


def _profile_dict(s) -> dict:
    dept = {"id": s.department.id, "code": s.department.code, "name": s.department.name} if s.department else None
    year = {"id": s.academic_year.id, "year": s.academic_year.year} if s.academic_year else None
    round_ = {"id": s.admission_round.id, "round_number": s.admission_round.round_number} if s.admission_round else None
    return {
        "id": s.id,
        "register_number": s.register_number,
        "application_number": s.application_number,
        "name": s.name,
        "date_of_birth": s.date_of_birth.isoformat() if s.date_of_birth else None,
        "gender": s.gender,
        "email": s.email,
        "phone": s.phone,
        "father_name": s.father_name,
        "mother_name": s.mother_name,
        "district": s.district,
        "school_type": s.school_type,
        "school_name": s.school_name,
        "community": s.community,
        "nationality": s.nationality,
        "cutoff_score": s.cutoff_score,
        "admission_status": s.admission_status,
        "is_verified": s.is_verified,
        "admission_date": s.admission_date.isoformat() if s.admission_date else None,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
        "department": dept,
        "academic_year": year,
        "admission_round": round_,
        "academic_detail": {
            "id": s.academic_detail.id,
            "student_id": s.academic_detail.student_id,
            "sslc_year": s.academic_detail.sslc_year,
            "sslc_percentage": s.academic_detail.sslc_percentage,
            "hsc_year": s.academic_detail.hsc_year,
            "hsc_percentage": s.academic_detail.hsc_percentage,
            "maths_mark": s.academic_detail.maths_mark,
            "physics_mark": s.academic_detail.physics_mark,
            "chemistry_mark": s.academic_detail.chemistry_mark,
            "subject_group": s.academic_detail.subject_group,
            "board": s.academic_detail.board,
        } if s.academic_detail else None,
        "admission_detail": {
            "id": s.admission_detail.id,
            "student_id": s.admission_detail.student_id,
            "admission_number": s.admission_detail.admission_number,
            "fee_paid": s.admission_detail.fee_paid,
            "fee_amount": s.admission_detail.fee_amount,
            "confirmation_date": s.admission_detail.confirmation_date.isoformat() if s.admission_detail.confirmation_date else None,
            "joined": s.admission_detail.joined,
            "dropped": s.admission_detail.dropped,
            "drop_reason": s.admission_detail.drop_reason,
            "remarks": s.admission_detail.remarks,
        } if s.admission_detail else None,
        "documents": [
            {
                "id": d.id, "student_id": d.student_id, "document_type": d.document_type,
                "original_filename": d.original_filename, "mime_type": d.mime_type,
                "size_bytes": d.size_bytes, "verification_status": d.verification_status,
                "verified_at": d.verified_at.isoformat() if d.verified_at else None,
                "remarks": d.remarks,
            }
            for d in (s.documents or [])
        ],
    }


async def _store_file(content: bytes, filename: str) -> str:
    import os
    import uuid

    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "..", "uploads", "documents")
    os.makedirs(upload_dir, exist_ok=True)
    stored = f"{uuid.uuid4().hex}_{filename}"
    path = os.path.join(upload_dir, stored)
    with open(path, "wb") as handle:
        handle.write(content)
    return stored
