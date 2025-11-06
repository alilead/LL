from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from zoneinfo import ZoneInfo, available_timezones


class EventAttendeeBase(BaseModel):
    user_id: int
    status: str = "pending"


class EventAttendeeCreate(EventAttendeeBase):
    pass


class EventAttendeeUpdate(BaseModel):
    status: str


class EventAttendee(EventAttendeeBase):
    id: int
    event_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: str
    location: Optional[str] = None
    is_all_day: bool = False
    lead_id: Optional[int] = None
    deal_id: Optional[int] = None
    timezone: Optional[str] = None

    @validator('timezone')
    def validate_timezone(cls, v):
        if v and v not in available_timezones():
            raise ValueError('Invalid timezone')
        return v


class EventCreate(EventBase):
    start_date: datetime
    end_date: datetime
    organization_id: int
    status: str = "scheduled"
    attendee_ids: Optional[List[int]] = None

    @validator('start_date', 'end_date', pre=True)
    def ensure_timezone(cls, v, values):
        if isinstance(v, datetime) and not v.tzinfo:
            timezone = values.get('timezone', 'UTC')
            try:
                return v.replace(tzinfo=ZoneInfo(timezone))
            except Exception:
                return v.replace(tzinfo=ZoneInfo('UTC'))
        return v


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    is_all_day: Optional[bool] = None
    status: Optional[str] = None
    lead_id: Optional[int] = None
    deal_id: Optional[int] = None
    attendee_ids: Optional[List[int]] = None
    timezone: Optional[str] = None

    @validator('timezone')
    def validate_timezone(cls, v):
        if v and v not in available_timezones():
            raise ValueError('Invalid timezone')
        return v

    @validator('start_date', 'end_date', pre=True)
    def ensure_timezone(cls, v, values):
        if isinstance(v, datetime) and not v.tzinfo:
            timezone = values.get('timezone', 'UTC')
            try:
                return v.replace(tzinfo=ZoneInfo(timezone))
            except Exception:
                return v.replace(tzinfo=ZoneInfo('UTC'))
        return v


class Event(EventBase):
    id: int
    organization_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    start_date: datetime
    end_date: datetime
    status: str
    source_email_id: Optional[int] = None
    email_account_id: Optional[int] = None

    class Config:
        from_attributes = True


class EventResponse(BaseModel):
    success: bool = True
    message: str = "Operation successful"
    data: Optional[Event] = None


class EventListResponse(BaseModel):
    items: List[Event]
    total: int
    skip: int
    limit: int
