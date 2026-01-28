# /backend/app/schemas/contact.py
from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

class ContactBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    
class ContactCreate(ContactBase):
    pass

class ContactUpdate(ContactBase):
    pass

class Contact(ContactBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str
    to_email: EmailStr