from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field

class ReportType(str, Enum):
    SALES = "sales"
    LEADS = "leads"
    ACTIVITIES = "activities"
    PERFORMANCE = "performance"
    SYSTEM = "system"

class ReportFormat(str, Enum):
    PDF = "pdf"
    CSV = "csv"
    EXCEL = "excel"
    JSON = "json"

class ReportSchedule(BaseModel):
    frequency: str  # daily, weekly, monthly
    day_of_week: Optional[int] = None  # 0-6 for weekly
    day_of_month: Optional[int] = None  # 1-31 for monthly
    time: str  # HH:MM format
    timezone: str = "Europe/Istanbul"
    recipients: List[str]

class ReportFilters(BaseModel):
    date_range: Optional[Dict[str, datetime]] = None
    user_ids: Optional[List[int]] = None
    lead_statuses: Optional[List[str]] = None
    opportunity_stages: Optional[List[str]] = None
    custom_filters: Optional[Dict[str, Any]] = None

class ReportRequest(BaseModel):
    report_type: ReportType
    report_format: ReportFormat
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    organization_id: Optional[int] = None
    user_id: Optional[int] = None
    filters: Optional[ReportFilters] = None
    schedule: Optional[ReportSchedule] = None

class ReportResponse(BaseModel):
    id: int
    report_type: ReportType
    report_format: ReportFormat
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    download_url: Optional[str] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True

class ReportBase(BaseModel):
    name: str
    description: Optional[str] = None
    report_type: ReportType
    report_format: ReportFormat
    filters: Optional[Dict[str, Any]] = None
    schedule: Optional[Dict[str, Any]] = None

class ReportCreate(ReportBase):
    organization_id: Optional[int] = None
    user_id: int

class ReportUpdate(ReportBase):
    pass

class Report(ReportBase):
    id: int
    organization_id: Optional[int]
    user_id: int
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    download_url: Optional[str] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True

class LeadFunnelStats(BaseModel):
    total_leads: int
    new_leads: int
    qualified_leads: int
    opportunities: int
    won_deals: int
    conversion_rates: Dict[str, float]

class SalesPerformanceStats(BaseModel):
    total_revenue: float
    average_deal_size: float
    win_rate: float
    sales_cycle_length: float
    top_performers: List[Dict[str, Any]]

class TaskCompletionStats(BaseModel):
    total_tasks: int
    completed_tasks: int
    overdue_tasks: int
    completion_rate: float
    average_completion_time: float

class OpportunityPipelineStats(BaseModel):
    total_value: float
    stage_distribution: Dict[str, Dict[str, Any]]
    average_stage_duration: Dict[str, float]
    win_probability: Dict[str, float]

class UserActivityStats(BaseModel):
    active_users: int
    total_actions: int
    average_actions_per_user: float
    most_active_users: List[Dict[str, Any]]
    activity_breakdown: Dict[str, int]

class SystemHealthStats(BaseModel):
    system_uptime: float
    api_response_time: float
    error_rate: float
    storage_usage: Dict[str, int]
    active_sessions: int

class UpcomingEvent(BaseModel):
    id: int
    title: str
    start_time: str
    end_time: Optional[str]
    type: str
    status: str

class DashboardStats(BaseModel):
    lead_funnel: LeadFunnelStats
    sales_performance: SalesPerformanceStats
    task_completion: TaskCompletionStats
    opportunity_pipeline: OpportunityPipelineStats
    upcoming_events: List[UpcomingEvent]
    user_activity: Optional[UserActivityStats] = None
    system_health: Optional[SystemHealthStats] = None
