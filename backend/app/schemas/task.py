from typing import Optional, List, Any
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from app.models.task import TaskPriority, TaskStatus


def _normalize_priority(v: Any) -> Any:
    if isinstance(v, str):
        return v.upper().strip()
    return v


def _normalize_status(v: Any) -> Any:
    if isinstance(v, str):
        return v.upper().strip().replace("-", "_")
    return v

# Lead information schema
class LeadInfo(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: Optional[str] = None
    company: Optional[str] = None

    class Config:
        from_attributes = True

# User information schema
class UserInfo(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    job_title: Optional[str] = None

    class Config:
        from_attributes = True

# Task Base Schema
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: datetime
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.PENDING
    lead_id: Optional[int] = None
    assigned_to_id: Optional[int] = None
    organization_id: int

# Properties to receive via API on creation
class TaskCreate(TaskBase):
    organization_id: int = Field(..., description="Organization ID is required for task creation")

    @field_validator("priority", mode="before")
    @classmethod
    def priority_upper(cls, v: Any) -> Any:
        return _normalize_priority(v)

    @field_validator("status", mode="before")
    @classmethod
    def status_upper(cls, v: Any) -> Any:
        return _normalize_status(v)

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Complete client meeting",
                "description": "Discuss project requirements with client",
                "due_date": "2023-12-31T14:00:00Z",
                "priority": "MEDIUM",
                "status": "PENDING",
                "lead_id": 1,
                "assigned_to_id": 2,
                "organization_id": 1
            }
        }

# Properties to receive via API on update
class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None

    @field_validator("priority", mode="before")
    @classmethod
    def priority_upper(cls, v: Any) -> Any:
        if v is None:
            return v
        return _normalize_priority(v)

    @field_validator("status", mode="before")
    @classmethod
    def status_upper(cls, v: Any) -> Any:
        if v is None:
            return v
        return _normalize_status(v)

    lead_id: Optional[int] = None
    assigned_to_id: Optional[int] = None
    completed_at: Optional[datetime] = None

# Properties stored in DB
class TaskInDB(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Properties to return via API
class Task(TaskInDB):
    lead: Optional[LeadInfo] = None
    assigned_to: Optional[UserInfo] = None

    class Config:
        from_attributes = True

# Properties for Task list
class TaskList(BaseModel):
    items: List[Task]
    total: int

    class Config:
        from_attributes = True
