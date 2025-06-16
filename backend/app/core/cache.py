from functools import wraps
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.cache import Cache
from app.db.session import SessionLocal
import json
import hashlib
from typing import Dict, Any, List, Optional

class MySQLCache:
    def __init__(self, db: Session = None):
        self.db = db or SessionLocal()

    def get(self, key: str) -> Optional[Any]:
        """Tek bir key için cache kontrolü"""
        try:
            cache_item = self.db.query(Cache).filter(
                Cache.key == key,
                Cache.expires_at > datetime.utcnow()
            ).first()
            return json.loads(cache_item.value) if cache_item else None
        except Exception:
            return None

    def get_many(self, keys: List[str]) -> Dict[str, Any]:
        """Birden fazla key için cache kontrolü"""
        try:
            cache_items = self.db.query(Cache).filter(
                Cache.key.in_(keys),
                Cache.expires_at > datetime.utcnow()
            ).all()
            return {
                item.key: json.loads(item.value)
                for item in cache_items
            }
        except Exception:
            return {}

    def set(self, key: str, value: Any, expire: int = 3600) -> bool:
        """Tek bir key için cache set"""
        try:
            cache_item = self.db.query(Cache).filter(Cache.key == key).first()
            if cache_item:
                cache_item.value = json.dumps(value)
                cache_item.expires_at = datetime.utcnow() + timedelta(seconds=expire)
            else:
                cache_item = Cache(
                    key=key,
                    value=json.dumps(value),
                    expires_at=datetime.utcnow() + timedelta(seconds=expire)
                )
                self.db.add(cache_item)
            self.db.commit()
            return True
        except Exception:
            self.db.rollback()
            return False

    def set_many(self, items: Dict[str, Any], expire: int = 3600) -> bool:
        """Birden fazla key için cache set"""
        try:
            for key, value in items.items():
                cache_item = self.db.query(Cache).filter(Cache.key == key).first()
                if cache_item:
                    cache_item.value = json.dumps(value)
                    cache_item.expires_at = datetime.utcnow() + timedelta(seconds=expire)
                else:
                    cache_item = Cache(
                        key=key,
                        value=json.dumps(value),
                        expires_at=datetime.utcnow() + timedelta(seconds=expire)
                    )
                    self.db.add(cache_item)
            self.db.commit()
            return True
        except Exception:
            self.db.rollback()
            return False

    def delete(self, key: str) -> bool:
        """Tek bir key için cache silme"""
        try:
            self.db.query(Cache).filter(Cache.key == key).delete()
            self.db.commit()
            return True
        except Exception:
            self.db.rollback()
            return False

    def delete_many(self, keys: List[str]) -> bool:
        """Birden fazla key için cache silme"""
        try:
            self.db.query(Cache).filter(Cache.key.in_(keys)).delete(synchronize_session=False)
            self.db.commit()
            return True
        except Exception:
            self.db.rollback()
            return False

    def cleanup(self) -> bool:
        """Süresi dolmuş cache'leri temizle"""
        try:
            self.db.query(Cache).filter(
                Cache.expires_at < datetime.utcnow()
            ).delete(synchronize_session=False)
            self.db.commit()
            return True
        except Exception:
            self.db.rollback()
            return False

    def clear(self) -> bool:
        """Tüm cache'i temizle"""
        try:
            self.db.query(Cache).delete(synchronize_session=False)
            self.db.commit()
            return True
        except Exception:
            self.db.rollback()
            return False

def cache(ttl_seconds: int = 300):
    """Cache decorator"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Cache key oluştur
            key_parts = [func.__name__]
            key_parts.extend([str(arg) for arg in args])
            key_parts.extend([f"{k}:{v}" for k, v in kwargs.items()])
            cache_key = hashlib.md5(":".join(key_parts).encode()).hexdigest()
            
            # Cache instance
            cache_client = MySQLCache()
            
            # Cache'den kontrol et
            cached_value = cache_client.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Fonksiyonu çalıştır ve sonucu cache'le
            result = await func(*args, **kwargs)
            cache_client.set(cache_key, result, ttl_seconds)
            return result
            
        return wrapper
    return decorator