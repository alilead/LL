from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
import re

class LeadDataValidator(BaseModel):
    email: Optional[str]
    phone: Optional[str]
    linkedin_url: Optional[str]
    
    @validator('email')
    def validate_email(cls, v):
        if v and not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("Invalid email format")
        return v
    
    @validator('linkedin_url')
    def validate_linkedin_url(cls, v):
        if v and not v.startswith(('http://www.linkedin.com', 'https://www.linkedin.com')):
            raise ValueError("Invalid LinkedIn URL")
        return v 