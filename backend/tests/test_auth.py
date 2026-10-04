import pytest
import jwt
import time
from fastapi import HTTPException
from unittest.mock import patch, MagicMock
from src.auth.jwt import verify_jwt_token, get_user_role
from src.config.settings import settings

def test_verify_jwt_token_valid():
    # Create a valid token
    payload = {
        "sub": "user_123",
        "email": "test@example.com",
        "exp": int(time.time()) + 3600,
        "aud": "authenticated"
    }
    
    token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    
    # Verify token
    decoded = verify_jwt_token(token)
    assert decoded["sub"] == "user_123"
    assert decoded["email"] == "test@example.com"

def test_verify_jwt_token_expired():
    # Create an expired token
    payload = {
        "sub": "user_123",
        "email": "test@example.com",
        "exp": int(time.time()) - 3600,
        "aud": "authenticated"
    }
    
    token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    
    # Verification should raise 401
    with pytest.raises(HTTPException) as exc_info:
        verify_jwt_token(token)
    
    assert exc_info.value.status_code == 401
    assert "expired" in exc_info.value.detail.lower()

def test_verify_jwt_token_invalid():
    # Verification should raise 401 for random string
    with pytest.raises(HTTPException) as exc_info:
        verify_jwt_token("invalid.token.string")
        
    assert exc_info.value.status_code == 401
    assert "invalid" in exc_info.value.detail.lower()

def test_get_user_role():
    # Test regular user
    role = get_user_role("user@example.com")
    assert role == "regular"
    
    # Test admin user
    if len(settings.ADMIN_EMAILS) > 0:
        admin_email = settings.ADMIN_EMAILS[0]
        role = get_user_role(admin_email)
        assert role == "admin"
