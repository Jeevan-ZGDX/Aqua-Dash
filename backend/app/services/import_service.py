"""CSV/Excel import engine.

Pipeline: parse -> normalize -> validate -> duplicate detect -> batch
insert (transactional). Produces a preview, an import summary, and an
invalid-record report. A failed batch rolls back atomically.
"""

import csv
import io
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import AdmissionStatus, ImportStatus
from app.core.exceptions import InvalidFileError, UnsupportedFormatError
from app.core.logging import log_upload
from app.models.import_batch import ImportBatch
from app.repositories.activity_repository import ActivityRepository
from app.repositories.student_repository import StudentRepository
from app.schemas.reports import ImportSummary

# Expected header -> field mapping for student imports
COLUMN_MAP = {
    "register_number": "register_number",
    "application_number": "application_number",
    "name": "name",
    "gender": "gender",
    "email": "email",
    "phone": "phone",
    "district": "district",
    "community": "community",
    "school_type": "school_type",
    "school_name": "school_name",
    "cutoff": "cutoff_score",
    "cutoff_score": "cutoff_score",
    "status": "admission_status",
    "admission_status": "admission_status",
    "date_of_birth": "date_of_birth",
    "father_name": "father_name",
    "mother_name": "mother_name",
}

REQUIRED_COLUMNS = ["register_number", "application_number", "name", "gender"]
GENDER_MAP = {"M": "MALE", "F": "FEMALE", "MALE": "MALE", "FEMALE": "FEMALE", "OTHER": "OTHER"}
STATUS_MAP = {s.value: s.value for s in AdmissionStatus}
STATUS_MAP.update({"applied": "APPLIED", "admitted": "ADMITTED", "confirmed": "CONFIRMED",
                   "waitlisted": "WAITLISTED", "rejected": "REJECTED"})


