"""JWT verification for Supabase authentication."""
import jwt
from fastapi import HTTPException, status
from datetime import datetime
from src.config.settings import settings
from src.utils.logger import logger


import httpx

def verify_jwt_token(token: str) -> dict:
    """
    Verify Supabase JWT token by calling the Supabase auth API.
    Returns payload with user info.
    """
    try:
        # Use httpx to call the Supabase Auth server to validate the token
        url = f"{settings.SUPABASE_URL}/auth/v1/user"
        headers = {
            "Authorization": f"Bearer {token}",
            "apikey": settings.SUPABASE_ANON_KEY,
        }
        
        # We can use a synchronous httpx client here (since verify_jwt_token is sync)
        with httpx.Client(timeout=5.0) as client:
            response = client.get(url, headers=headers)
            
        if response.status_code != 200:
            logger.warning(f"Supabase auth failed: {response.text}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
            
        user_data = response.json()
        
        # Format the response to match what the app expects from the decoded payload
        return {
            "sub": user_data.get("id"),
            "email": user_data.get("email"),
            "role": user_data.get("role", "authenticated"),
        }

    except HTTPException:
        raise
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
