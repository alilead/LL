from pydantic import BaseModel
from typing import Dict, Optional

class ServiceStatus(BaseModel):
    status: str
    latency_ms: float
    error: Optional[str] = None

class DatabaseStatus(ServiceStatus):
    pass

class CacheStatus(ServiceStatus):
    pass

class HealthCheck(BaseModel):
    status: str
    version: str
    environment: str
    services: Dict[str, ServiceStatus]
