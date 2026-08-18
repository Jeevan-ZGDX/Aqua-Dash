"""Centralised domain exception hierarchy.

All application errors inherit from ``AppError`` which carries an HTTP
status code, a machine-readable error code and a user-safe message.
Controllers raise these exceptions; the global exception middleware
converts them into the standard JSON envelope.
"""

from typing import Any, Dict, Optional


class AppError(Exception):
    """Base application exception."""

    status_code: int = 500
    code: str = "INTERNAL_ERROR"

    def __init__(
        self,
        message: str = "An unexpected error occurred.",
        *,
        status_code: Optional[int] = None,
        code: Optional[str] = None,
        details: Optional[Any] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code or self.status_code
        self.code = code or self.code
        self.details = details

    def to_dict(self) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"message": self.message, "code": self.code}
        if self.details is not None:
            payload["details"] = self.details
        return payload


# ----------------------------------------------------------------------
# 4xx - client errors
# ----------------------------------------------------------------------
class BadRequestError(AppError):
    status_code = 400
    code = "BAD_REQUEST"


class ValidationFailedError(AppError):
    status_code = 422
    code = "VALIDATION_ERROR"


class UnauthorizedError(AppError):
    status_code = 401
    code = "UNAUTHORIZED"


class ForbiddenError(AppError):
    status_code = 403
    code = "FORBIDDEN"


class NotFoundError(AppError):
    status_code = 404
    code = "NOT_FOUND"


class DuplicateRecordError(AppError):
    status_code = 409
    code = "DUPLICATE_RECORD"


class ConflictError(AppError):
    status_code = 409
    code = "CONFLICT"


class UnsupportedFormatError(BadRequestError):
    code = "UNSUPPORTED_FORMAT"


class InvalidFileError(BadRequestError):
    code = "INVALID_FILE"


class RateLimitError(AppError):
    status_code = 429
    code = "RATE_LIMITED"


class InactiveAccountError(UnauthorizedError):
    code = "ACCOUNT_DISABLED"


class InvalidCredentialsError(UnauthorizedError):
    code = "INVALID_CREDENTIALS"


class TokenExpiredError(UnauthorizedError):
    code = "TOKEN_EXPIRED"


class InvalidTokenError(UnauthorizedError):
    code = "INVALID_TOKEN"


class TokenRevokedError(UnauthorizedError):
    code = "TOKEN_REVOKED"


# ----------------------------------------------------------------------
# 5xx - server errors
# ----------------------------------------------------------------------
class DatabaseError(AppError):
    status_code = 500
    code = "DATABASE_ERROR"


class IntegrityErrorApp(DatabaseError):
    status_code = 409
    code = "INTEGRITY_CONSTRAINT"


class ImportProcessingError(DatabaseError):
    status_code = 500
    code = "IMPORT_PROCESSING_ERROR"


class ReportGenerationError(AppError):
    status_code = 500
    code = "REPORT_GENERATION_ERROR"


class ServiceUnavailableError(AppError):
    status_code = 503
    code = "SERVICE_UNAVAILABLE"
