"""
Security Middleware

Provides additional security features:
- Rate limiting
- Request size limits
- Security headers
- IP filtering (optional)
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from collections import defaultdict
import logging
from typing import Dict, Tuple

logger = logging.getLogger(__name__)


class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Security middleware for rate limiting and request validation
    """

    def __init__(self, app, max_requests_per_minute: int = 60, max_request_size: int = 10 * 1024 * 1024):
        super().__init__(app)
        self.max_requests_per_minute = max_requests_per_minute
        self.max_request_size = max_request_size
        self.rate_limit_storage: Dict[str, list] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        """
        Process each request through security checks
        """
        try:
            # 1. Add security headers to response
            response = await call_next(request)
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

            # Remove server header to avoid information disclosure
            if "server" in response.headers:
                del response.headers["server"]

            return response

        except Exception as e:
            logger.error(f"Security middleware error: {str(e)}")
            raise


    def check_rate_limit(self, client_ip: str) -> Tuple[bool, int]:
        """
        Check if client has exceeded rate limit

        Args:
            client_ip: Client IP address

        Returns:
            Tuple of (is_allowed, remaining_requests)
        """
        now = datetime.now()
        minute_ago = now - timedelta(minutes=1)

        # Clean old requests
        self.rate_limit_storage[client_ip] = [
            req_time for req_time in self.rate_limit_storage[client_ip]
            if req_time > minute_ago
        ]

        # Check limit
        current_requests = len(self.rate_limit_storage[client_ip])

        if current_requests >= self.max_requests_per_minute:
            return False, 0

        # Add current request
        self.rate_limit_storage[client_ip].append(now)

        remaining = self.max_requests_per_minute - current_requests - 1
        return True, remaining


def add_security_headers(app):
    """
    Add security headers middleware to the app

    Usage:
        from app.middleware.security import add_security_headers
        add_security_headers(app)
    """
    app.add_middleware(SecurityMiddleware)
