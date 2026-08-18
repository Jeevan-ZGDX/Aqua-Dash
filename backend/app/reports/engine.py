"""Enterprise report generation engine.

Builds typed datasets for each report type, then serializes to CSV,
Excel or PDF. Reports are generated dynamically from live data.
"""

import os
from datetime import datetime
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.constants import AdmissionStatus
from app.core.exceptions import BadRequestError
from app.core.logging import Timer, log_report
from app.repositories.student_repository import StudentRepository
from app.schemas.reports import ReportMetadata, ReportRequest
from app.services.search_service import SearchService

REPORT_NAMES = {
    "admission_summary": "Admission Summary Report",
    "seat_matrix": "Seat Matrix Report",
    "district_analysis": "District Analysis Report",
    "category_analysis": "Category Analysis Report",
    "cutoff_report": "Cutoff Report",
    "academic_statistics": "Academic Statistics Report",
    "student_list": "Student List Report",
    "gender_report": "Gender Report",
    "verification_report": "Verification Report",
}

REPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "reports", "generated")


class ReportEngine:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.students = StudentRepository(session)
        self.search = SearchService(session)

    async def generate(self, request: ReportRequest) -> tuple[bytes, ReportMetadata]:
        builder = getattr(self, f"_build_{request.report_type}", None)
        if builder is None:
            raise BadRequestError(f"Unknown report type: {request.report_type}")
        timer = Timer()
        headers, rows = await builder(request)
        filename = self._filename(request.report_type, request.format)
        content = await self._serialize(request.format, headers, rows, request)
        os.makedirs(REPORT_DIR, exist_ok=True)
        filepath = os.path.join(REPORT_DIR, filename)
        with open(filepath, "wb") as handle:
            handle.write(content)
        log_report("generated", report_type=request.report_type, format_=request.format.value,
                   rows=len(rows), duration_ms=timer.elapsed_ms())
        metadata = ReportMetadata(
            report_type=request.report_type,
            format=request.format.value,
            filename=filename,
            rows=len(rows),
            generated_at=datetime.now().isoformat(),
            size_bytes=len(content),
        )
        return content, metadata

    async def _serialize(self, format_, headers: list[str], rows: list[list], request: ReportRequest) -> bytes:
        from app.reports.formats import to_csv, to_excel, to_pdf

        if format_ == "CSV":
            return to_csv(headers, rows)
        if format_ == "EXCEL":
            return to_excel(headers, rows, sheet_name=request.report_type)
        return to_pdf(REPORT_NAMES.get(request.report_type, "Report"), headers, rows)

    def _filename(self, report_type: str, format_) -> str:
        stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        ext = {"CSV": "csv", "EXCEL": "xlsx", "PDF": "pdf"}[format_.value]
        return f"{report_type}_{stamp}.{ext}"

    def _filters(self, request: ReportRequest) -> list[Any]:
        filters: list[Any] = []
        if request.department_id is not None:
            from app.models.student import Student

            filters.append(Student.department_id == request.department_id)
        if request.round_id is not None:
            from app.models.student import Student

            filters.append(Student.round_id == request.round_id)
        if request.academic_year:
            from app.models.academic_year import AcademicYear
            from app.models.student import Student

            filters.append(Student.academic_year_id == AcademicYear.id)
            filters.append(AcademicYear.year == request.academic_year)
        if request.filters:
            for key, value in request.filters.items():
                filters.append(getattr(Student, key) == value)
        return filters

    # ------------------------------------------------------------------
    # Dataset builders
    # ------------------------------------------------------------------
    async def _build_student_list(self, request: ReportRequest) -> tuple[list[str], list[list]]:
        from app.schemas.search import StudentSearchRequest

        req = StudentSearchRequest(
            academic_year=request.academic_year,
            department_id=request.department_id,
            page=1,
            page_size=100,
        )
        students = await self.search.export_records(req)
        headers = ["Register No", "Application No", "Name", "Gender", "District", "Community",
                   "Cutoff", "Status", "Verified"]
        rows = [
            [s.register_number, s.application_number, s.name, s.gender, s.district,
             s.community, s.cutoff_score, s.admission_status, "Yes" if s.is_verified else "No"]
            for s in students
        ]
        return headers, rows

    async def _build_admission_summary(self, request: ReportRequest) -> tuple[list[str], list[list]]:
        filters = self._filters(request)
        counts = await self.students.count_by_status(filters=filters)
        total = sum(counts.values())
        admitted = counts.get(AdmissionStatus.ADMITTED.value, 0) + counts.get(AdmissionStatus.CONFIRMED.value, 0)
        headers = ["Metric", "Value"]
        rows = [
            ["Total Applications", total],
            ["Admitted", admitted],
            ["Confirmed", counts.get(AdmissionStatus.CONFIRMED.value, 0)],
            ["Waitlisted", counts.get(AdmissionStatus.WAITLISTED.value, 0)],
            ["Rejected", counts.get(AdmissionStatus.REJECTED.value, 0)],
            ["Admission Rate (%)", round(admitted / total * 100, 2) if total else 0],
        ]
        return headers, rows

    async def _build_seat_matrix(self, request: ReportRequest) -> tuple[list[str], list[list]]:
        from app.models.department import Department
        from app.models.student import Student
        from sqlalchemy import func, select

        stmt = (
            select(Department.code, Department.name, func.count(Student.id))
            .join(Student, Student.department_id == Department.id, isouter=True)
            .group_by(Department.code, Department.name)
        )
        rows_raw = (await self.session.execute(stmt)).all()
        headers = ["Department", "Code", "Applied", "Seats", "Filled", "Vacant", "Utilization %"]
        from app.services.dashboard_service import DashboardService

        total_seats = await DashboardService(self.session)._total_seats(request.department_id)
        rows = []
        for code, name, applied in rows_raw:
            filled = min(applied, total_seats)
            rows.append([name, code, applied, total_seats, filled, max(total_seats - filled, 0),
                         round(filled / max(total_seats, 1) * 100, 2)])
        return headers, rows

    async def _build_district_analysis(self, request: ReportRequest) -> tuple[list[str], list[list]]:
        filters = self._filters(request)
        dist = await self.students.group_by_field("district", filters=filters)
        headers = ["District", "Applications", "Percentage %"]
        total = sum(v for _, v in dist)
        rows = [[d, c, round(c / max(total, 1) * 100, 2)] for d, c in dist]
        return headers, rows

    async def _build_category_analysis(self, request: ReportRequest) -> tuple[list[str], list[list]]:
        filters = self._filters(request)
        categories = await self.students.group_by_field("community", filters=filters)
        headers = ["Community", "Applications", "Percentage %"]
        total = sum(v for _, v in categories)
        rows = [[c, count, round(count / max(total, 1) * 100, 2)] for c, count in categories]
        return headers, rows

    async def _build_cutoff_report(self, request: ReportRequest) -> tuple[list[str], list[list]]:
        filters = self._filters(request)
        buckets = await self.students.cutoff_buckets(filters=filters)
        headers = ["Cutoff Range", "Students"]
        rows = [[b["label"], b["count"]] for b in buckets]
        return headers, rows

    async def _build_academic_statistics(self, request: ReportRequest) -> tuple[list[str], list[list]]:
        from app.models.academic_detail import AcademicDetail
        from app.models.student import Student
        from sqlalchemy import func, select

        stmt = select(
            func.avg(AcademicDetail.sslc_percentage),
            func.max(AcademicDetail.sslc_percentage),
            func.avg(AcademicDetail.hsc_percentage),
            func.max(AcademicDetail.hsc_percentage),
        ).join(Student, AcademicDetail.student_id == Student.id)
        if request.department_id is not None:
            stmt = stmt.where(Student.department_id == request.department_id)
        row = (await self.session.execute(stmt)).one()
        headers = ["Metric", "Average", "Maximum"]
        rows = [
            ["SSLC Percentage", self._round(row[0]), self._round(row[1])],
            ["HSC Percentage", self._round(row[2]), self._round(row[3])],
        ]
        return headers, rows

    async def _build_gender_report(self, request: ReportRequest) -> tuple[list[str], list[list]]:
        filters = self._filters(request)
        genders = await self.students.group_by_field("gender", filters=filters)
        headers = ["Gender", "Count", "Percentage %"]
        total = sum(v for _, v in genders)
        rows = [[g, c, round(c / max(total, 1) * 100, 2)] for g, c in genders]
        return headers, rows

    async def _build_verification_report(self, request: ReportRequest) -> tuple[list[str], list[list]]:
        from app.models.student import Student
        from sqlalchemy import and_, func, select

        filters = self._filters(request)
        filters.append(Student.is_verified.is_not(None))
        stmt = (
            select(Student.is_verified, func.count(Student.id))
            .where(and_(*filters))
            .group_by(Student.is_verified)
        )
        rows_raw = (await self.session.execute(stmt)).all()
        headers = ["Verification Status", "Count"]
        rows = [["Verified" if v else "Pending", c] for v, c in rows_raw]
        return headers, rows

    @staticmethod
    def _round(value: Any) -> Any:
        return round(value, 2) if value is not None else None
