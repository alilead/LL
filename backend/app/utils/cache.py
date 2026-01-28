from pymemcache.client.base import Client
from typing import Any, Optional
import json
import pickle

class JsonSerde:
    def serialize(self, key: str, value: Any) -> tuple[Any, int]:
        if isinstance(value, str):
            return value, 1
        return json.dumps(value), 2

    def deserialize(self, key: str, value: Any, flags: int) -> Any:
        if flags == 1:
            return value
        if flags == 2:
            return json.loads(value)
        raise Exception("Unknown serialization format")

class CacheManager:
    def __init__(self):
        self.client = Client(
            ('localhost', 11211),
            serde=JsonSerde(),
            connect_timeout=1,
            timeout=0.5,
            no_delay=True,
            ignore_exc=True
        )

    async def get(self, key: str) -> Optional[Any]:
        try:
            return self.client.get(key)
        except:
            return None

    async def set(self, key: str, value: Any, expire: int = 3600) -> bool:
        try:
            return self.client.set(key, value, expire=expire)
        except:
            return False

    async def delete(self, key: str) -> bool:
        try:
            return self.client.delete(key)
        except:
            return False

    async def flush(self) -> bool:
        try:
            return self.client.flush_all()
        except:
            return False

cache_manager = CacheManager()
