"""Redis client for rate limiting."""
import redis.asyncio as redis
from src.config.settings import settings
from src.utils.logger import logger


class RedisClient:
    """Singleton Redis client for rate limiting."""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    async def get_client(self) -> redis.Redis:
        """Get or create Redis client."""
        if not hasattr(self, '_client') or self._client is None:
            try:
                self._client = redis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True,
                )
                await self._client.ping()
                logger.info("Redis client connected")
            except Exception as e:
                logger.error(f"Redis connection failed: {str(e)}")
                raise
        return self._client

    async def close(self):
        """Close Redis connection."""
        if hasattr(self, '_client') and self._client:
            await self._client.close()
            self._client = None


redis_client = RedisClient()
