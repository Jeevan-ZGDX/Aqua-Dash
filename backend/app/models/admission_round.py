"""Admission round model (counselling round within an academic year)."""

from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class AdmissionRound(Base):
    __tablename__ = "admission_rounds"

    academic_year_id: Mapped[int] = mapped_column(
        ForeignKey("academic_years.id", ondelete="CASCADE"), index=True, nullable=False
    )
    round_number: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(60), nullable=False)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    academic_year = relationship("AcademicYear", back_populates="rounds", lazy="selectin")
    students = relationship("Student", back_populates="admission_round", lazy="selectin")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<AdmissionRound id={self.id} round={self.round_number} year={self.academic_year_id}>"
