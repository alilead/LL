from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from .user import User
from .organization import Organization
from .contact import Contact

class OpportunityBase(BaseModel):
    title: str
    description: Optional[str] = None
    value: float = Field(ge=0)
    probability: int = Field(ge=0, le=100)
    expected_close_date: Optional[datetime] = None
    status: str
    source: str
    organization_id: int
    contact_id: Optional[int] = None
    user_id: int

class OpportunityCreate(OpportunityBase):
    pass

class OpportunityUpdate(OpportunityBase):
    pass

class Opportunity(OpportunityBase):
    id: int
    created_at: datetime
    updated_at: datetime
    organization: Optional[Organization] = None
    contact: Optional[Contact] = None
    user: Optional[User] = None

    class Config:
        from_attributes = True

class OpportunityInDB(Opportunity):
    pass