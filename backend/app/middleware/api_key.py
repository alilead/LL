from fastapi import Request, HTTPException
from app.core.config import settings
from app.core.cache import MySQLCache
from datetime import datetime, timedelta
import hmac
import hashlib
import time
from typing import Optional

class APIKeyValidator:
    def __init__(self):
        self.cache = MySQLCache()
        self.cache_ttl = 3600  # 1 saat
        self.max_timestamp_diff = 300  # 5 dakika

    def _get_cache_key(self, api_key: str) -> str:
        """Cache key oluştur"""
        return f"api_key:{api_key}"

    def _validate_timestamp(self, timestamp: str) -> bool:
        """Timestamp kontrolü"""
        try:
            ts = int(timestamp)
            now = int(time.time())
            return abs(now - ts) <= self.max_timestamp_diff
        except:
            return False

    def _calculate_signature(self, api_key: str, timestamp: str, path: str) -> str:
        """HMAC imzası oluştur"""
        message = f"{api_key}:{timestamp}:{path}"
        return hmac.new(
            settings.API_SECRET_KEY.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()

    def _is_excluded_path(self, path: str) -> bool:
        """Bazı path'ler için API key kontrolünü atla"""
        excluded_paths = [
            "/api/docs",
            "/api/redoc",
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/health"
        ]
        return any(path.startswith(prefix) for prefix in excluded_paths)

    async def validate(self, request: Request):
        """API key doğrulama"""
        # Hariç tutulan path'leri kontrol et
        if self._is_excluded_path(request.url.path):
            return

        # Header'ları kontrol et
        api_key = request.headers.get("X-API-Key")
        timestamp = request.headers.get("X-Timestamp")
        signature = request.headers.get("X-Signature")

        if not all([api_key, timestamp, signature]):
            raise HTTPException(
                status_code=401,
                detail="Missing authentication headers"
            )

        # Timestamp kontrolü
        if not self._validate_timestamp(timestamp):
            raise HTTPException(
                status_code=401,
                detail="Invalid timestamp"
            )

        # Cache'den API key kontrolü
        cache_key = self._get_cache_key(api_key)
        cached_data = self.cache.get(cache_key)

        if cached_data is None:
            # Veritabanından API key kontrolü yap
            # TODO: API key veritabanı kontrolü
            is_valid = api_key in settings.VALID_API_KEYS
            if not is_valid:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid API key"
                )
            # Cache'e ekle
            self.cache.set(cache_key, {"valid": True}, self.cache_ttl)
        elif not cached_data.get("valid", False):
            raise HTTPException(
                status_code=401,
                detail="Invalid API key"
            )

        # İmza kontrolü
        expected_signature = self._calculate_signature(
            api_key, timestamp, request.url.path
        )
        if not hmac.compare_digest(signature, expected_signature):
            raise HTTPException(
                status_code=401,
                detail="Invalid signature"
            )

        # API key bilgilerini request state'e ekle
        request.state.api_key = api_key
