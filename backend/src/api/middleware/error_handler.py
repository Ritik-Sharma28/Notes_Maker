"""Global error handler middleware."""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from src.utils.logger import logger
from src.utils.exceptions import RateLimitExceeded
from sqlalchemy.exc import SQLAlchemyError


async def error_handler(request: Request, call_next):
    """Global error handler middleware."""
    try:
        response = await call_next(request)
        return response

    except RateLimitExceeded as e:
        logger.warning(f"Rate limit exceeded: {e.message}")
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": e.message}
        )

    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Database error occurred"}
        )

    except ValueError as e:
        logger.warning(f"Validation error: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": str(e)}
        )

    except Exception as e:
        logger.error(f"Unhandled error: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"}
        )
