"""Rate limiting using slowapi. Configurable per-endpoint and globally."""

from typing import Callable

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

limiter = Limiter(key_func=get_remote_address, enabled=settings.RATE_LIMIT_ENABLED)


def login_rate_limit() -> Callable:
    return limiter.limit(settings.LOGIN_RATE_LIMIT)


def general_rate_limit() -> Callable:
    return limiter.limit(settings.GENERAL_RATE_LIMIT)
