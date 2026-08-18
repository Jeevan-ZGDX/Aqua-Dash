"""Authentication schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.core.constants import Roles
from app.schemas.common import ORMModel
from app.validators.rules import strong_password


class LoginRequest(BaseModel):
    username: Optional[str] = Field(None, min_length=2, max_length=50, description="Username")
    email: Optional[str] = Field(None, max_length=255, description="Email address")
    password: str = Field(..., min_length=1, description="Plain-text password")

    def get_identifier(self) -> str:
        """Return the username or email for authentication."""
        if self.email:
            return self.email.strip()
        if self.username:
            return self.username.strip()
        raise ValueError("Either username or email is required.")


class RefreshRequest(BaseModel):
    refresh_token: Optional[str] = Field(
        None, description="Refresh token. Falls back to HTTP-only cookie if omitted."
    )


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_expires_in: int


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_expires_in: int
    user: "UserSummary"


class UserSummary(ORMModel):
    id: int
    username: str
    email: str
    name: str
    role: str
    department_id: Optional[int] = None
    is_active: bool


class UserCreateRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: str = Field(..., max_length=255)
    name: str = Field(..., min_length=2, max_length=120)
    password: str = Field(..., min_length=8, max_length=128)
    role: Roles
    department_id: Optional[int] = None

    _password = strong_password("password")


class UserUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    email: Optional[str] = Field(None, max_length=255)
    role: Optional[Roles] = None
    department_id: Optional[int] = None
    is_active: Optional[bool] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)

    _password = strong_password("new_password")


class TokenValidationResponse(BaseModel):
    valid: bool
    user_id: Optional[int] = None
    username: Optional[str] = None
    role: Optional[str] = None
    expires_at: Optional[datetime] = None


class LogoutResponse(BaseModel):
    message: str = "Successfully logged out."


LoginResponse.model_rebuild()
