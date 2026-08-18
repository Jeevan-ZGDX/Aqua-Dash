"""Academic year reference model (e.g. 2024-2025)."""

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class AcademicYear(Base):
    __tablename__ = "academic_years"

    year: Mapped[str] = mapped_column(String(9), unique=True, index=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    students = relationship("Student", back_populates="academic_year", lazy="selectin")
    rounds = relationship("AdmissionRound", back_populates="academic_year", lazy="selectin")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<AcademicYear id={self.id} year={self.year}>"
