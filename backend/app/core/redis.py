import redis
from app.core.config import settings

class RedisClient:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            decode_responses=True
        )

    def get_client(self):
        return self.redis_client

    def ping(self):
        try:
            return self.redis_client.ping()
        except redis.ConnectionError:
            return False

Redis = RedisClient()
