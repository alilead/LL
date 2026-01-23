from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from enum import Enum


class EmailStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class EmailLogBase(BaseModel):
    to_email: str
    subject: str
    content: str
    status: Optional[EmailStatus] = EmailStatus.PENDING
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    organization_id: int
    template_id: Optional[int] = None
    user_id: int


class EmailLogCreate(EmailLogBase):
    pass


class EmailLogUpdate(EmailLogBase):
    pass


class EmailLog(EmailLogBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True