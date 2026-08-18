"""Key/value application settings stored in the database."""

from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class AppSetting(Base):
    __tablename__ = "app_settings"

    key: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    value: Mapped[dict | None] = mapped_column(JSON)
    description: Mapped[str | None] = mapped_column(String(255))

    def __repr__(self) -> str:  # pragma: no cover
        return f"<AppSetting key={self.key}>"
