"""Custom ASGI middleware: request-id, structured logging, and error envelope.

The error-handling middleware converts any uncaught exception into the
standard JSON response envelope, so controllers never need try/except
boilerplate.
"""

import time
import uuid
from typing import Awaitable, Callable

from fastapi import Request
from fastapi.responses import JSONResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.exceptions import AppError
from app.core.logging import get_logger, log_request, request_id_ctx, user_id_ctx

logger = get_logger("app.middleware")


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Attach a request_id and bind it to structured logging."""

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable]) -> Response | JSONResponse:  # noqa: ARG002
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        token = request_id_ctx.set(request_id)
        started = time.perf_counter()
        response = await call_next(request)
        request_id_ctx.reset(token)
        response.headers["X-Request-ID"] = request_id
        log_request(
            "completed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=(time.perf_counter() - started) * 1000,
        )
        return response


class ExceptionHandlingMiddleware(BaseHTTPMiddleware):
    """Convert AppError and unhandled exceptions into standard JSON responses."""

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable]) -> Response | JSONResponse:  # noqa: ARG002
        request_id = request_id_ctx.get() or str(uuid.uuid4())
        started = time.perf_counter()
        try:
            response = await call_next(request)
            return response
        except AppError as exc:
            logger.warning("App error %s on %s %s: %s", exc.code, request.method, request.url.path, exc.message)
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "status": "error",
                    "message": exc.message,
                    "code": exc.code,
                    "details": exc.details,
                    "request_id": request_id,
                    "timestamp": __import__("datetime").datetime.now().isoformat(),
                },
            )
        except Exception:
            logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": "Internal server error.",
                    "code": "INTERNAL_ERROR",
                    "request_id": request_id,
                    "timestamp": __import__("datetime").datetime.now().isoformat(),
                },
            )

