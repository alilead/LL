from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.info_request import RequestStatus

class InfoRequestBase(BaseModel):
    lead_id: int
    field_name: str
    note: Optional[str] = None

class InfoRequestCreate(InfoRequestBase):
    pass

class InfoRequestUpdate(BaseModel):
    status: RequestStatus
    assigned_to: Optional[int] = None
    note: Optional[str] = None

class InfoRequestResponse(InfoRequestBase):
    id: int
    status: RequestStatus
    requested_by: int
    assigned_to: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
