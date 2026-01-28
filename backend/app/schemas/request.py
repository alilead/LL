from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class InfoRequestBase(BaseModel):
    lead_id: int
    field_name: str
    notes: Optional[str] = None

class InfoRequestCreate(InfoRequestBase):
    requested_by: int
    organization_id: int

class InfoRequest(InfoRequestBase):
    id: int
    status: str = "pending"  # pending, completed, rejected
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
