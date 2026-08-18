"""Search schemas."""

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class SortOrder(BaseModel):
    field: str = Field("created_at", description="Sortable field name")
    direction: str = Field("desc", pattern="^(asc|desc)$")


class StudentSearchRequest(BaseModel):
    q: Optional[str] = Field(
        None, min_length=2, max_length=200,
        description="Global search across register number, application number, name",
    )
    register_number: Optional[str] = None
    application_number: Optional[str] = None
    name: Optional[str] = None
    district: Optional[str] = None
    community: Optional[str] = None
    gender: Optional[str] = Field(None, pattern="^(MALE|FEMALE|OTHER)$")
    admission_status: Optional[str] = None
    cutoff_min: Optional[float] = Field(None, ge=0, le=200)
    cutoff_max: Optional[float] = Field(None, ge=0, le=200)
    academic_year: Optional[str] = None
    round_number: Optional[int] = Field(None, ge=1)
    department_id: Optional[int] = None
    sort_by: Optional[str] = "created_at"
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$")
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)

    def is_empty(self) -> bool:
        return not any(
            (
                self.q,
                self.register_number,
                self.application_number,
                self.name,
                self.district,
                self.community,
                self.gender,
                self.admission_status,
                self.cutoff_min,
                self.cutoff_max,
                self.academic_year,
                self.round_number,
                self.department_id,
            )
        )


class DateRange(BaseModel):
    from_date: Optional[date] = None
    to_date: Optional[date] = None
