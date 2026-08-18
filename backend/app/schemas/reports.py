"""Report generation and file import schemas."""

from typing import Dict, List, Optional

from pydantic import BaseModel, Field

from app.core.constants import ReportFormat


# ----------------------------------------------------------------------
# Reports
# ----------------------------------------------------------------------
class ReportRequest(BaseModel):
    report_type: str = Field(..., pattern="^(admission_summary|seat_matrix|district_analysis|category_analysis|cutoff_report|academic_statistics|student_list|gender_report|verification_report)$")
    format: ReportFormat = ReportFormat.CSV
    academic_year: Optional[str] = None
    department_id: Optional[int] = None
    round_id: Optional[int] = None
    filters: Optional[Dict[str, object]] = None


class ReportMetadata(BaseModel):
    report_type: str
    format: str
    filename: str
    rows: int
    generated_at: str
    size_bytes: int


class ReportGenerationResult(BaseModel):
    report_type: str
    format: str
    filename: str
    rows: int
    download_url: str


# ----------------------------------------------------------------------
# Imports
# ----------------------------------------------------------------------
class ImportPreviewRequest(BaseModel):
    filename: str
    rows: int
    columns: List[str]
    total_rows: int


class ImportPreviewResult(BaseModel):
    headers: List[str]
    rows_preview: List[dict]
    total_rows: int
    duplicate_rows: int
    validation_errors: List[dict]


class ImportSummary(BaseModel):
    batch_id: int
    filename: str
    status: str
    total_rows: int
    imported_rows: int
    error_rows: int
    duplicate_rows: int
    error_report: Optional[List[dict]]
    summary: Optional[Dict]
