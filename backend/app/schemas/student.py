"""Student domain schemas (profile, academic, admission, documents, audit)."""

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field, model_validator

from app.core.constants import AdmissionStatus, Community, DocumentType, Gender, SchoolType
from app.schemas.common import ORMModel
from app.validators.rules import (
    valid_academic_year,
    valid_aadhaar,
    valid_phone,
    valid_pincode,
)


# ----------------------------------------------------------------------
# Nested schemas
# ----------------------------------------------------------------------
class AcademicDetailIn(BaseModel):
    sslc_year: Optional[int] = Field(None, ge=1970, le=2100)
    sslc_marks: Optional[float] = Field(None, ge=0)
    sslc_percentage: Optional[float] = Field(None, ge=0, le=100)
    hsc_year: Optional[int] = Field(None, ge=1970, le=2100)
    hsc_marks: Optional[float] = Field(None, ge=0)
    hsc_percentage: Optional[float] = Field(None, ge=0, le=100)
    maths_mark: Optional[float] = Field(None, ge=0)
    physics_mark: Optional[float] = Field(None, ge=0)
    chemistry_mark: Optional[float] = Field(None, ge=0)
    subject_group: Optional[str] = Field(None, max_length=80)
    board: Optional[str] = Field(None, max_length=60)


class AcademicDetailOut(ORMModel):
    id: int
    student_id: int
    sslc_year: Optional[int]
    sslc_percentage: Optional[float]
    hsc_year: Optional[int]
    hsc_percentage: Optional[float]
    maths_mark: Optional[float]
    physics_mark: Optional[float]
    chemistry_mark: Optional[float]
    subject_group: Optional[str]
    board: Optional[str]


class AdmissionDetailIn(BaseModel):
    admission_number: Optional[str] = Field(None, max_length=30)
    fee_paid: bool = False
    fee_amount: Optional[float] = Field(None, ge=0)
    confirmation_date: Optional[date] = None
    joined: bool = False
    dropped: bool = False
    drop_reason: Optional[str] = Field(None, max_length=255)
    remarks: Optional[str] = Field(None, max_length=500)


class AdmissionDetailOut(ORMModel):
    id: int
    student_id: int
    admission_number: Optional[str]
    fee_paid: bool
    fee_amount: Optional[float]
    confirmation_date: Optional[date]
    joined: bool
    dropped: bool
    drop_reason: Optional[str]
    remarks: Optional[str]


class DocumentOut(ORMModel):
    id: int
    student_id: int
    document_type: str
    original_filename: str
    mime_type: Optional[str]
    size_bytes: Optional[int]
    verification_status: str
    verified_at: Optional[datetime]
    remarks: Optional[str]


class StudentBase(BaseModel):
    register_number: str = Field(..., min_length=4, max_length=20)
    application_number: str = Field(..., min_length=4, max_length=20)
    name: str = Field(..., min_length=2, max_length=120)
    date_of_birth: Optional[date] = None
    gender: Gender
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=15)
    father_name: Optional[str] = Field(None, max_length=120)
    mother_name: Optional[str] = Field(None, max_length=120)
    district: Optional[str] = Field(None, max_length=60)
    school_type: Optional[SchoolType] = None
    school_name: Optional[str] = Field(None, max_length=160)
    community: Optional[Community] = None
    nationality: Optional[str] = Field(None, max_length=50)
    cutoff_score: Optional[float] = Field(None, ge=0, le=200)
    admission_status: AdmissionStatus = AdmissionStatus.APPLIED
    department_id: Optional[int] = None
    academic_year_id: Optional[int] = None
    round_id: Optional[int] = None
    admission_date: Optional[date] = None

    _phone = valid_phone("phone")


class StudentCreateRequest(StudentBase):
    academic_detail: Optional[AcademicDetailIn] = None
    admission_detail: Optional[AdmissionDetailIn] = None

    @model_validator(mode="after")
    def _cross_validate(self):  # noqa: ANN202
        if self.academic_detail and self.academic_detail.sslc_percentage is not None:
            if self.academic_detail.sslc_percentage > 100:
                raise ValueError("sslc_percentage must be <= 100")
        return self


class StudentUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    date_of_birth: Optional[date] = None
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=15)
    father_name: Optional[str] = Field(None, max_length=120)
    mother_name: Optional[str] = Field(None, max_length=120)
    district: Optional[str] = Field(None, max_length=60)
    school_type: Optional[SchoolType] = None
    school_name: Optional[str] = Field(None, max_length=160)
    community: Optional[Community] = None
    cutoff_score: Optional[float] = Field(None, ge=0, le=200)
    admission_status: Optional[AdmissionStatus] = None
    round_id: Optional[int] = None
    admission_date: Optional[date] = None
    academic_detail: Optional[AcademicDetailIn] = None
    admission_detail: Optional[AdmissionDetailIn] = None

    _phone = valid_phone("phone")


class StudentListOut(ORMModel):
    id: int
    register_number: str
    application_number: str
    name: str
    gender: str
    district: Optional[str]
    community: Optional[str]
    cutoff_score: Optional[float]
    admission_status: str
    is_verified: bool
    created_at: datetime


class StudentProfileOut(ORMModel):
    id: int
    register_number: str
    application_number: str
    name: str
    date_of_birth: Optional[date]
    gender: str
    email: Optional[str]
    phone: Optional[str]
    father_name: Optional[str]
    mother_name: Optional[str]
    district: Optional[str]
    school_type: Optional[str]
    school_name: Optional[str]
    community: Optional[str]
    nationality: Optional[str]
    cutoff_score: Optional[float]
    admission_status: str
    is_verified: bool
    admission_date: Optional[date]
    created_at: datetime
    updated_at: datetime
    department: Optional[dict]
    academic_year: Optional[dict]
    admission_round: Optional[dict]
    academic_detail: Optional[AcademicDetailOut]
    admission_detail: Optional[AdmissionDetailOut]
    documents: List[DocumentOut] = []


class DocumentUploadMetadata(BaseModel):
    document_type: DocumentType
    remarks: Optional[str] = Field(None, max_length=255)


class VerificationUpdateRequest(BaseModel):
    status: str = Field(..., pattern="^(PENDING|VERIFIED|REJECTED|NOT_REQUIRED)$")
    remarks: Optional[str] = Field(None, max_length=255)


class AuditEntryOut(ORMModel):
    id: int
    action: str
    entity_type: str
    entity_id: Optional[int]
    old_value: Optional[dict]
    new_value: Optional[dict]
    created_at: datetime
