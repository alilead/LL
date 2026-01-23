from datetime import datetime
from app.core.logger import logger
from app.core.config import settings
from typing import Dict, Any
import aiohttp
import psutil

async def comprehensive_health_check() -> Dict[str, Any]:
    checks = {
        "api": await check_api_health(),
        "database": await check_db_health(),
        "cache": await check_redis_health(),
        "external_services": await check_external_services(),
        "system": check_system_health()
    }
    
    overall_status = all(check.get("status") == "healthy" for check in checks.values())
    
    return {
        "status": "healthy" if overall_status else "degraded",
        "checks": checks,
        "timestamp": datetime.utcnow().isoformat()
    } 