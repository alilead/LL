from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime

class TransactionBase(BaseModel):
    user_id: int
    lead_id: Optional[int] = None
    type: str
    amount: float
    data_type: str
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    type: Optional[str] = None
    amount: Optional[float] = None
    data_type: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class TransactionInDB(TransactionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TransactionList(BaseModel):
    total: int
    items: list[TransactionInDB]

class TransactionStats(BaseModel):
    total_transactions: int
    total_amount: float
    avg_amount: float
    transaction_types: Dict[str, int]
    data_types: Dict[str, int]
    daily_stats: Dict[str, float]
    monthly_stats: Dict[str, float]
