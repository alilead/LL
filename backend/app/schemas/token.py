from typing import Optional
from pydantic import BaseModel, EmailStr, constr, Field
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_at: datetime

class TokenPayload(BaseModel):
    sub: Optional[int] = None
    exp: Optional[float] = Field(None, description="Token expiration timestamp")
    organization_id: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: constr(min_length=6)  # En az 6 karakter

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_at: datetime
    user_id: int
    email: str
    organization_id: int