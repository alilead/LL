from datetime import datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field, validator


class FileEntityType(str, Enum):
    lead = "lead"
    deal = "deal"
    task = "task"
    note = "note"
    communication = "communication"


class FileBase(BaseModel):
    name: str = Field(..., description="File name")
    original_name: str = Field(..., description="Original file name")
    mime_type: str = Field(..., description="File MIME type")
    size: int = Field(..., description="File size in bytes")
    path: str = Field(..., description="File storage path")
    entity_type: FileEntityType = Field(..., description="Related entity type")
    entity_id: int = Field(..., description="Related entity ID")

    @validator('size')
    def validate_size(cls, v):
        if v < 0:
            raise ValueError("File size cannot be negative")
        return v


class FileCreate(FileBase):
    organization_id: int
    user_id: int


class FileUpdate(BaseModel):
    name: Optional[str] = None


class File(FileBase):
    id: int
    organization_id: int
    user_id: int
    created_at: datetime
    download_url: str
    preview_url: Optional[str]
    is_image: bool

    class Config:
        from_attributes = True


class FileList(BaseModel):
    files: List[File]
    total: int
    page: int
    size: int
    has_more: bool


# API Response Models
class FileResponse(BaseModel):
    success: bool = True
    message: str = "Operation successful"
    data: Optional[File] = None


class FileListResponse(BaseModel):
    success: bool = True
    message: str = "Operation successful"
    data: FileList


class FileUploadResponse(BaseModel):
    success: bool = True
    message: str = "File uploaded successfully"
    data: File


class FileDeleteResponse(BaseModel):
    success: bool = True
    message: str = "File deleted successfully"
    data: Optional[File] = None
