"""Document metadata attached to a student."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import VerificationStatus
from app.database.base import Base


class Document(Base):
    __tablename__ = "documents"

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"), index=True, nullable=False
    )
    document_type: Mapped[str] = mapped_column(String(30), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_path: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(80))
    size_bytes: Mapped[int | None] = mapped_column(Integer)

    verification_status: Mapped[str] = mapped_column(
        String(20), default=VerificationStatus.PENDING.value, index=True, nullable=False
    )
    verified_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    remarks: Mapped[str | None] = mapped_column(String(255))

    student = relationship("Student", back_populates="documents", lazy="selectin")
    verifier = relationship("User", lazy="selectin")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Document id={self.id} type={self.document_type}>"
