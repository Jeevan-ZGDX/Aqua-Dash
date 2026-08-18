"""Student aggregate model - central entity of the analytics platform."""

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import AdmissionStatus, Community, Gender, SchoolType
from app.database.base import Base


class Student(Base):
    __tablename__ = "students"
    __table_args__ = (
        UniqueConstraint("register_number", "academic_year_id", name="uq_student_register_year"),
        UniqueConstraint("application_number", "academic_year_id", name="uq_student_application_year"),
    )

    register_number: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    application_number: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), index=True, nullable=False)

    date_of_birth: Mapped[date | None] = mapped_column(Date)
    gender: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), index=True)
    phone: Mapped[str | None] = mapped_column(String(15), index=True)
    father_name: Mapped[str | None] = mapped_column(String(120))
    mother_name: Mapped[str | None] = mapped_column(String(120))

    district: Mapped[str | None] = mapped_column(String(60), index=True)
    school_type: Mapped[str | None] = mapped_column(String(20), index=True)
    school_name: Mapped[str | None] = mapped_column(String(160))
    community: Mapped[str | None] = mapped_column(String(10), index=True)
    nationality: Mapped[str | None] = mapped_column(String(50), default="INDIAN")

    cutoff_score: Mapped[float | None] = mapped_column(Float, index=True)
    admission_status: Mapped[str] = mapped_column(
        String(20), default=AdmissionStatus.APPLIED.value, index=True, nullable=False
    )

    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), index=True
    )
    academic_year_id: Mapped[int | None] = mapped_column(
        ForeignKey("academic_years.id", ondelete="SET NULL"), index=True
    )
    round_id: Mapped[int | None] = mapped_column(
        ForeignKey("admission_rounds.id", ondelete="SET NULL"), index=True
    )

    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    admission_date: Mapped[date | None] = mapped_column(Date, index=True)
    registered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    department = relationship("Department", back_populates="students", lazy="selectin")
    academic_year = relationship("AcademicYear", back_populates="students", lazy="selectin")
    admission_round = relationship("AdmissionRound", back_populates="students", lazy="selectin")

    academic_detail = relationship(
        "AcademicDetail", back_populates="student", uselist=False, cascade="all, delete-orphan", lazy="selectin"
    )
    admission_detail = relationship(
        "AdmissionDetail", back_populates="student", uselist=False, cascade="all, delete-orphan", lazy="selectin"
    )
    documents = relationship(
        "Document", back_populates="student", cascade="all, delete-orphan", lazy="selectin"
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Student id={self.id} reg={self.register_number}>"
