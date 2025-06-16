from pydantic import BaseModel, EmailStr, constr
from typing import Optional
from app.schemas.user import User

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: str
    user: User

    class Config:
        from_attributes = True
