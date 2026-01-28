"""Email schemas for API responses and requests."""

from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field, validator

from app.models.email_message import EmailDirection
from app.models.email_message import EmailStatus as EmailStatusModel


class EmailTemplateBase(BaseModel):
    """Base email template schema."""
    name: str = Field(..., description="Template name")
    subject: str = Field(..., description="Email subject")
    content: str = Field(..., description="Email content")
    is_active: bool = Field(True, description="Whether template is active")


class EmailTemplateCreate(EmailTemplateBase):
    """Schema for creating email templates."""
    pass


class EmailTemplateUpdate(BaseModel):
    """Schema for updating email templates."""
    name: Optional[str] = Field(None, description="Template name")
    subject: Optional[str] = Field(None, description="Email subject")
    content: Optional[str] = Field(None, description="Email content")
    is_active: Optional[bool] = Field(None, description="Whether template is active")


class EmailTemplateResponse(EmailTemplateBase):
    """Schema for email template response."""
    id: int
    organization_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EmailTemplateListResponse(BaseModel):
    """Schema for email template list response."""
    templates: List[EmailTemplateResponse]
    total: int
    page: int
    per_page: int

    class Config:
        from_attributes = True


class EmailLogBase(BaseModel):
    """Base email log schema."""
    recipient: EmailStr = Field(..., description="Email recipient")
    subject: str = Field(..., description="Email subject")
    content: str = Field(..., description="Email content")
    status: str = Field(..., description="Email status")


class EmailLogResponse(EmailLogBase):
    """Schema for email log response."""
    id: int
    sender: Optional[EmailStr] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class EmailLogListResponse(BaseModel):
    """Schema for email log list response."""
    logs: List[EmailLogResponse]
    total: int
    page: int
    per_page: int

    class Config:
        from_attributes = True


class SendEmailBase(BaseModel):
    """Base schema for sending emails."""
    to: List[EmailStr] = Field(..., description="Email recipients")
    subject: str = Field(..., description="Email subject")
    content: str = Field(..., description="Email content")
    cc: Optional[List[EmailStr]] = Field(None, description="CC recipients")
    bcc: Optional[List[EmailStr]] = Field(None, description="BCC recipients")
    template_id: Optional[int] = Field(None, description="Email template ID")
    variables: Optional[Dict[str, Any]] = Field(None, description="Template variables")


class SendEmailRequest(SendEmailBase):
    """Schema for sending email request."""
    pass


class SendEmailResponse(BaseModel):
    """Schema for sending email response."""
    success: bool
    message: str
    email_id: Optional[int] = None
    errors: Optional[List[str]] = None

    class Config:
        from_attributes = True


class EmailStatus(BaseModel):
    """Schema for email status."""
    status: EmailStatusModel
    description: Optional[str] = None

    class Config:
        from_attributes = True


class EmailAttachmentBase(BaseModel):
    """Base email attachment schema."""
    filename: str = Field(..., description="Attachment filename")
    content_type: str = Field(..., description="MIME content type")
    size_bytes: int = Field(..., description="File size in bytes")


class EmailAttachmentResponse(EmailAttachmentBase):
    """Schema for email attachment response."""
    id: int
    file_path: Optional[str] = None
    is_inline: bool = False
    is_calendar_invite: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class EmailMessageBase(BaseModel):
    """Base email message schema."""
    subject: str = Field(..., description="Email subject")
    body: str = Field(..., description="Email body")
    direction: EmailDirection = Field(..., description="Email direction")
    status: EmailStatusModel = Field(..., description="Email status")


class EmailMessageResponse(EmailMessageBase):
    """Schema for email message response."""
    id: int
    message_id: Optional[str] = None
    thread_id: Optional[str] = None
    sender_email: Optional[EmailStr] = None
    recipient_email: Optional[EmailStr] = None
    cc: Optional[List[str]] = None
    bcc: Optional[List[str]] = None
    received_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    attachments: List[EmailAttachmentResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EmailMessageListResponse(BaseModel):
    """Schema for email message list response."""
    messages: List[EmailMessageResponse]
    total: int
    page: int
    per_page: int
    unread_count: int

    class Config:
        from_attributes = True


class EmailSyncStatsResponse(BaseModel):
    """Schema for email sync statistics response."""
    total_messages: int
    new_messages: int
    updated_messages: int
    failed_messages: int
    last_sync: Optional[datetime] = None
    sync_duration: Optional[float] = None

    class Config:
        from_attributes = True


class EmailConfigBase(BaseModel):
    """Base email configuration schema."""
    smtp_host: str = Field(..., description="SMTP server host")
    smtp_port: int = Field(..., description="SMTP server port")
    smtp_username: str = Field(..., description="SMTP username")
    smtp_password: str = Field(..., description="SMTP password")
    smtp_use_tls: bool = Field(True, description="Use TLS for SMTP")
    imap_host: Optional[str] = Field(None, description="IMAP server host")
    imap_port: Optional[int] = Field(None, description="IMAP server port")
    imap_username: Optional[str] = Field(None, description="IMAP username")
    imap_password: Optional[str] = Field(None, description="IMAP password")
    imap_use_ssl: bool = Field(True, description="Use SSL for IMAP")


class EmailConfigResponse(EmailConfigBase):
    """Schema for email configuration response."""
    id: int
    organization_id: int
    is_active: bool
    last_sync: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EmailHealthCheckResponse(BaseModel):
    """Schema for email health check response."""
    smtp_status: str
    imap_status: str
    last_successful_sync: Optional[datetime] = None
    error_message: Optional[str] = None
    configuration_valid: bool

    class Config:
        from_attributes = True
