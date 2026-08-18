"""Centralised application constants: roles, permissions, enums and limits.

Permissions are declared once here and wired into the RBAC engine.
Controllers must never hardcode permission strings.
"""

from enum import Enum


# ----------------------------------------------------------------------
# Roles
# ----------------------------------------------------------------------
class Roles(str, Enum):
    AHOD = "AHOD"
    HOD = "HOD"
    FACULTY = "FACULTY"
    ADMINISTRATOR = "ADMINISTRATOR"
    READ_ONLY = "READ_ONLY"


# ----------------------------------------------------------------------
# Permissions - single source of truth for RBAC
# ----------------------------------------------------------------------
class Permissions:
    # Auth
    AUTH_LOGIN = "auth:login"
    AUTH_LOGOUT = "auth:logout"
    AUTH_REFRESH = "auth:refresh"
    AUTH_VERIFY = "auth:verify"

    # Users
    USER_LIST = "user:list"
    USER_READ = "user:read"
    USER_CREATE = "user:create"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"

    # Dashboard
    DASHBOARD_OVERVIEW = "dashboard:overview"
    DASHBOARD_RECENT = "dashboard:recent"

    # Analytics
    ANALYTICS_READ = "analytics:read"

    # Students
    STUDENT_LIST = "student:list"
    STUDENT_READ = "student:read"
    STUDENT_CREATE = "student:create"
    STUDENT_UPDATE = "student:update"
    STUDENT_DELETE = "student:delete"
    STUDENT_VERIFY = "student:verify"
    STUDENT_DOCUMENTS = "student:documents"

    # Search
    SEARCH_GLOBAL = "search:global"

    # Reports
    REPORT_GENERATE = "report:generate"
    REPORT_EXPORT = "report:export"

    # Uploads
    IMPORT_CREATE = "import:create"
    IMPORT_READ = "import:read"

    # Settings
    SETTINGS_READ = "settings:read"
    SETTINGS_UPDATE = "settings:update"


