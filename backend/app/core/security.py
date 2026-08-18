"""Security primitives: password hashing, JWT tokens, secure cookies.

- bcrypt for password hashing
- PyJWT for access/refresh tokens (signed HS256)
- HttpOnly cookie helpers for the Next.js frontend
"""

import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
import jwt
from fastapi import Request, Response

from app.core.config import settings
from app.core.exceptions import (
    InvalidTokenError,
    TokenExpiredError,
    TokenRevokedError,
)

TOKEN_TYPE_ACCESS = "access"
TOKEN_TYPE_REFRESH = "refresh"

# In-memory denylist (JTI) for revoked refresh tokens. Swap for Redis in
# multi-instance deployments by implementing TokenStore protocol.
_revoked_jti: set[str] = set()


# ----------------------------------------------------------------------
# Password hashing
# ----------------------------------------------------------------------
def hash_password(plain_password: str) -> str:
    salt = bcrypt.gensalt(rounds=settings.BCRYPT_ROUNDS)
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except ValueError:
        return False


# ----------------------------------------------------------------------
# Token primitives
# ----------------------------------------------------------------------
def _base_claims(subject: str, token_type: str) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    return {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "nbf": now,
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "jti": secrets.token_urlsafe(16),
    }


def create_access_token(subject: str, *, extra: Optional[Dict[str, Any]] = None) -> tuple[str, int]:
    """Return (access_token, expires_in_seconds)."""
    claims = _base_claims(subject, TOKEN_TYPE_ACCESS)
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    claims["exp"] = expires
    claims.update(extra or {})
    token = jwt.encode(claims, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, settings.access_token_expire_seconds


def create_refresh_token(subject: str) -> tuple[str, int]:
    claims = _base_claims(subject, TOKEN_TYPE_REFRESH)
    expires = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    claims["exp"] = expires
    token = jwt.encode(claims, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, settings.refresh_token_expire_seconds


def decode_token(token: str, expected_type: Optional[str] = None) -> Dict[str, Any]:
    """Decode and validate a JWT. Raises typed exceptions on failure."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            audience=settings.JWT_AUDIENCE,
            issuer=settings.JWT_ISSUER,
        )
    except jwt.ExpiredSignatureError as exc:
        raise TokenExpiredError("Token has expired.") from exc
    except jwt.InvalidTokenError as exc:
        raise InvalidTokenError("Invalid token.") from exc

    if payload.get("jti") in _revoked_jti:
        raise TokenRevokedError("Token has been revoked.")

    if expected_type and payload.get("type") != expected_type:
        raise InvalidTokenError("Unexpected token type.")
    return payload


def revoke_token(token: str) -> None:
    """Add a token's jti to the denylist (logout flow)."""
    try:
        payload = decode_token(token)
    except InvalidTokenError:
        return
    _revoked_jti.add(payload["jti"])


# ----------------------------------------------------------------------
# Cookie helpers (HttpOnly, SameSite, Secure-aware)
# ----------------------------------------------------------------------
_COOKIE_ACCESS = "access_token"
_COOKIE_REFRESH = "refresh_token"


def set_auth_cookies(response: Response, access_token: str, refresh_token: str, access_exp: int, refresh_exp: int) -> None:
    common = dict(
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN or None,
        path="/",
    )
    response.set_cookie(_COOKIE_ACCESS, access_token, max_age=access_exp, **common)
    response.set_cookie(_COOKIE_REFRESH, refresh_token, max_age=refresh_exp, **common)


def clear_auth_cookies(response: Response) -> None:
    common = dict(
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN or None,
        path="/",
    )
    response.delete_cookie(_COOKIE_ACCESS, **common)
    response.delete_cookie(_COOKIE_REFRESH, **common)


def read_access_token(request: Request) -> Optional[str]:
    """Resolve access token from Authorization header or cookie."""
    header = request.headers.get("Authorization", "")
    if header.lower().startswith("bearer "):
        return header[7:].strip()
    return request.cookies.get(_COOKIE_ACCESS)


def read_refresh_token(request: Request) -> Optional[str]:
    return request.cookies.get(_COOKIE_REFRESH)
