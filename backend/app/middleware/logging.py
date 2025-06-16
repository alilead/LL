import time
import json
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.base import RequestResponseEndpoint
from app.core.config import settings
from app.utils.logger import logger

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, 
        request: Request, 
        call_next: RequestResponseEndpoint
    ) -> Response:
        # İstek başlangıç zamanı
        start_time = time.time()
        
        # İstek bilgileri
        request_id = request.headers.get("X-Request-ID", "")
        client_ip = request.client.host if request.client else ""
        user_agent = request.headers.get("User-Agent", "")
        referer = request.headers.get("Referer", "")
        
        # İstek logla
        logger.info(
            "Request",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "client_ip": client_ip,
                "user_agent": user_agent,
                "referer": referer
            }
        )
        
        try:
            # İsteği işle
            response = await call_next(request)
            
            # Yanıt süresi
            duration = time.time() - start_time
            
            # Yanıt logla
            logger.info(
                "Response",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration": f"{duration:.3f}s"
                }
            )
            
            # Debug modunda detaylı log
            if settings.APP_DEBUG:
                # Request body
                try:
                    body = await request.body()
                    if body:
                        logger.debug(
                            "Request Body",
                            extra={
                                "request_id": request_id,
                                "body": body.decode()
                            }
                        )
                except Exception:
                    pass
                    
                # Response body
                try:
                    body = b""
                    async for chunk in response.body_iterator:
                        body += chunk
                    if body:
                        logger.debug(
                            "Response Body",
                            extra={
                                "request_id": request_id,
                                "body": body.decode()
                            }
                        )
                except Exception:
                    pass
                    
            return response
            
        except Exception as e:
            # Hata logla
            logger.error(
                "Request Failed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "error": str(e),
                    "duration": f"{time.time() - start_time:.3f}s"
                }
            )
            raise