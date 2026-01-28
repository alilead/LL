from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class DealCustomFieldBase(BaseModel):
    field_name: str
    field_type: str
    field_options: Optional[List[str]] = None

class DealCustomFieldCreate(DealCustomFieldBase):
    pass

class DealCustomFieldResponse(DealCustomFieldBase):
    id: int
    organization_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DealCustomFieldValue(BaseModel):
    deal_id: int
    custom_field_id: int
    field_value: str
