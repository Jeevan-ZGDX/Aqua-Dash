"""Recent activity feed model for the dashboard."""

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Activity(Base):
    __tablename__ = "activities"

    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True)
    action: Mapped[str] = mapped_column(String(60), index=True, nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(40), index=True)
    entity_id: Mapped[int | None] = mapped_column(Integer, index=True)
    description: Mapped[str | None] = mapped_column(String(500))
    ip_address: Mapped[str | None] = mapped_column(String(45))

    user = relationship("User", back_populates="activities", lazy="selectin")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Activity id={self.id} action={self.action}>"
