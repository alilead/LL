from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class CalendarIntegrationBase(BaseModel):
    provider: str
    provider_account_email: Optional[str] = None
    sync_enabled: bool = True
    sync_direction: str = "two_way"
    is_active: bool = True


class CalendarIntegrationCreate(CalendarIntegrationBase):
    external_account_id: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    scopes: Optional[str] = None


class CalendarIntegrationUpdate(BaseModel):
    provider_account_email: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    scopes: Optional[str] = None
    sync_enabled: Optional[bool] = None
    sync_direction: Optional[str] = None
    last_error: Optional[str] = None
    is_active: Optional[bool] = None


class CalendarIntegration(CalendarIntegrationBase):
    id: int
    organization_id: int
    user_id: int
    external_account_id: Optional[str] = None
    scopes: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    last_synced_at: Optional[datetime] = None
    last_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CalendarIntegrationListResponse(BaseModel):
    items: List[CalendarIntegration]
    total: int


class OAuthInitRequest(BaseModel):
    provider: str = "google"


class OAuthInitResponse(BaseModel):
    authorization_url: str
    provider: str
