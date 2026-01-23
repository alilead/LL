from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class CommunicationType(str, Enum):
    email = "email"
    sms = "sms"
    call = "call"
    meeting = "meeting"
    video_call = "video_call"
    whatsapp = "whatsapp"

class CommunicationStatus(str, Enum):
    scheduled = "scheduled"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"

class CommunicationBase(BaseModel):
    type: CommunicationType
    subject: Optional[str] = None
    content: Optional[str] = None
    status: CommunicationStatus = CommunicationStatus.scheduled
    scheduled_at: Optional[datetime] = None
    duration: Optional[int] = None  # Duration in minutes
    notes: Optional[str] = None
    organization_id: int
    lead_id: int
    deal_id: Optional[int] = None

class CommunicationCreate(CommunicationBase):
    pass

class CommunicationUpdate(BaseModel):
    type: Optional[CommunicationType] = None
    subject: Optional[str] = None
    content: Optional[str] = None
    status: Optional[CommunicationStatus] = None
    scheduled_at: Optional[datetime] = None
    duration: Optional[int] = None
    notes: Optional[str] = None
    deal_id: Optional[int] = None

class Communication(CommunicationBase):
    id: int
    user_id: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CommunicationList(BaseModel):
    items: List[Communication]
    total: int
    skip: int
    limit: int

    class Config:
        from_attributes = True
