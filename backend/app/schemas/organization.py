from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str
    description: Optional[str] = None
    website: Optional[str] = None
    is_active: bool = True
    logo_filename: Optional[str] = None
    logo_content_type: Optional[str] = None
    logo_path: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(OrganizationBase):
    name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    is_active: Optional[bool] = None
    logo_filename: Optional[str] = None
    logo_content_type: Optional[str] = None
    logo_path: Optional[str] = None

class Organization(OrganizationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OrganizationList(BaseModel):
    items: List[Organization]
    total: int
    skip: int
    limit: int

    class Config:
        from_attributes = True
