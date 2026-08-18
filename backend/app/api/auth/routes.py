"""Auth API routes: login, refresh, logout, token validation."""

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import set_auth_cookies
from app.database.session import get_db_session
from app.schemas.auth import LoginRequest, LoginResponse, LogoutResponse, RefreshRequest, TokenValidationResponse
from app.schemas.common import StandardResponse
from app.services.auth_service import AuthService
from app.utils.rate_limit import login_rate_limit
from app.utils.responses import success_response

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=StandardResponse[LoginResponse],
    summary="Login",
    description="Authenticate a user and issue access + refresh tokens. "
    "Tokens are also set as HTTP-only cookies.",
)
@login_rate_limit()
async def login(payload: LoginRequest, request: Request, response: Response, session: AsyncSession = Depends(get_db_session)) -> dict:
    result = await AuthService(session).login(request, payload)
    set_auth_cookies(
        response,
        result.access_token,
        result.refresh_token,
        result.expires_in,
        result.refresh_expires_in,
    )
    return success_response(data=result.model_dump(mode="json"), message="Login successful.")


@router.post(
    "/refresh",
    response_model=StandardResponse[dict],
    summary="Refresh access token",
    description="Exchange a valid refresh token (body or cookie) for a new token pair.",
)
async def refresh(payload: RefreshRequest, request: Request, response: Response, session: AsyncSession = Depends(get_db_session)) -> dict:
    result = await AuthService(session).refresh(request, payload.refresh_token)
    set_auth_cookies(response, result["access_token"], result["refresh_token"],
                     result["expires_in"], result["refresh_expires_in"])
    return success_response(data=result, message="Token refreshed.")


@router.post(
    "/logout",
    response_model=StandardResponse[LogoutResponse],
    summary="Logout",
    description="Revoke current tokens and clear authentication cookies.",
)
async def logout(request: Request, response: Response, session: AsyncSession = Depends(get_db_session)) -> dict:
    await AuthService(session).logout(request, response)
    return success_response(data=LogoutResponse().model_dump(), message="Logged out successfully.")


@router.post(
    "/verify",
    response_model=StandardResponse[TokenValidationResponse],
    summary="Validate token",
    description="Validate an access token and return the authenticated principal.",
)
async def verify(request: Request, session: AsyncSession = Depends(get_db_session)) -> dict:
    from app.core.exceptions import InvalidTokenError
    from app.core.security import read_access_token

    token = read_access_token(request)
    if not token:
        raise InvalidTokenError("Authentication required.")
    result = await AuthService(session).validate_token(token)
    return success_response(data=result, message="Token is valid.")
