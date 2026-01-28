# /backend/app/schemas/event_attendee.py
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class EventAttendeeBase(BaseModel):
    event_id: int
    contact_id: int
    status: Optional[str] = "pending"  # pending, confirmed, declined
    notes: Optional[str] = None

class EventAttendeeCreate(EventAttendeeBase):
    pass

class EventAttendeeUpdate(EventAttendeeBase):
    pass

class EventAttendee(EventAttendeeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True