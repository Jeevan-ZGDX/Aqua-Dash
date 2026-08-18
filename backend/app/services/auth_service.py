"""Authentication service: login, refresh, logout, token validation."""

from datetime import datetime, timezone
from typing import Optional

from fastapi import Request, Response

from app.core.constants import Limits
from app.core.exceptions import (
    InactiveAccountError,
    InvalidCredentialsError,
    InvalidTokenError,
)
from app.core.logging import log_auth
from app.core.security import (
    TOKEN_TYPE_ACCESS,
    TOKEN_TYPE_REFRESH,
    clear_auth_cookies,
    create_access_token,
    create_refresh_token,
    decode_token,
    read_refresh_token,
    revoke_token,
    set_auth_cookies,
    verify_password,
)
from app.repositories.activity_repository import ActivityRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, LoginResponse, UserSummary


class AuthService:
    def __init__(self, session) -> None:  # noqa: ANN001
        self.session = session
        self.users = UserRepository(session)
        self.activities = ActivityRepository(session)

    async def login(self, request: Request, payload: LoginRequest) -> LoginResponse:
        identifier = payload.get_identifier()
        user = await self.users.find_by_username_or_email(identifier)
        if user is None or not verify_password(payload.password, user.hashed_password):
            log_auth("login_failed", username=identifier, success=False, detail="bad credentials")
            raise InvalidCredentialsError("Invalid username or password.")

        if not user.is_active:
            raise InactiveAccountError("This account has been disabled.")

        if user.locked_until and user.locked_until > datetime.now(timezone.utc):
            raise InvalidCredentialsError(
                "Account temporarily locked due to too many failed attempts."
            )

        ip = request.client.host if request.client else None
        await self.users.record_login_success(user, ip)
        await self.activities.log(
            user_id=user.id,
            action="auth.login",
            description=f"User {user.username} logged in",
            ip_address=ip,
        )

        access_token, access_exp = create_access_token(str(user.id), extra={"role": user.role})
        refresh_token, refresh_exp = create_refresh_token(str(user.id))
        log_auth("login_success", username=user.username, success=True)
        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=access_exp,
            refresh_expires_in=refresh_exp,
            user=UserSummary.model_validate(user),
        )

    async def refresh(self, request: Request, token: Optional[str] = None) -> dict:
        refresh_token = token or read_refresh_token(request)
        if not refresh_token:
            raise InvalidTokenError("Refresh token required.")
        payload = decode_token(refresh_token, expected_type=TOKEN_TYPE_REFRESH)
        user_id = int(payload.get("sub", 0))
        user = await self.users.get(user_id, raise_if_missing=False)
        if user is None or not user.is_active:
            raise InvalidTokenError("Account not found or inactive.")

        access_token, access_exp = create_access_token(str(user.id), extra={"role": user.role})
        new_refresh, refresh_exp = create_refresh_token(str(user.id))
        revoke_token(refresh_token)  # rotate old refresh token
        return {
            "access_token": access_token,
            "refresh_token": new_refresh,
            "token_type": "bearer",
            "expires_in": access_exp,
            "refresh_expires_in": refresh_exp,
        }

    async def logout(self, request: Request, response: Response, access_token: Optional[str] = None) -> None:
        token = access_token or request.cookies.get("access_token")
        if token:
            revoke_token(token)
        refresh_token = read_refresh_token(request)
        if refresh_token:
            revoke_token(refresh_token)
        clear_auth_cookies(response)
        log_auth("logout", success=True)

    async def validate_token(self, token: str) -> dict:
        payload = decode_token(token, expected_type=TOKEN_TYPE_ACCESS)
        user = await self.users.get(int(payload.get("sub", 0)), raise_if_missing=False)
        if user is None or not user.is_active:
            raise InvalidTokenError("Account not found or inactive.")
        return {
            "valid": True,
            "user_id": user.id,
            "username": user.username,
            "role": user.role,
            "expires_at": datetime.fromtimestamp(payload["exp"], tz=timezone.utc).isoformat(),
        }

    async def login_attempts_remaining(self, username: str) -> int:
        user = await self.users.find_by_username_or_email(username.strip())
        if user is None:
            return Limits.MAX_LOGIN_ATTEMPTS
        return max(0, Limits.MAX_LOGIN_ATTEMPTS - (user.failed_login_attempts or 0))
