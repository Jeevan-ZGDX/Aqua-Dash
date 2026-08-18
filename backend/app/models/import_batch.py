"""Import batch tracking for the CSV/Excel import engine."""

from sqlalchemy import Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class ImportBatch(Base):
    __tablename__ = "import_batches"

    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    total_rows: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    imported_rows: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_rows: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    duplicate_rows: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    import_type: Mapped[str | None] = mapped_column(String(40))
    error_report: Mapped[list | None] = mapped_column(JSON)
    summary: Mapped[dict | None] = mapped_column(JSON)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<ImportBatch id={self.id} status={self.status}>"
