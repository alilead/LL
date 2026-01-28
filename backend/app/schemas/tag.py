from typing import Optional, List
from pydantic import BaseModel

# Tag Base Schema
class TagBase(BaseModel):
    name: str

# Properties to receive via API on creation
class TagCreate(TagBase):
    pass

# Properties to receive via API on update
class TagUpdate(BaseModel):
    name: Optional[str] = None

# Properties stored in DB
class TagInDB(TagBase):
    id: int
    organization_id: int

    class Config:
        from_attributes = True

# Properties to return via API
class Tag(TagBase):
    id: int
    organization_id: int
    organization_name: Optional[str] = None

    class Config:
        from_attributes = True

# Properties for Tag list
class TagList(BaseModel):
    tags: List[Tag]

# Properties to receive via API for lead tag creation
class LeadTagCreate(BaseModel):
    lead_id: int
    tag_id: int
