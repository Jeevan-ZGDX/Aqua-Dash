"""Application configuration loaded from environment variables.

Uses pydantic-settings to provide strongly typed, validated settings.
All secrets live in the environment / .env file and are never committed.
"""

from functools import lru_cache
from typing import List, Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.constants import Roles


class Settings(BaseSettings):
    """Centralised application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "CSE Admissions Analytics Dashboard"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    TIMEZONE: str = "Asia/Kolkata"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./cse_admissions.db"
    DATABASE_URL_SYNC: Optional[str] = None
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_ECHO: bool = False

    # JWT
    JWT_SECRET_KEY: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ISSUER: str = "cse-admissions-analytics-dashboard"
    JWT_AUDIENCE: str = "nextjs-frontend"

    # Security
    BCRYPT_ROUNDS: int = 12
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    ALLOWED_HOSTS: List[str] = ["*"]
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: Optional[str] = None

    # Rate limiting
    RATE_LIMIT_ENABLED: bool = True
    LOGIN_RATE_LIMIT: str = "10/minute"
    GENERAL_RATE_LIMIT: str = "120/minute"

    # Caching
    CACHE_ENABLED: bool = True
    CACHE_TTL_SECONDS: int = 120
    REDIS_URL: Optional[str] = None

    # Uploads
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_IMPORT_EXTENSIONS: List[str] = [".csv", ".xlsx"]
    ALLOWED_DOCUMENT_EXTENSIONS: List[str] = [".pdf", ".jpg", ".jpeg", ".png"]

    # Admin bootstrap
    ADMIN_EMAIL: str = "admin@cse.edu"
    ADMIN_USERNAME: str = "admin"
    ADMIN_NAME: str = "Department Administrator"
    ADMIN_PASSWORD: str = "ChangeMe!123"

    # Bootstrap roles
    BOOTSTRAP_ROLES: List[str] = [Roles.AHOD, Roles.HOD, Roles.FACULTY, Roles.ADMINISTRATOR, Roles.READ_ONLY]

    # ------------------------------------------------------------------
    # Derived helpers
    # ------------------------------------------------------------------
    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    @property
    def access_token_expire_seconds(self) -> int:
        return self.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    @property
    def refresh_token_expire_seconds(self) -> int:
        return self.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _parse_list(cls, value):  # noqa: ANN001
        if isinstance(value, str):
            return [item.strip() for item in value.strip("[]").split(",") if item.strip()]
        return value

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def _warn_on_default_secret(cls, value: str) -> str:
        if value == "change-me":
            raise ValueError(
                "JWT_SECRET_KEY must be set to a strong random value in production. "
                "Use: python -c \"import secrets; print(secrets.token_urlsafe(64))\""
            )
        return value


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached Settings instance (read once per process)."""
    return Settings()


settings = get_settings()
