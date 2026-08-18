"""Department model. The architecture is department-scoped so additional
departments can be added without restructuring."""

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Department(Base):
    __tablename__ = "departments"

    code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    users = relationship("User", back_populates="department", lazy="selectin")
    students = relationship("Student", back_populates="department", lazy="selectin")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Department id={self.id} code={self.code}>"
