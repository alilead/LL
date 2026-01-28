from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class PermissionBase(BaseModel):
    name: str
    description: Optional[str] = None

class Permission(PermissionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: Optional[bool] = True
    is_system: Optional[bool] = False
    organization_id: int

class RoleCreate(RoleBase):
    permission_ids: Optional[List[int]] = []

class RoleUpdate(RoleBase):
    name: Optional[str] = None
    organization_id: Optional[int] = None
    permission_ids: Optional[List[int]] = []

class Role(RoleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    permissions: List[Permission] = []

    class Config:
        from_attributes = True

class RoleInDB(Role):
    pass

class RoleList(BaseModel):
    items: List[Role]
    total: int
    page: int
    size: int
    has_more: bool = False

RoleResponse = Role  # This creates an alias
RoleListResponse = RoleList  # This creates an alias for list response

