from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, IPvAnyAddress, constr, validator
from enum import Enum


class APIScope(str, Enum):
    # Read scopes
    read_leads = "read:leads"
    read_deals = "read:deals"
    read_tasks = "read:tasks"
    read_notes = "read:notes"
    read_communications = "read:communications"
    read_files = "read:files"
    read_users = "read:users"
    
    # Write scopes
    write_leads = "write:leads"
    write_deals = "write:deals"
    write_tasks = "write:tasks"
    write_notes = "write:notes"
    write_communications = "write:communications"
    write_files = "write:files"
    
    # Admin scopes
    admin_users = "admin:users"
    admin_settings = "admin:settings"


class APITokenBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    scopes: List[APIScope]
    ip_whitelist: Optional[List[str]] = None
    is_active: bool = True
    expires_at: Optional[datetime] = None

    @validator('ip_whitelist')
    def validate_ip_addresses(cls, v):
        if v:
            for ip in v:
                try:
                    IPvAnyAddress.validate(ip)
                except ValueError:
                    raise ValueError(f"Invalid IP address: {ip}")
        return v


class APITokenCreate(APITokenBase):
    organization_id: int
    user_id: int


class APITokenUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    scopes: Optional[List[APIScope]] = None
    ip_whitelist: Optional[List[str]] = None
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None

    @validator('ip_whitelist')
    def validate_ip_addresses(cls, v):
        if v:
            for ip in v:
                try:
                    IPvAnyAddress.validate(ip)
                except ValueError:
                    raise ValueError(f"Invalid IP address: {ip}")
        return v


class APIToken(APITokenBase):
    id: int
    organization_id: int
    user_id: int
    token: str
    last_used_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    is_expired: bool
    is_valid: bool

    class Config:
        from_attributes = True


class APITokenUsageBase(BaseModel):
    endpoint: str
    method: str = Field(..., pattern="^(GET|POST|PUT|DELETE|PATCH)$")  # Changed from regex to pattern
    ip_address: str
    user_agent: Optional[str] = None
    status_code: int
    response_time: Optional[int] = None
    error_message: Optional[str] = None


class APITokenUsageCreate(APITokenUsageBase):
    token_id: int


class APITokenUsage(APITokenUsageBase):
    id: int
    token_id: int
    created_at: datetime
    is_success: bool

    class Config:
        from_attributes = True


class APITokenList(BaseModel):
    tokens: List[APIToken]
    total: int
    page: int
    size: int
    has_more: bool


class APITokenUsageList(BaseModel):
    logs: List[APITokenUsage]
    total: int
    page: int
    size: int
    has_more: bool


# API Response Models
class APITokenResponse(BaseModel):
    success: bool = True
    message: str = "Operation successful"
    data: Optional[APIToken] = None


class APITokenListResponse(BaseModel):
    success: bool = True
    message: str = "Operation successful"
    data: APITokenList


class APITokenUsageResponse(BaseModel):
    success: bool = True
    message: str = "Operation successful"
    data: Optional[APITokenUsage] = None


class APITokenUsageListResponse(BaseModel):
    success: bool = True
    message: str = "Operation successful"
    data: APITokenUsageList


# Additional Schema for specific operations
class APITokenStats(BaseModel):
    total_requests: int
    success_rate: float
    avg_response_time: float
    requests_by_endpoint: Dict[str, int]
    errors_by_status: Dict[str, int]
    usage_by_day: Dict[str, int]


class APITokenStatsResponse(BaseModel):
    success: bool = True
    message: str = "Statistics retrieved successfully"
    data: APITokenStats