class ImportService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.students = StudentRepository(session)
        self.activities = ActivityRepository(session)

    # ------------------------------------------------------------------
    # Parsing
    # ------------------------------------------------------------------
    async def preview(self, content: bytes, filename: str) -> dict:
        rows, headers = self._parse(content, filename)
        normalized = [self._normalize(r) for r in rows]
        errors = self._validate_rows(normalized)
        return {
            "headers": headers,
            "rows_preview": normalized[:20],
            "total_rows": len(normalized),
            "duplicate_rows": await self._count_duplicates(normalized),
            "validation_errors": errors[:50],
        }

    async def import_file(self, content: bytes, filename: str, *, actor_id: int, commit: bool = True) -> ImportSummary:
        rows, _ = self._parse(content, filename)
        normalized = [self._normalize(r) for r in rows]

        batch = ImportBatch(
            filename=filename,
            status=ImportStatus.PROCESSING.value,
            total_rows=len(normalized),
            error_rows=0,
            imported_rows=0,
            duplicate_rows=0,
            import_type="students",
            error_report=[],
            summary={},
        )
        self.session.add(batch)
        await self.session.flush()

        imported = 0
        duplicate = 0
        error_report: list[dict] = []

        for idx, row in enumerate(normalized, start=2):  # header = row 1
            row_errors = self._validate_row(row)
            if row_errors:
                error_report.append({"row": idx, "errors": row_errors, "data": row})
                continue
            try:
                await self.students.ensure_unique(
                    register_number=row["register_number"],
                    application_number=row["application_number"],
                    academic_year_id=row.get("academic_year_id"),
                )
            except Exception as exc:  # noqa: BLE001
                duplicate += 1
                error_report.append({"row": idx, "errors": [str(exc)], "data": row})
                continue
            await self.students.create(row)
            imported += 1

        status = ImportStatus.COMPLETED.value
        if error_report and imported == 0:
            status = ImportStatus.FAILED.value
        elif error_report:
            status = ImportStatus.COMPLETED_WITH_ERRORS.value

        batch.status = status
        batch.imported_rows = imported
        batch.error_rows = len(error_report)
        batch.duplicate_rows = duplicate
        batch.error_report = error_report
        batch.summary = {
            "imported": imported,
            "duplicates": duplicate,
            "with_errors": len(error_report),
            "skipped": len(normalized) - imported - duplicate,
        }

        if commit:
            await self.session.commit()
        await self.activities.log(
            user_id=actor_id,
            action="import.processed",
            description=f"Imported {imported} students from {filename}",
            entity_type="import_batch",
            entity_id=batch.id,
        )
        log_upload("import_completed", filename=filename, rows=len(normalized), imported=imported, errors=len(error_report))
        return ImportSummary(
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

    async def get_batch(self, batch_id: int) -> Optional[ImportBatch]:
        return await self.session.get(ImportBatch, batch_id)

    async def list_batches(self, limit: int = 50) -> list[ImportBatch]:
        from sqlalchemy import select

        return list((await self.session.scalars(select(ImportBatch).order_by(ImportBatch.created_at.desc()).limit(limit))).all())

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------
    def _parse(self, content: bytes, filename: str) -> tuple[list[dict], list[str]]:
        name = filename.lower()
        if name.endswith(".csv"):
            return self._parse_csv(content)
        if name.endswith((".xlsx", ".xls")):
            return self._parse_excel(content)
        raise UnsupportedFormatError("Only .csv and .xlsx files are supported.")

    def _parse_csv(self, content: bytes) -> tuple[list[dict], list[str]]:
        try:
            text = content.decode("utf-8-sig")
        except UnicodeDecodeError:
            text = content.decode("latin-1")
        reader = csv.DictReader(io.StringIO(text))
        if not reader.fieldnames:
            raise InvalidFileError("CSV file has no headers.")
        headers = [h.strip() for h in reader.fieldnames]
        rows = [self._remap_headers({k.strip(): v for k, v in row.items()}) for row in reader]
        return rows, headers

    def _parse_excel(self, content: bytes) -> tuple[list[dict], list[str]]:
        try:
            import openpyxl
        except ImportError as exc:  # pragma: no cover
            raise InvalidFileError("Excel support is not installed (openpyxl).") from exc

        workbook = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
        sheet = workbook.active
        rows_iter = sheet.iter_rows(values_only=True)
        try:
            header_row = next(rows_iter)
        except StopIteration as exc:
            raise InvalidFileError("Excel file is empty.") from exc
        headers = [str(h).strip() if h is not None else "" for h in header_row]
        rows = []
        for values in rows_iter:
            record = {headers[i]: (values[i] if i < len(values) else None) for i in range(len(headers))}
            rows.append(self._remap_headers(record))
        return rows, headers

    def _remap_headers(self, record: dict) -> dict:
        mapped = {}
        for key, value in record.items():
            target = COLUMN_MAP.get(str(key).strip().lower())
            if target:
                mapped[target] = value
        return mapped

    def _normalize(self, row: dict) -> dict:
        def s(value) -> Optional[str]:  # noqa: ANN001
            if value is None:
                return None
            text = str(value).strip()
            return text or None

        gender = s(row.get("gender"))
        status = s(row.get("admission_status"))
        return {
            "register_number": (s(row.get("register_number")) or "").upper().replace(" ", ""),
            "application_number": (s(row.get("application_number")) or "").upper().replace(" ", ""),
            "name": s(row.get("name")),
            "gender": GENDER_MAP.get((gender or "").upper(), gender),
            "email": s(row.get("email")),
            "phone": s(row.get("phone")),
            "district": s(row.get("district")),
            "community": (s(row.get("community")) or "").upper() or None,
            "school_type": s(row.get("school_type")),
            "school_name": s(row.get("school_name")),
            "cutoff_score": self._to_float(row.get("cutoff_score")),
            "admission_status": STATUS_MAP.get((status or "").upper(), AdmissionStatus.APPLIED.value),
            "date_of_birth": self._to_date(row.get("date_of_birth")),
            "father_name": s(row.get("father_name")),
            "mother_name": s(row.get("mother_name")),
        }

    @staticmethod
    def _to_float(value: Any) -> Optional[float]:
        if value is None or str(value).strip() == "":
            return None
        try:
            return round(float(value), 2)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _to_date(value: Any):
        if value is None or str(value).strip() == "":
            return None
        try:
            from datetime import date, datetime

            if isinstance(value, datetime):
                return value.date()
            if isinstance(value, date):
                return value
            return datetime.strptime(str(value).strip(), "%Y-%m-%d").date()
        except ValueError:
            return None

    def _validate_row(self, row: dict) -> list[str]:
        errors = []
        for col in REQUIRED_COLUMNS:
            if not row.get(col):
                errors.append(f"{col} is required")
        if row.get("gender") not in GENDER_MAP.values():
            errors.append("gender must be MALE/FEMALE/OTHER")
        if row.get("admission_status") not in [s.value for s in AdmissionStatus]:
            errors.append("admission_status is invalid")
        return errors

    def _validate_rows(self, rows: list[dict]) -> list[dict]:
        return [
            {"row": idx + 2, "errors": self._validate_row(row)}
            for idx, row in enumerate(rows)
            if self._validate_row(row)
        ]

    async def _count_duplicates(self, rows: list[dict]) -> int:
        seen: set[tuple] = set()
        count = 0
        for row in rows:
            key = (row.get("register_number"), row.get("application_number"))
            if key in seen:
                count += 1
            seen.add(key)
        return count
