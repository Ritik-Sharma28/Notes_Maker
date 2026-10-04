"""JWT verification for Supabase authentication."""
import jwt
from fastapi import HTTPException, status
from datetime import datetime
from src.config.settings import settings
from src.utils.logger import logger


def verify_jwt_token(token: str) -> dict:
    """
    Verify Supabase JWT token locally.
    Returns decoded payload with user info.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            audience="authenticated",
            algorithms=["HS256"],
        )

        # Check expiration
        exp = payload.get("exp")
        if exp and datetime.fromtimestamp(exp) < datetime.now():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired"
            )

        return payload

    except jwt.ExpiredSignatureError:
        logger.warning("Expired token attempt")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except Exception as e:
        logger.error(f"JWT verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication error"
        )


def get_user_role(email: str) -> str:
    """Determine user role based on email whitelist."""
    if email in settings.ADMIN_EMAILS:
        return "admin"
    return "regular"
