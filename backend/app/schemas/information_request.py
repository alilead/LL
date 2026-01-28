from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class InformationRequestBase(BaseModel):
    lead_id: int
    field_name: str
    notes: Optional[str] = None

class InformationRequestCreate(InformationRequestBase):
    pass

class InformationRequestUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class InformationRequestInDB(InformationRequestBase):
    id: int
    requested_by: int
    status: str
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Response schemas
class InformationRequestResponse(InformationRequestInDB):
    requester_name: Optional[str] = None
    lead_name: Optional[str] = None

    class Config:
        from_attributes = True
