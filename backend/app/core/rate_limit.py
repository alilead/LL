from fastapi import HTTPException
from datetime import datetime, timedelta
from typing import Dict, Tuple
import asyncio
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self):
        self._requests: Dict[str, list] = {}
        self._locks: Dict[str, asyncio.Lock] = {}

    async def _clean_old_requests(self, key: str, period: int):
        """Remove requests older than the period"""
        now = datetime.utcnow()
        self._requests[key] = [
            req_time for req_time in self._requests[key]
            if now - req_time < timedelta(seconds=period)
        ]

    async def check_rate_limit(self, key: str, limit: int, period: int) -> Tuple[bool, int]:
        """Check if the request should be rate limited"""
        if key not in self._locks:
            self._locks[key] = asyncio.Lock()
            
        async with self._locks[key]:
            now = datetime.utcnow()
            
            if key not in self._requests:
                self._requests[key] = []
                
            await self._clean_old_requests(key, period)
            
            if len(self._requests[key]) >= limit:
                return False, len(self._requests[key])
                
            self._requests[key].append(now)
            return True, len(self._requests[key])

rate_limiter = RateLimiter()

def rate_limit(limit: int, period: int):
    """
    Rate limiting decorator
    :param limit: Number of requests allowed
    :param period: Time period in seconds
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Generate a key based on the function name and arguments
            key = f"{func.__name__}:{args[0] if args else ''}"
            
            allowed, current_requests = await rate_limiter.check_rate_limit(key, limit, period)
            
            if not allowed:
                logger.warning(f"Rate limit exceeded for {key}: {current_requests}/{limit} requests")
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "Rate limit exceeded",
                        "limit": limit,
                        "period": period,
                        "current_requests": current_requests
                    }
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator 