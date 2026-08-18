"""Input sanitization and security helpers.

- Basic XSS sanitization for free-text fields.
- String normalization helpers.
"""

import html
import re
from typing import Optional

_WHITESPACE_RE = re.compile(r"\s+")


def sanitize_text(value: Optional[str]) -> Optional[str]:
    """Strip tags/entities and collapse whitespace for stored text."""
    if value is None:
        return None
    cleaned = html.escape(value.strip(), quote=True)
    cleaned = _WHITESPACE_RE.sub(" ", cleaned)
    return cleaned[:2000]


def normalize_identifier(value: Optional[str]) -> Optional[str]:
    """Upper-case, strip spaces for register/application numbers."""
    if value is None:
        return None
    return _WHITESPACE_RE.sub("", value).upper()


def safe_filename(filename: str) -> str:
    """Strip path components from an uploaded filename."""
    import os

    return os.path.basename(filename.replace("\\", "/")).strip()
