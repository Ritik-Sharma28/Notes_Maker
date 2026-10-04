"""Rate limiting implementation using Redis."""
import time
from datetime import datetime, timedelta
from typing import Optional
from src.rate_limit.redis_client import redis_client
from src.config.settings import settings
from src.utils.logger import logger
from src.utils.exceptions import RateLimitExceeded


class RateLimiter:
    """Rate limiter using Redis sliding window."""

    def __init__(self):
        self.redis = None

    async def _get_redis(self):
        """Get Redis client instance."""
        if self.redis is None:
            self.redis = await redis_client.get_client()
        return self.redis

    async def check_rate_limit(
        self,
        user_id: str,
        user_role: str,
        action: str = "ingest"
    ) -> tuple[bool, Optional[str]]:
        """
        Check if user has exceeded rate limit.
        Returns (allowed, error_message).
        """
        # Admins have unlimited access
        if user_role == "admin":
            return True, None

        redis = await self._get_redis()

        # Get limit based on role
        if action == "ingest":
            max_requests = settings.RATE_LIMIT_USER_MAX_PER_WEEK
            window_seconds = 7 * 24 * 60 * 60  # 1 week
        elif action == "retry":
            max_requests = settings.RATE_LIMIT_RETRY_MAX_PER_SOURCE
            window_seconds = 24 * 60 * 60  # 1 day
        else:
            return True, None

        if max_requests <= 0:  # Unlimited
            return True, None

        key = f"rate_limit:{user_id}:{action}"

        try:
            # Get current count and window start
            pipe = redis.pipeline()
            pipe.get(key)
            pipe.ttl(key)
            results = await pipe.execute()

            current_count = int(results[0]) if results[0] else 0
            ttl = results[1]

            # If key doesn't exist or expired, start fresh
            if current_count == 0 or ttl == -2:
                await redis.setex(key, window_seconds, 1)
                return True, None

            # Check if limit exceeded
            if current_count >= max_requests:
                reset_time = datetime.now() + timedelta(seconds=ttl)
                error_msg = (
                    f"Rate limit exceeded. Maximum {max_requests} {action}s per {window_seconds // 86400} days. "
                    f"Resets at {reset_time.strftime('%Y-%m-%d %H:%M:%S')}"
                )
                logger.warning(f"Rate limit exceeded for user {user_id}: {error_msg}")
                return False, error_msg

            # Increment counter
            await redis.incr(key)
            return True, None

        except Exception as e:
            logger.error(f"Rate limit check failed: {str(e)}")
            # Fail open: allow request if Redis fails
            return True, None

    async def reset_rate_limit(self, user_id: str, action: str = "ingest"):
        """Reset rate limit for a user (admin only)."""
        redis = await self._get_redis()
        key = f"rate_limit:{user_id}:{action}"
        await redis.delete(key)
        logger.info(f"Rate limit reset for user {user_id}, action {action}")


rate_limiter = RateLimiter()
