from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    company: Optional[str] = None
    job_title: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: Optional[bool] = False
    is_admin: Optional[bool] = False
    organization_id: Optional[int] = None

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: int
    organization_id: int
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

# Additional properties to return via API
class User(UserInDBBase):
    pass

# Properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str

# Simplified user response for organization users
class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    organization_id: int
    is_active: bool = True
    is_admin: bool = False
    organization_role: str = "member"  # viewer, member, manager
    job_title: Optional[str] = None

    class Config:
        from_attributes = True

class UserList(BaseModel):
    items: List[UserResponse]
    total: int
    page: int
    size: int
    has_more: bool = False

    class Config:
        from_attributes = True