# ----------------------------------------------------------------------
# Role -> Permission mapping (RBAC matrix)
# ----------------------------------------------------------------------
ROLE_PERMISSIONS: dict[Roles, set[str]] = {
    Roles.AHOD: {
        Permissions.AUTH_LOGIN,
        Permissions.AUTH_LOGOUT,
        Permissions.AUTH_REFRESH,
        Permissions.AUTH_VERIFY,
        Permissions.USER_LIST,
        Permissions.USER_READ,
        Permissions.USER_CREATE,
        Permissions.USER_UPDATE,
        Permissions.USER_DELETE,
        Permissions.DASHBOARD_OVERVIEW,
        Permissions.DASHBOARD_RECENT,
        Permissions.ANALYTICS_READ,
        Permissions.STUDENT_LIST,
        Permissions.STUDENT_READ,
        Permissions.STUDENT_CREATE,
        Permissions.STUDENT_UPDATE,
        Permissions.STUDENT_DELETE,
        Permissions.STUDENT_VERIFY,
        Permissions.STUDENT_DOCUMENTS,
        Permissions.SEARCH_GLOBAL,
        Permissions.REPORT_GENERATE,
        Permissions.REPORT_EXPORT,
        Permissions.IMPORT_CREATE,
        Permissions.IMPORT_READ,
        Permissions.SETTINGS_READ,
        Permissions.SETTINGS_UPDATE,
    },
    Roles.HOD: {
        Permissions.AUTH_LOGIN,
        Permissions.AUTH_LOGOUT,
        Permissions.AUTH_REFRESH,
        Permissions.AUTH_VERIFY,
        Permissions.DASHBOARD_OVERVIEW,
        Permissions.DASHBOARD_RECENT,
        Permissions.ANALYTICS_READ,
        Permissions.STUDENT_LIST,
        Permissions.STUDENT_READ,
        Permissions.STUDENT_UPDATE,
        Permissions.STUDENT_VERIFY,
        Permissions.STUDENT_DOCUMENTS,
        Permissions.SEARCH_GLOBAL,
        Permissions.REPORT_GENERATE,
        Permissions.REPORT_EXPORT,
        Permissions.IMPORT_CREATE,
        Permissions.IMPORT_READ,
        Permissions.SETTINGS_READ,
    },
    Roles.ADMINISTRATOR: {
        Permissions.AUTH_LOGIN,
        Permissions.AUTH_LOGOUT,
        Permissions.AUTH_REFRESH,
        Permissions.AUTH_VERIFY,
        Permissions.USER_LIST,
        Permissions.USER_READ,
        Permissions.USER_CREATE,
        Permissions.USER_UPDATE,
        Permissions.DASHBOARD_OVERVIEW,
        Permissions.DASHBOARD_RECENT,
        Permissions.ANALYTICS_READ,
        Permissions.STUDENT_LIST,
        Permissions.STUDENT_READ,
        Permissions.STUDENT_UPDATE,
        Permissions.STUDENT_DOCUMENTS,
        Permissions.SEARCH_GLOBAL,
        Permissions.REPORT_GENERATE,
        Permissions.REPORT_EXPORT,
        Permissions.IMPORT_READ,
        Permissions.SETTINGS_READ,
        Permissions.SETTINGS_UPDATE,
    },
    Roles.FACULTY: {
        Permissions.AUTH_LOGIN,
        Permissions.AUTH_LOGOUT,
        Permissions.AUTH_REFRESH,
        Permissions.AUTH_VERIFY,
        Permissions.DASHBOARD_OVERVIEW,
        Permissions.DASHBOARD_RECENT,
        Permissions.ANALYTICS_READ,
        Permissions.STUDENT_LIST,
        Permissions.STUDENT_READ,
        Permissions.STUDENT_DOCUMENTS,
        Permissions.SEARCH_GLOBAL,
        Permissions.REPORT_GENERATE,
        Permissions.REPORT_EXPORT,
    },
    Roles.READ_ONLY: {
        Permissions.AUTH_LOGIN,
        Permissions.AUTH_LOGOUT,
        Permissions.AUTH_REFRESH,
        Permissions.AUTH_VERIFY,
        Permissions.DASHBOARD_OVERVIEW,
        Permissions.DASHBOARD_RECENT,
        Permissions.ANALYTICS_READ,
        Permissions.STUDENT_LIST,
        Permissions.STUDENT_READ,
        Permissions.SEARCH_GLOBAL,
    },
}


# ----------------------------------------------------------------------
# Enums used across the domain
# ----------------------------------------------------------------------
class Gender(str, Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"


class AdmissionStatus(str, Enum):
    APPLIED = "APPLIED"
    ADMITTED = "ADMITTED"
    CONFIRMED = "CONFIRMED"
    WAITLISTED = "WAITLISTED"
    REJECTED = "REJECTED"


class SchoolType(str, Enum):
    GOVERNMENT = "GOVERNMENT"
    PRIVATE = "PRIVATE"
    AIDED = "AIDED"
    OTHER = "OTHER"


class Community(str, Enum):
    OC = "OC"
    BC = "BC"
    MBC = "MBC"
    SC = "SC"
    ST = "ST"


class DocumentType(str, Enum):
    PHOTO = "PHOTO"
    MARK_SHEET = "MARK_SHEET"
    TC = "TC"
    COMMUNITY_CERTIFICATE = "COMMUNITY_CERTIFICATE"
    INCOME_CERTIFICATE = "INCOME_CERTIFICATE"
    AADHAAR = "AADHAAR"
    OTHER = "OTHER"


class VerificationStatus(str, Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    NOT_REQUIRED = "NOT_REQUIRED"


class ImportStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    COMPLETED_WITH_ERRORS = "COMPLETED_WITH_ERRORS"
    FAILED = "FAILED"


class ReportFormat(str, Enum):
    PDF = "PDF"
    EXCEL = "EXCEL"
    CSV = "CSV"


# ----------------------------------------------------------------------
# App-wide limits
# ----------------------------------------------------------------------
class Limits:
    DEFAULT_PAGE = 1
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100
    MAX_LOGIN_ATTEMPTS = 5
    MAX_IMPORT_ROWS = 100_000
    PASSWORD_MIN_LENGTH = 8
    SEARCH_MIN_LENGTH = 2
