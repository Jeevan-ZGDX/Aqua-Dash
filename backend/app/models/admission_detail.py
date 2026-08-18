"""Admission-specific details for a student (1:1)."""

from datetime import date

from sqlalchemy import Boolean, Date, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class AdmissionDetail(Base):
    __tablename__ = "admission_details"

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )

    admission_number: Mapped[str | None] = mapped_column(String(30), unique=True, index=True)
    fee_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    fee_amount: Mapped[float | None] = mapped_column(Float)
    confirmation_date: Mapped[date | None] = mapped_column(Date, index=True)
    joined: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    dropped: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    drop_reason: Mapped[str | None] = mapped_column(String(255))
    remarks: Mapped[str | None] = mapped_column(String(500))

    student = relationship("Student", back_populates="admission_detail", lazy="selectin")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<AdmissionDetail student_id={self.student_id}>"
