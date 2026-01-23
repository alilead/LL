from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
import re

class DomainValidatorMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Host bilgisini al
        host = request.headers.get("host", "").lower()
        if ":" in host:
            host = host.split(":")[0]
            
        # İzin verilen domainler
        allowed_domains = [
            settings.API_DOMAIN,  # api.the-leadlab.com
            settings.DOMAIN,      # the-leadlab.com
            "localhost",          # Geliştirme için
            "127.0.0.1"          # Geliştirme için
        ]
        
        # Alt domain kontrolü
        is_allowed = False
        for domain in allowed_domains:
            if host == domain or (
                domain != "localhost" and 
                domain != "127.0.0.1" and 
                host.endswith("." + domain)
            ):
                is_allowed = True
                break
                
        # Domain izinli değilse hata ver
        if not is_allowed:
            raise HTTPException(
                status_code=403,
                detail=f"Access not allowed from domain: {host}"
            )
            
        # CORS başlıklarını ekle
        response = await call_next(request)
        if host != "localhost" and host != "127.0.0.1":
            response.headers["Access-Control-Allow-Origin"] = f"https://{settings.FRONTEND_DOMAIN}"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = ", ".join(settings.CORS_ALLOW_METHODS)
            response.headers["Access-Control-Allow-Headers"] = ", ".join(settings.CORS_ALLOW_HEADERS)
            
        return response