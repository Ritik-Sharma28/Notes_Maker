"""Request logging middleware."""
import time
from fastapi import Request
from src.utils.logger import logger


async def logging_middleware(request: Request, call_next):
    """Request logging middleware."""
    start_time = time.time()

    # Log request
    logger.info(
        f"Request: {request.method} {request.url.path}",
        extra={
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host if request.client else None
        }
    )

    response = await call_next(request)

    # Log response
    duration = time.time() - start_time
    logger.info(
        f"Response: {response.status_code} - {duration:.3f}s",
        extra={
            "status_code": response.status_code,
            "duration": duration
        }
    )

    return response
