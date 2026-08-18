"""Reusable, domain-aware validators used by Pydantic schemas and imports."""

import re
from typing import Any

from pydantic import field_validator

# ----------------------------------------------------------------------
# Regex patterns
# ----------------------------------------------------------------------
PHONE_RE = re.compile(r"^[6-9]\d{9}$")
PINCODE_RE = re.compile(r"^\d{6}$")
REGISTER_NUMBER_RE = re.compile(r"^[A-Z0-9]{4,20}$")
APPLICATION_NUMBER_RE = re.compile(r"^[A-Z0-9]{4,20}$")
YEAR_RE = re.compile(r"^(19|20)\d{2}$")
ACADEMIC_YEAR_RE = re.compile(r"^(19|20)\d{2}-(19|20)\d{2}$")
ROLL_NO_RE = re.compile(r"^[A-Z0-9\-]{2,30}$")
PASSWORD_RE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


# ----------------------------------------------------------------------
# Validator factories
# ----------------------------------------------------------------------
def valid_phone(field_name: str = "phone"):
    """Pydantic v2 validator enforcing 10-digit Indian mobile format."""

    def check(cls, value: Any):  # noqa: ANN001
        if value is None or value == "":
            return value
        if not PHONE_RE.match(str(value)):
            raise ValueError(f"{field_name} must be a valid 10-digit mobile number.")
        return str(value)

    return field_validator(field_name)(classmethod(check))


def valid_pincode(field_name: str = "pincode"):
    def check(cls, value: Any):  # noqa: ANN001
        if value is None or value == "":
            return value
        if not PINCODE_RE.match(str(value)):
            raise ValueError("pincode must be a valid 6-digit value.")
        return str(value)

    return field_validator(field_name)(classmethod(check))


def valid_academic_year(field_name: str = "academic_year"):
    def check(cls, value: Any):  # noqa: ANN001
        if value is None:
            return value
        if isinstance(value, int):
            value = f"{value}-{value + 1}"
        if not ACADEMIC_YEAR_RE.match(str(value)):
            raise ValueError(f"{field_name} must match format YYYY-YYYY (e.g. 2024-2025).")
        return str(value)

    return field_validator(field_name)(classmethod(check))


def valid_percentage(field_name: str = "percentage"):
    def check(cls, value: Any):  # noqa: ANN001
        if value is None:
            return value
        if value < 0 or value > 100:
            raise ValueError(f"{field_name} must be between 0 and 100.")
        return round(value, 2)

    return field_validator(field_name)(classmethod(check))


def valid_marks(field_name: str = "marks"):
    def check(cls, value: Any):  # noqa: ANN001
        if value is None:
            return value
        if value < 0:
            raise ValueError(f"{field_name} cannot be negative.")
        return round(value, 2)

    return field_validator(field_name)(classmethod(check))


def valid_cutoff(field_name: str = "cutoff"):
    def check(cls, value: Any):  # noqa: ANN001
        if value is None:
            return value
        if value < 0 or value > 200:
            raise ValueError(f"{field_name} must be between 0 and 200.")
        return round(value, 2)

    return field_validator(field_name)(classmethod(check))


def valid_aadhaar(field_name: str = "aadhaar_number"):
    def check(cls, value: Any):  # noqa: ANN001
        if value is None or value == "":
            return value
        cleaned = str(value).replace(" ", "")
        if not (cleaned.isdigit() and len(cleaned) == 12):
            raise ValueError("aadhaar_number must be a 12-digit value.")
        return cleaned

    return field_validator(field_name)(classmethod(check))


def strong_password(field_name: str = "password"):
    def check(cls, value: Any):  # noqa: ANN001
        if not PASSWORD_RE.match(str(value)):
            raise ValueError(
                "password must be at least 8 characters and include upper/lower case, "
                "a digit and a special character."
            )
        return str(value)

    return field_validator(field_name)(classmethod(check))
