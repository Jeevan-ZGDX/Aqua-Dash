"""Domain models for the CSE Admissions Analytics Dashboard."""

from app.models.user import User
from app.models.department import Department
from app.models.academic_year import AcademicYear
from app.models.admission_round import AdmissionRound
from app.models.student import Student
from app.models.academic_detail import AcademicDetail
from app.models.admission_detail import AdmissionDetail
from app.models.document import Document
from app.models.activity import Activity
from app.models.audit_log import AuditLog
from app.models.import_batch import ImportBatch
from app.models.app_setting import AppSetting

__all__ = [
    "User",
    "Department",
    "AcademicYear",
    "AdmissionRound",
    "Student",
    "AcademicDetail",
    "AdmissionDetail",
    "Document",
    "Activity",
    "AuditLog",
    "ImportBatch",
    "AppSetting",
]
