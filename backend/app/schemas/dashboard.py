"""Dashboard aggregate response schemas."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class KPICard(BaseModel):
    label: str
    value: int
    unit: str = "count"
    trend: Optional[float] = None  # % change vs previous comparable period


class DashboardOverview(BaseModel):
    total_applications: int
    total_seats: int
    seats_filled: int
    vacant_seats: int
    admission_percentage: float
    confirmation_rate: float
    male_students: int
    female_students: int
    other_students: int
    applied: int
    admitted: int
    confirmed: int
    waitlisted: int
    rejected: int
    academic_year: Optional[str]
    department: Optional[str]


class RecentActivity(BaseModel):
    id: int
    action: str
    description: Optional[str]
    user_name: Optional[str]
    user_role: Optional[str]
    entity_type: Optional[str]
    created_at: datetime


class DashboardResponse(BaseModel):
    overview: DashboardOverview
    recent_activities: List[RecentActivity]
