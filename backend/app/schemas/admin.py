from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime

class SystemHealth(BaseModel):
    database: bool
    crystal_api: bool
    stripe_api: bool
    celery: bool

class SystemStats(BaseModel):
    total_users: int
    total_leads: int
    total_revenue: float
    active_users: int
    system_health: SystemHealth

class UserActivityStats(BaseModel):
    date: datetime
    transactions: int
    tokens_used: float

class UserStats(BaseModel):
    lead_count: int
    total_spent: float
    token_balance: float
    activity: List[UserActivityStats] 