from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class CurrencyBase(BaseModel):
    code: str
    name: str
    symbol: str
    is_active: bool = True

class CurrencyCreate(CurrencyBase):
    pass

class CurrencyUpdate(CurrencyBase):
    pass

class Currency(CurrencyBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
