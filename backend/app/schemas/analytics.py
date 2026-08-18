"""Analytics engine response schemas."""

from typing import Dict, List, Optional

from pydantic import BaseModel


class AnalyticsScope(BaseModel):
    academic_year: Optional[str] = None
    department_id: Optional[int] = None
    round_id: Optional[int] = None


class DistributionPoint(BaseModel):
    label: str
    value: int
    percentage: Optional[float] = None


class Bucket(BaseModel):
    label: str
    from_value: float
    to_value: float
    count: int


class TrendPoint(BaseModel):
    label: str
    applications: int
    admissions: int


class AdmissionRate(BaseModel):
    total_applications: int
    total_admissions: int
    admission_rate: float
    acceptance_rate: float


class CutoffAnalysis(BaseModel):
    overall_min: Optional[float]
    overall_max: Optional[float]
    overall_avg: Optional[float]
    buckets: List[Bucket]


class AnalyticsSummary(BaseModel):
    admission_rate: AdmissionRate
    department_stats: List[Dict]
    community_distribution: List[DistributionPoint]
    gender_distribution: List[DistributionPoint]
    school_type_distribution: List[DistributionPoint]
    district_distribution: List[DistributionPoint]
    cutoff_analysis: CutoffAnalysis
    seat_utilization: Dict[str, float]
    vacancy_percentage: float
    round_wise_trends: List[TrendPoint]
    monthly_trends: List[TrendPoint]
    yearly_comparison: List[Dict]
    generated_at: str
