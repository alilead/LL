"""
Forecast schemas for API requests and responses
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class ForecastCategory(str, Enum):
    PIPELINE = "pipeline"
    BEST_CASE = "best_case"
    COMMIT = "commit"
    CLOSED = "closed"
    OMITTED = "omitted"


class ForecastPeriodType(str, Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"


class ForecastStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"


# Forecast Period Schemas

class ForecastPeriodBase(BaseModel):
    name: str
    period_type: ForecastPeriodType
    year: int
    quarter: Optional[int] = None
    month: Optional[int] = None
    week: Optional[int] = None
    start_date: datetime
    end_date: datetime


class ForecastPeriodCreate(ForecastPeriodBase):
    pass


class ForecastPeriodResponse(ForecastPeriodBase):
    id: int
    organization_id: int
    is_active: bool
    is_closed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Forecast Schemas

class ForecastBase(BaseModel):
    territory_id: Optional[int] = None
    pipeline_amount: float = 0.0
    best_case_amount: float = 0.0
    commit_amount: float = 0.0
    closed_amount: float = 0.0
    quota_amount: Optional[float] = None
    currency: str = "USD"


class ForecastCreate(ForecastBase):
    period_id: int


class ForecastUpdate(BaseModel):
    pipeline_amount: Optional[float] = None
    best_case_amount: Optional[float] = None
    commit_amount: Optional[float] = None
    closed_amount: Optional[float] = None
    quota_amount: Optional[float] = None
    status: Optional[ForecastStatus] = None


class ForecastAdjustment(BaseModel):
    manager_adjusted_commit: float
    adjustment_reason: Optional[str] = None


class ForecastResponse(ForecastBase):
    id: int
    period_id: int
    user_id: int
    organization_id: int
    pipeline_count: int
    best_case_count: int
    commit_count: int
    closed_count: int
    manager_adjusted_commit: Optional[float] = None
    adjustment_reason: Optional[str] = None
    adjusted_by_id: Optional[int] = None
    adjusted_at: Optional[datetime] = None
    ai_predicted_commit: Optional[float] = None
    ai_confidence_score: Optional[float] = None
    status: ForecastStatus
    submitted_at: Optional[datetime] = None
    quota_attainment: float
    final_commit_amount: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Forecast Rollup Schemas

class ForecastRollupResponse(BaseModel):
    id: int
    period_id: int
    rollup_level: str
    entity_id: Optional[int] = None
    pipeline_amount: float
    best_case_amount: float
    commit_amount: float
    closed_amount: float
    adjusted_commit_amount: float
    pipeline_count: int
    best_case_count: int
    commit_count: int
    closed_count: int
    total_quota: float
    quota_attainment: float
    calculated_at: datetime

    class Config:
        from_attributes = True


# Forecast Analytics

class ForecastTrend(BaseModel):
    date: datetime
    pipeline_amount: float
    commit_amount: float
    closed_amount: float


class ForecastAnalytics(BaseModel):
    period_id: int
    period_name: str
    total_commit: float
    total_quota: float
    quota_attainment: float
    win_rate: float
    forecast_accuracy: float
    trend: List[ForecastTrend] = []


class TeamForecastSummary(BaseModel):
    user_id: int
    user_name: str
    commit_amount: float
    quota_amount: float
    quota_attainment: float
    deals_count: int
    status: ForecastStatus
