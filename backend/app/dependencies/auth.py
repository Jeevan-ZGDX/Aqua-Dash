"""Auth dependencies: current-user injection and RBAC guards.

Route handlers receive an authenticated ``CurrentUser`` and optionally
declare permission requirements via ``require_permissions(...)``.
"""

from functools import wraps
from typing import Any, Callable, List, Optional

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import ROLE_PERMISSIONS, Roles
from app.core.exceptions import ForbiddenError, InvalidTokenError
from app.core.logging import bind_user_to_logs
from app.core.security import TOKEN_TYPE_ACCESS, decode_token, read_access_token
from app.database.session import get_db_session
from app.models.user import User
from app.repositories.user_repository import UserRepository


class CurrentUser:
    """Authenticated principal injected into protected endpoints."""

    def __init__(self, user: User) -> None:
        self.user = user
        self.id = user.id
        self.username = user.username
        self.email = user.email
        self.name = user.name
        self.role = user.role
        self.department_id = user.department_id
        self.is_superuser = user.is_superuser

    @property
    def permissions(self) -> set[str]:
        return set(ROLE_PERMISSIONS.get(Roles(self.role), set()))

    def has_permission(self, permission: str) -> bool:
        if self.is_superuser:
            return True
        return permission in self.permissions

    def __repr__(self) -> str:  # pragma: no cover
        return f"<CurrentUser id={self.id} role={self.role}>"


async def get_current_user(
    request: Request,
    session: AsyncSession = Depends(get_db_session),
) -> CurrentUser:
    """Decode the access token, load the user, and inject it."""
    token = read_access_token(request)
    if not token:
        raise InvalidTokenError("Authentication required.")
    payload = decode_token(token, expected_type=TOKEN_TYPE_ACCESS)
    user_id = int(payload.get("sub", 0))
    user = await UserRepository(session).get(user_id, raise_if_missing=False)
    if user is None or not user.is_active:
        raise InvalidTokenError("Account not found or inactive.")
    bind_user_to_logs(str(user.id))
    return CurrentUser(user)


def require_permissions(*permissions: str) -> Callable:
    """Route guard verifying all listed permissions are granted."""

    def dependency(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        missing = [p for p in permissions if not current_user.has_permission(p)]
        if missing:
            raise ForbiddenError(
                f"Missing required permission(s): {', '.join(missing)}.",
                code="PERMISSION_DENIED",
            )
        return current_user

    return dependency


def require_roles(*roles: str) -> Callable:
    """Route guard restricting access to one of the given roles."""

    def dependency(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in roles and not current_user.is_superuser:
            raise ForbiddenError(
                f"Access restricted to roles: {', '.join(roles)}.",
                code="ROLE_DENIED",
            )
        return current_user

    return dependency


def scoped_by_department() -> Callable:
    """Build a filter limiting analytics to the current user's department.

    AHOD/superusers are not department-scoped.
    """

    def dependency(current_user: CurrentUser = Depends(get_current_user)) -> Optional[int]:
        if current_user.is_superuser or current_user.role == Roles.AHOD.value:
            return None
        return current_user.department_id

    return dependency
