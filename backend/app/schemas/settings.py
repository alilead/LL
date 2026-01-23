from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class OrganizationSettingsBase(BaseModel):
    name: str
    logo_url: Optional[str] = None
    timezone: str = "UTC"
    currency: str = "USD"
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    lead_fields: Dict[str, Any] = {}

class OrganizationSettingsCreate(OrganizationSettingsBase):
    organization_id: int

class OrganizationSettingsUpdate(OrganizationSettingsBase):
    pass

class OrganizationSettingsInDBBase(OrganizationSettingsBase):
    id: int
    organization_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class EmailSettingsBase(BaseModel):
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: bool = True
    default_from_email: Optional[EmailStr] = None

class EmailSettingsCreate(EmailSettingsBase):
    organization_id: int

class EmailSettingsUpdate(EmailSettingsBase):
    pass

class EmailSettingsInDBBase(EmailSettingsBase):
    id: int
    organization_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class EmailTemplateBase(BaseModel):
    name: str
    subject: str
    body: str
    is_active: bool = True

class EmailTemplateCreate(EmailTemplateBase):
    organization_id: int

class EmailTemplateUpdate(EmailTemplateBase):
    pass

class EmailTemplateInDBBase(EmailTemplateBase):
    id: int
    organization_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True) 