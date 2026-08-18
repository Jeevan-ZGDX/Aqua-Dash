"""TTL-aware caching layer.

Uses ``cachetools.TTLCache`` for in-process caching. If ``REDIS_URL`` is
configured, swap the cache backend for Redis. Every cached function must
have a deterministic cache key.
"""

import hashlib
import json
from typing import Any, Callable, Dict, Optional

from cachetools import TTLCache

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("app.cache")

_cache: Optional[TTLCache] = None


def get_cache() -> TTLCache:
    global _cache
    if _cache is None:
        _cache = TTLCache(maxsize=512, ttl=settings.CACHE_TTL_SECONDS)
    return _cache


def build_cache_key(prefix: str, **params: Any) -> str:
    """Deterministic cache key from a prefix + canonical JSON params."""
    raw = json.dumps(params, sort_keys=True, default=str)
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return f"{prefix}:{digest}"


def cache_get(key: str) -> Optional[Any]:
    if not settings.CACHE_ENABLED:
        return None
    return get_cache().get(key)


def cache_set(key: str, value: Any) -> None:
    if not settings.CACHE_ENABLED:
        return
    get_cache()[key] = value


def cache_delete_pattern(prefix: str) -> None:
    """Remove all keys sharing a prefix (cache invalidation on writes)."""
    if not settings.CACHE_ENABLED:
        return
    cache = get_cache()
    stale = [k for k in cache if k.startswith(prefix)]
    for k in stale:
        del cache[k]


def cached(prefix: str, ttl: Optional[int] = None):
    """Decorator caching an async callable's result by its kwargs."""

    def decorator(func: Callable) -> Callable:
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            if not settings.CACHE_ENABLED:
                return await func(*args, **kwargs)
            key = build_cache_key(prefix, args=repr(args), **kwargs)
            cached_value = cache_get(key)
            if cached_value is not None:
                return cached_value
            result = await func(*args, **kwargs)
            cache_set(key, result)
            return result

        return wrapper

    return decorator


def invalidate(prefix: str) -> None:
    """Invalidate cached analytics/dashboard keys after data mutations."""
    cache_delete_pattern(prefix)
    logger.debug("Invalidated cache prefix %s", prefix)
