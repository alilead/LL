from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.datastructures import MutableHeaders
import logging

logger = logging.getLogger(__name__)

class URLNormalizerMiddleware(BaseHTTPMiddleware):
    """
    Middleware to normalize URLs by removing trailing slashes.
    This helps ensure consistent API paths while preserving authentication headers.
    """
    
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # Skip URL normalization for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)
        
        # Handle trailing slashes for API endpoints only
        if path.startswith("/api/v1") and path != "/api/v1" and path.endswith("/"):
            # Create normalized path without trailing slash
            normalized_path = path.rstrip("/")
            
            logger.info(f"Normalizing path from {path} to {normalized_path}")
            
            # Create a new request scope with the modified path
            # This approach keeps all headers including authorization headers
            request.scope["path"] = normalized_path
            request.scope["raw_path"] = normalized_path.encode("utf-8")
            
            # Log the request headers for debugging - headers are a list of tuples
            # Note: MutableHeaders constructor takes the headers list directly, no need for .items()
            headers = MutableHeaders(scope=request.scope)
            auth_header = headers.get("authorization", "Not present")
            logger.debug(f"Authorization header: {auth_header}")
        
        # Process the request with potentially modified path
        return await call_next(request) 