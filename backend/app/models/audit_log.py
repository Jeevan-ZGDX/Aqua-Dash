"""Audit log capturing before/after values for sensitive mutations."""

from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True)
    action: Mapped[str] = mapped_column(String(60), index=True, nullable=False)
    entity_type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    entity_id: Mapped[int | None] = mapped_column(index=True)
    old_value: Mapped[dict | None] = mapped_column(JSON)
    new_value: Mapped[dict | None] = mapped_column(JSON)
    ip_address: Mapped[str | None] = mapped_column(String(45))

    def __repr__(self) -> str:  # pragma: no cover
        return f"<AuditLog id={self.id} action={self.action} entity={self.entity_type}>"
