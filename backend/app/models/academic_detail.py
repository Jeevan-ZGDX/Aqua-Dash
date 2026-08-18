"""Academic details (marks) associated with a student (1:1)."""

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class AcademicDetail(Base):
    __tablename__ = "academic_details"

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )

    sslc_year: Mapped[int | None] = mapped_column(Integer)
    sslc_marks: Mapped[float | None] = mapped_column(Float)
    sslc_percentage: Mapped[float | None] = mapped_column(Float, index=True)

    hsc_year: Mapped[int | None] = mapped_column(Integer)
    hsc_marks: Mapped[float | None] = mapped_column(Float)
    hsc_percentage: Mapped[float | None] = mapped_column(Float, index=True)

    maths_mark: Mapped[float | None] = mapped_column(Float)
    physics_mark: Mapped[float | None] = mapped_column(Float)
    chemistry_mark: Mapped[float | None] = mapped_column(Float)

    subject_group: Mapped[str | None] = mapped_column(String(80))
    board: Mapped[str | None] = mapped_column(String(60))

    student = relationship("Student", back_populates="academic_detail", lazy="selectin")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<AcademicDetail student_id={self.student_id}>"
