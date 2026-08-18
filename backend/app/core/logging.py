"""Structured, environment-aware logging.

Logs are emitted as JSON in production and as human-readable text in
development. Logging utilities are provided for key subsystems:
authentication, requests, database queries, uploads, reports, analytics
and performance metrics.
"""

import logging
import time
from contextvars import ContextVar
from typing import Optional

from pythonjsonlogger import jsonlogger

from app.core.config import settings

# Context variable carrying the current request id / user id so that
# any log emitted within a request can be correlated.
request_id_ctx: ContextVar[Optional[str]] = ContextVar("request_id", default=None)
user_id_ctx: ContextVar[Optional[str]] = ContextVar("user_id", default=None)


def bind_user_to_logs(user_id: Optional[str]) -> None:
    """Bind the current user to structured log records."""
    if user_id:
        user_id_ctx.set(str(user_id))


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """JSON formatter that also records the request correlation context."""

    def add_fields(self, log_record, record, message_dict):  # noqa: ANN001
        super().add_fields(log_record, record, message_dict)
        rid = request_id_ctx.get()
        uid = user_id_ctx.get()
        if rid:
            log_record["request_id"] = rid
        if uid:
            log_record["user_id"] = uid
        log_record["level"] = record.levelname
        log_record["logger"] = record.name
        log_record["timestamp"] = self.formatTime(record, self.datefmt)


def setup_logging() -> None:
    """Configure root logging based on the environment."""
    root = logging.getLogger()
    root.setLevel(logging.DEBUG if settings.APP_DEBUG else logging.INFO)

    handler = logging.StreamHandler()
    if settings.is_production:
        formatter = CustomJsonFormatter("%(asctime)s %(level)s %(name)s %(message)s")
    else:
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    handler.setFormatter(formatter)

    # Avoid duplicate handlers on reload
    if not any(isinstance(h, logging.StreamHandler) for h in root.handlers):
        root.addHandler(handler)

    # Keep uvicorn access logs from polluting unless debug
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Return a namespaced logger (call after setup_logging)."""
    return logging.getLogger(name)


# ----------------------------------------------------------------------
# Convenience helpers for subsystems
# ----------------------------------------------------------------------
def log_auth(event: str, *, username: str = "", success: bool = True, detail: str = "") -> None:
    get_logger("app.auth").info(
        "authentication_event",
        extra={
            "event": event,
            "username": username,
            "success": success,
            "detail": detail,
            "duration_ms": None,
        },
    )


def log_request(event: str, *, method: str = "", path: str = "", status_code: int = 0, duration_ms: float = 0.0) -> None:
    get_logger("app.request").info(
        "request_event",
        extra={
            "event": event,
            "method": method,
            "path": path,
            "status_code": status_code,
            "duration_ms": round(duration_ms, 3),
        },
    )


def log_upload(event: str, *, filename: str = "", rows: int = 0, imported: int = 0, errors: int = 0) -> None:
    get_logger("app.upload").info(
        "upload_event",
        extra={"event": event, "file_name": filename, "rows": rows, "imported": imported, "errors": errors},
    )


def log_report(event: str, *, report_type: str = "", format_: str = "", rows: int = 0, duration_ms: float = 0.0) -> None:
    get_logger("app.report").info(
        "report_event",
        extra={
            "event": event,
            "report_type": report_type,
            "format": format_,
            "rows": rows,
            "duration_ms": round(duration_ms, 3),
        },
    )


def log_analytics(event: str, *, scope: str = "", duration_ms: float = 0.0) -> None:
    get_logger("app.analytics").info(
        "analytics_event",
        extra={"event": event, "scope": scope, "duration_ms": round(duration_ms, 3)},
    )


class Timer:
    """Lightweight wall-clock timer for performance metrics."""

    def __init__(self) -> None:
        self._start = time.perf_counter()

    def elapsed_ms(self) -> float:
        return (time.perf_counter() - self._start) * 1000.0
