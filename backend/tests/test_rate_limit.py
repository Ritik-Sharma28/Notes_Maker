import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from src.rate_limit.limiter import RateLimiter

@pytest.fixture
def rate_limiter():
    limiter = RateLimiter()
    # Mock redis client properly: pipeline is sync, execute/incr/setex are async
    mock_redis = MagicMock()
    
    mock_pipe = MagicMock()
    mock_pipe.execute = AsyncMock()
    
    mock_redis.pipeline.return_value = mock_pipe
    mock_redis.incr = AsyncMock()
    mock_redis.setex = AsyncMock()
    
    limiter.redis = mock_redis
    return limiter

@pytest.mark.asyncio
async def test_check_rate_limit_admin(rate_limiter):
    # Admin should always pass without hitting redis
    allowed, error = await rate_limiter.check_rate_limit("user_123", "admin", "ingest")
    assert allowed is True
    assert error is None
    
    # Verify redis was not called
    rate_limiter.redis.pipeline.assert_not_called()

@pytest.mark.asyncio
@patch("src.rate_limit.limiter.settings")
async def test_check_rate_limit_regular_user_allowed(mock_settings, rate_limiter):
    mock_settings.RATE_LIMIT_USER_MAX_PER_WEEK = 2
    
    # Mock redis pipeline behavior: under limit
    rate_limiter.redis.pipeline().execute.return_value = [1, 3600]
    
    allowed, error = await rate_limiter.check_rate_limit("user_123", "regular", "ingest")
    
    assert allowed is True
    assert error is None
    rate_limiter.redis.incr.assert_called_once_with("rate_limit:user_123:ingest")

@pytest.mark.asyncio
@patch("src.rate_limit.limiter.settings")
async def test_check_rate_limit_regular_user_exceeded(mock_settings, rate_limiter):
    mock_settings.RATE_LIMIT_USER_MAX_PER_WEEK = 2
    
    # Mock redis pipeline behavior: exceeded limit
    rate_limiter.redis.pipeline().execute.return_value = [2, 3600]
    
    allowed, error = await rate_limiter.check_rate_limit("user_123", "regular", "ingest")
    
    assert allowed is False
    assert "Rate limit exceeded" in error
    rate_limiter.redis.incr.assert_not_called()
