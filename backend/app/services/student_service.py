"""Student service: profile aggregation, CRUD, verification, documents."""

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import VerificationStatus
from app.core.exceptions import BadRequestError, ForbiddenError, NotFoundError
from app.core.logging import log_upload
from app.dependencies.auth import CurrentUser
from app.models.academic_detail import AcademicDetail
from app.models.admission_detail import AdmissionDetail
from app.models.document import Document
from app.models.student import Student
from app.repositories.activity_repository import ActivityRepository, AuditLogRepository
from app.repositories.student_repository import StudentRepository
from app.schemas.student import (
    StudentCreateRequest,
    StudentUpdateRequest,
    VerificationUpdateRequest,
)
from app.utils.pagination import Page, PageParams
from app.utils.sanitization import normalize_identifier, sanitize_text


class StudentService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.students = StudentRepository(session)
        self.activities = ActivityRepository(session)
        self.audits = AuditLogRepository(session)

    async def list_students(self, params: PageParams, *, status: Optional[str] = None, department_id: Optional[int] = None) -> Page:
        req = _PagingRequest(page=params.page, page_size=params.page_size, admission_status=status, department_id=department_id)
        return await self.students.search(req)

    async def get_profile(self, student_id: int) -> Student:
        return await self.students.get_profile(student_id)

    async def create_student(self, payload: StudentCreateRequest, actor: CurrentUser, ip: Optional[str] = None) -> Student:
        data = payload.model_dump()
        academic = data.pop("academic_detail", None)
        admission = data.pop("admission_detail", None)
        data["register_number"] = normalize_identifier(data.get("register_number"))
        data["application_number"] = normalize_identifier(data.get("application_number"))
        data["name"] = sanitize_text(data.get("name"))
        for field in ("district", "school_name", "father_name", "mother_name"):
            if data.get(field):
                data[field] = sanitize_text(data[field])

        await self.students.ensure_unique(
            register_number=data["register_number"],
            application_number=data["application_number"],
            academic_year_id=data.get("academic_year_id"),
        )
        student = await self.students.create(data)

        if academic:
            detail = AcademicDetail(student_id=student.id, **academic)
            self.session.add(detail)
        if admission:
            detail = AdmissionDetail(student_id=student.id, **admission)
            self.session.add(detail)

        await self._log(actor, student, ip, "student.create", f"Created student {student.register_number}")
        return await self.students.get_profile(student.id)

    async def update_student(self, student_id: int, payload: StudentUpdateRequest, actor: CurrentUser, ip: Optional[str] = None) -> Student:
        student = await self.students.get(student_id)
        old_snapshot = self._snapshot(student)
        data = payload.model_dump(exclude_unset=True)

        academic = data.pop("academic_detail", None)
        admission = data.pop("admission_detail", None)

        if "name" in data:
            data["name"] = sanitize_text(data["name"])
        updated = await self.students.update(student, data)

        if academic is not None:
            if updated.academic_detail:
                await self._apply_relation(updated.academic_detail, academic)
            else:
                self.session.add(AcademicDetail(student_id=student.id, **academic))
        if admission is not None:
            if updated.admission_detail:
                await self._apply_relation(updated.admission_detail, admission)
            else:
                self.session.add(AdmissionDetail(student_id=student.id, **admission))

        await self.audits.record(
            user_id=actor.id,
            action="student.update",
            entity_type="student",
            entity_id=student.id,
            old_value=old_snapshot,
            new_value=self._snapshot(updated),
            ip_address=ip,
        )
        await self._log(actor, student, ip, "student.update", f"Updated student {student.register_number}")
        return await self.students.get_profile(student.id)

    async def delete_student(self, student_id: int, actor: CurrentUser, ip: Optional[str] = None) -> None:
        student = await self.students.get(student_id)
        await self.students.delete(student)
        await self._log(actor, student, ip, "student.delete", f"Deleted student {student.register_number}", entity_id=student_id)

    async def set_verification(self, student_id: int, payload: VerificationUpdateRequest, actor: CurrentUser, ip: Optional[str] = None) -> Student:
        student = await self.students.get(student_id)
        if actor.role not in ("AHOD", "HOD") and not actor.is_superuser:
            raise ForbiddenError("Only AHOD or HOD can change verification status.")
        await self.students.update(student, {"is_verified": payload.status == VerificationStatus.VERIFIED.value})
        student.is_verified = payload.status == VerificationStatus.VERIFIED.value
        await self.session.flush()
        await self._log(actor, student, ip, "student.verify", f"Verification set to {payload.status} for {student.register_number}")
        return await self.students.get_profile(student.id)

    async def add_document(self, student_id: int, *, document_type: str, filename: str,
                           stored_path: str, mime_type: str, size_bytes: int,
                           remarks: Optional[str], actor: CurrentUser) -> Document:
        student = await self.students.get(student_id)
        doc = Document(
            student_id=student.id,
            document_type=document_type,
            original_filename=filename,
            stored_path=stored_path,
            mime_type=mime_type,
            size_bytes=size_bytes,
            remarks=sanitize_text(remarks),
        )
        self.session.add(doc)
        await self.session.flush()
        log_upload("document_added", filename=filename)
        return doc

    async def verify_document(self, document_id: int, payload: VerificationUpdateRequest, actor: CurrentUser) -> Document:
        from app.models.document import Document as DocModel

        doc = await self.session.get(DocModel, document_id)
        if doc is None:
            raise NotFoundError(f"Document id={document_id} not found.")
        doc.verification_status = payload.status
        doc.verified_by = actor.id
        doc.remarks = payload.remarks
        await self.session.flush()
        return doc

    async def audit_history(self, student_id: int) -> list:
        return await self.audits.list_for_entity("student", student_id)

    async def _log(self, actor: CurrentUser, student: Student, ip: Optional[str], action: str, description: str, entity_id: Optional[int] = None) -> None:
        await self.activities.log(
            user_id=actor.id,
            action=action,
            description=description,
            entity_type="student",
            entity_id=entity_id or student.id,
            ip_address=ip,
        )

    @staticmethod
    async def _apply_relation(instance, values: dict) -> None:  # noqa: D102
        for key, value in values.items():
            if value is not None and hasattr(instance, key):
                setattr(instance, key, value)

    @staticmethod
    def _snapshot(student: Student) -> dict:
        return {
            "register_number": student.register_number,
            "application_number": student.application_number,
            "name": student.name,
            "admission_status": student.admission_status,
            "cutoff_score": student.cutoff_score,
        }


class _PagingRequest:
    """Lightweight stand-in for search schema in list paths."""

    def __init__(self, page: int, page_size: int, admission_status: Optional[str] = None, department_id: Optional[int] = None) -> None:
        from app.schemas.search import StudentSearchRequest

        self._req = StudentSearchRequest(page=page, page_size=page_size)
        self.q = None
        self.register_number = None
        self.application_number = None
        self.name = None
        self.district = None
        self.community = None
        self.gender = None
        self.admission_status = admission_status
        self.cutoff_min = None
        self.cutoff_max = None
        self.academic_year = None
        self.round_number = None
        self.department_id = department_id
        self.sort_by = "created_at"
        self.sort_order = "desc"

    def __getattr__(self, name):  # noqa: D105
        return getattr(self._req, name)
