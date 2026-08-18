"""Application settings schemas."""

from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class SettingUpdate(BaseModel):
    value: Any
    description: Optional[str] = Field(None, max_length=255)


class SettingOut(BaseModel):
    key: str
    value: Any
    description: Optional[str]


class AppConfigOut(BaseModel):
    app_name: str
    app_version: str
    environment: str
    features: Dict[str, bool]
