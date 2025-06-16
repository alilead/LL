from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

# LinkedIn Templates
class LinkedInTemplateBase(BaseModel):
    name: str
    content: str
    variables: Optional[Dict[str, Any]] = None
    organization_id: int

class LinkedInTemplateCreate(LinkedInTemplateBase):
    pass

class LinkedInTemplateUpdate(LinkedInTemplateBase):
    name: Optional[str] = None
    content: Optional[str] = None
    variables: Optional[Dict[str, Any]] = None
    organization_id: Optional[int] = None

class LinkedInTemplate(LinkedInTemplateBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# LinkedIn Connections
class LinkedInConnectionBase(BaseModel):
    lead_id: int
    user_id: int
    status: str = Field(..., description="pending, connected, rejected")
    notes: Optional[str] = None

class LinkedInConnectionCreate(LinkedInConnectionBase):
    pass

class LinkedInConnectionUpdate(LinkedInConnectionBase):
    lead_id: Optional[int] = None
    user_id: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class LinkedInConnection(LinkedInConnectionBase):
    id: int
    connected_at: Optional[datetime]
    last_interaction: Optional[datetime]

    class Config:
        from_attributes = True

# LinkedIn Interactions
class LinkedInInteractionBase(BaseModel):
    lead_id: int
    user_id: int
    type: str = Field(..., description="message, connection_request, profile_view")
    content: Optional[str] = None
    status: str = Field(..., description="sent, delivered, read, replied")

class LinkedInInteractionCreate(LinkedInInteractionBase):
    pass

class LinkedInInteractionUpdate(LinkedInInteractionBase):
    lead_id: Optional[int] = None
    user_id: Optional[int] = None
    type: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None

class LinkedInInteraction(LinkedInInteractionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Message Schemas
class MessageSchema(BaseModel):
    profile_id: str
    content: str
    template_id: Optional[int] = None
    variables: Optional[Dict[str, str]] = None

class ConnectionSchema(BaseModel):
    profile_id: str
    message: Optional[str] = None
    template_id: Optional[int] = None
    variables: Optional[Dict[str, str]] = None

# Response Schemas
class LinkedInTemplateList(BaseModel):
    items: List[LinkedInTemplate]
    total: int
    skip: int
    limit: int

class LinkedInConnectionList(BaseModel):
    items: List[LinkedInConnection]
    total: int
    skip: int
    limit: int

class LinkedInInteractionList(BaseModel):
    items: List[LinkedInInteraction]
    total: int
    skip: int
    limit: int

# Token Request Schema
class LinkedInTokenRequest(BaseModel):
    code: str
    code_verifier: str

# ... rest of the existing code ... 