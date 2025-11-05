"""
Territory schemas for API requests and responses
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class TerritoryType(str, Enum):
    """Territory types"""
    GEOGRAPHIC = "geographic"
    INDUSTRY = "industry"
    ACCOUNT_SIZE = "account_size"
    PRODUCT = "product"
    CUSTOM = "custom"


class AssignmentPriority(str, Enum):
    """Assignment priority for territory rules"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class MemberRole(str, Enum):
    """Territory member roles"""
    OWNER = "owner"
    MANAGER = "manager"
    MEMBER = "member"


# Territory Schemas

class TerritoryBase(BaseModel):
    """Base territory schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    territory_type: TerritoryType = TerritoryType.CUSTOM
    parent_id: Optional[int] = None
    is_active: bool = True
    metadata: Optional[Dict[str, Any]] = None


class TerritoryCreate(TerritoryBase):
    """Schema for creating a territory"""
    pass


class TerritoryUpdate(BaseModel):
    """Schema for updating a territory"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    territory_type: Optional[TerritoryType] = None
    parent_id: Optional[int] = None
    is_active: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None


class TerritoryResponse(TerritoryBase):
    """Schema for territory response"""
    id: int
    organization_id: int
    path: Optional[str] = None
    level: int
    full_path: str
    created_at: datetime
    updated_at: datetime
    created_by_id: Optional[int] = None

    # Include children count
    children_count: int = 0
    members_count: int = 0

    class Config:
        from_attributes = True


class TerritoryHierarchy(TerritoryResponse):
    """Territory with nested children"""
    children: List['TerritoryHierarchy'] = []


# Territory Member Schemas

class TerritoryMemberBase(BaseModel):
    """Base territory member schema"""
    user_id: int
    role: MemberRole = MemberRole.MEMBER
    is_primary: bool = False


class TerritoryMemberCreate(TerritoryMemberBase):
    """Schema for adding a member to a territory"""
    pass


class TerritoryMemberUpdate(BaseModel):
    """Schema for updating a territory member"""
    role: Optional[MemberRole] = None
    is_primary: Optional[bool] = None


class TerritoryMemberResponse(TerritoryMemberBase):
    """Schema for territory member response"""
    id: int
    territory_id: int
    created_at: datetime
    updated_at: datetime

    # Include user details
    user_email: Optional[str] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True


# Territory Rule Schemas

class RuleCondition(BaseModel):
    """Rule condition schema"""
    field: str
    operator: str  # equals, not_equals, contains, greater_than, less_than, in, not_in
    value: Any


class TerritoryRuleBase(BaseModel):
    """Base territory rule schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    priority: int = 0
    priority_level: AssignmentPriority = AssignmentPriority.MEDIUM
    is_active: bool = True
    conditions: Dict[str, Any]  # JSON structure with conditions
    entity_type: str = "lead"  # lead, account, opportunity
    auto_assign: bool = True


class TerritoryRuleCreate(TerritoryRuleBase):
    """Schema for creating a territory rule"""
    pass


class TerritoryRuleUpdate(BaseModel):
    """Schema for updating a territory rule"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    priority: Optional[int] = None
    priority_level: Optional[AssignmentPriority] = None
    is_active: Optional[bool] = None
    conditions: Optional[Dict[str, Any]] = None
    entity_type: Optional[str] = None
    auto_assign: Optional[bool] = None


class TerritoryRuleResponse(TerritoryRuleBase):
    """Schema for territory rule response"""
    id: int
    territory_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Territory Assignment Schemas

class TerritoryAssignmentBase(BaseModel):
    """Base territory assignment schema"""
    entity_type: str  # lead, account, opportunity
    entity_id: int
    is_primary: bool = True
    assignment_reason: Optional[str] = None


class TerritoryAssignmentCreate(TerritoryAssignmentBase):
    """Schema for creating a territory assignment"""
    territory_id: int


class TerritoryAssignmentResponse(TerritoryAssignmentBase):
    """Schema for territory assignment response"""
    id: int
    territory_id: int
    assigned_by_rule_id: Optional[int] = None
    assigned_by_user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    # Include territory details
    territory_name: Optional[str] = None

    class Config:
        from_attributes = True


# Territory Quota Schemas

class TerritoryQuotaBase(BaseModel):
    """Base territory quota schema"""
    year: int = Field(..., ge=2000, le=2100)
    quarter: Optional[int] = Field(None, ge=1, le=4)
    month: Optional[int] = Field(None, ge=1, le=12)
    revenue_quota: Optional[float] = None
    deal_count_quota: Optional[int] = None
    activity_quota: Optional[int] = None
    currency: str = "USD"


class TerritoryQuotaCreate(TerritoryQuotaBase):
    """Schema for creating a territory quota"""
    pass


class TerritoryQuotaUpdate(BaseModel):
    """Schema for updating a territory quota"""
    revenue_quota: Optional[float] = None
    deal_count_quota: Optional[int] = None
    activity_quota: Optional[int] = None
    revenue_actual: Optional[float] = None
    deal_count_actual: Optional[int] = None
    activity_actual: Optional[int] = None


class TerritoryQuotaResponse(TerritoryQuotaBase):
    """Schema for territory quota response"""
    id: int
    territory_id: int
    revenue_actual: float
    deal_count_actual: int
    activity_actual: int
    revenue_attainment: float
    deal_attainment: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Analytics Schemas

class TerritoryAnalytics(BaseModel):
    """Territory analytics schema"""
    territory_id: int
    territory_name: str

    # Counts
    lead_count: int = 0
    account_count: int = 0
    opportunity_count: int = 0
    member_count: int = 0

    # Revenue metrics
    total_revenue: float = 0.0
    won_revenue: float = 0.0
    pipeline_value: float = 0.0

    # Performance
    win_rate: float = 0.0
    avg_deal_size: float = 0.0
    quota_attainment: float = 0.0

    # Activity
    total_activities: int = 0

    # Time period
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None


class TerritoryPerformance(BaseModel):
    """Territory performance comparison"""
    territories: List[TerritoryAnalytics]
    organization_average: TerritoryAnalytics
    top_performer: Optional[TerritoryAnalytics] = None


# Bulk Assignment Schema

class BulkAssignmentRequest(BaseModel):
    """Schema for bulk territory assignment"""
    entity_type: str  # lead, account, opportunity
    entity_ids: List[int]
    territory_id: int
    is_primary: bool = True
    assignment_reason: Optional[str] = None


class BulkAssignmentResponse(BaseModel):
    """Response for bulk assignment"""
    successful: int
    failed: int
    total: int
    errors: List[Dict[str, Any]] = []
