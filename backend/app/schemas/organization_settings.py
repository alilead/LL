from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, validator, condecimal
import pytz


class ThemeSettings(BaseModel):
    primaryColor: str = Field("#1890ff", description="Primary theme color")
    secondaryColor: str = Field("#52c41a", description="Secondary theme color")
    layout: str = Field("side", description="Layout type: side or top")
    contentWidth: str = Field("fluid", description="Content width: fluid or fixed")
    fixedHeader: bool = Field(True, description="Fixed header")
    fixSiderbar: bool = Field(True, description="Fixed sidebar")
    colorWeak: bool = Field(False, description="Color weak mode")
    darkMode: bool = Field(False, description="Dark mode")


class EmailSettings(BaseModel):
    smtp_server: str = Field(..., description="SMTP server address")
    smtp_port: int = Field(587, description="SMTP port")
    smtp_use_tls: bool = Field(True, description="Use TLS for SMTP")
    sender_name: str = Field(..., description="Sender name for emails")
    sender_email: str = Field(..., description="Sender email address")
    footer_text: Optional[str] = Field("", description="Email footer text")
    signature: Optional[str] = Field("", description="Email signature")


class NotificationSettings(BaseModel):
    email: bool = Field(True, description="Enable email notifications")
    push: bool = Field(True, description="Enable push notifications")
    in_app: bool = Field(True, description="Enable in-app notifications")
    slack: bool = Field(False, description="Enable Slack notifications")
    webhook: Optional[str] = Field(None, description="Webhook URL for notifications")


class OrganizationSettingsBase(BaseModel):
    timezone: str = Field("UTC", description="Organization timezone")
    date_format: str = Field("YYYY-MM-DD", description="Date format")
    time_format: str = Field("HH:mm", description="Time format")
    currency_id: Optional[int] = Field(None, description="Default currency ID")
    logo_url: Optional[str] = Field(None, description="Organization logo URL")
    theme_settings: Optional[ThemeSettings] = None
    email_settings: Optional[EmailSettings] = None
    notification_settings: Optional[NotificationSettings] = None
    default_lead_stage_id: Optional[int] = Field(None, description="Default lead stage ID")
    lead_auto_assignment: bool = Field(False, description="Auto-assign leads to team members")
    deal_approval_required: bool = Field(False, description="Require approval for new deals")
    min_deal_amount: Optional[condecimal(max_digits=15, decimal_places=2)] = Field(None, description="Minimum deal amount")
    max_deal_amount: Optional[condecimal(max_digits=15, decimal_places=2)] = Field(None, description="Maximum deal amount")
    task_reminder_enabled: bool = Field(True, description="Enable task reminders")
    default_task_reminder_minutes: int = Field(30, description="Default task reminder time in minutes")
    email_signature: Optional[str] = Field(None, description="Default email signature")
    default_email_template_id: Optional[int] = Field(None, description="Default email template ID")
    analytics_enabled: bool = Field(True, description="Enable analytics tracking")
    custom_analytics_settings: Optional[Dict[str, Any]] = Field(None, description="Custom analytics settings")

    @validator("timezone")
    def validate_timezone(cls, v):
        if v not in pytz.all_timezones:
            raise ValueError("Invalid timezone")
        return v


class OrganizationSettingsCreate(OrganizationSettingsBase):
    organization_id: int


class OrganizationSettingsUpdate(BaseModel):
    timezone: Optional[str] = None
    date_format: Optional[str] = None
    time_format: Optional[str] = None
    currency_id: Optional[int] = None
    logo_url: Optional[str] = None
    theme_settings: Optional[Dict[str, Any]] = None
    email_settings: Optional[Dict[str, Any]] = None
    notification_settings: Optional[Dict[str, Any]] = None
    default_lead_stage_id: Optional[int] = None
    lead_auto_assignment: Optional[bool] = None
    deal_approval_required: Optional[bool] = None
    min_deal_amount: Optional[condecimal(max_digits=15, decimal_places=2)] = None
    max_deal_amount: Optional[condecimal(max_digits=15, decimal_places=2)] = None
    task_reminder_enabled: Optional[bool] = None
    default_task_reminder_minutes: Optional[int] = None
    email_signature: Optional[str] = None
    default_email_template_id: Optional[int] = None
    analytics_enabled: Optional[bool] = None
    custom_analytics_settings: Optional[Dict[str, Any]] = None

    @validator("timezone")
    def validate_timezone(cls, v):
        if v and v not in pytz.all_timezones:
            raise ValueError("Invalid timezone")
        return v


class OrganizationSettings(OrganizationSettingsBase):
    id: int
    organization_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# API Response Models
class OrganizationSettingsResponse(BaseModel):
    success: bool = True
    message: str = "Operation successful"
    data: Optional[OrganizationSettings] = None


# Additional Schema for specific operations
class LogoUploadResponse(BaseModel):
    success: bool = True
    message: str = "Logo uploaded successfully"
    logo_url: str
