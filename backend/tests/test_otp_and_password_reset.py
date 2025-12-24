"""
Tests for OTP Verification and Password Reset functionality.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.schemas.user import User
from app.core.hashing import get_password_hash
from app.core.security import create_access_token
import uuid
from unittest.mock import patch, AsyncMock
from datetime import datetime, timezone, timedelta


@pytest.mark.asyncio
async def test_register_sends_otp(db, app):
    """
    Tests that registration sends OTP and doesn't return tokens.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "Test123!@#",
                "full_name": "New User"
            }
        )
    
    assert response.status_code == 201
    data = response.json()
    assert data["success"] == True
    assert data["requires_verification"] == True
    assert "access_token" not in data  # No token until verified
    
    # Verify user was created with OTP
    user = await User.find_one({"email": "newuser@example.com"})
    assert user is not None
    assert user.is_verified == False
    assert user.otp_code is not None
    assert user.otp_expires_at is not None


@pytest.mark.asyncio
async def test_unverified_user_cannot_login(db, app):
    """
    Tests that unverified users cannot login.
    """
    # Create unverified user
    test_user = User(
        id=str(uuid.uuid4()),
        email="unverified@example.com",
        full_name="Unverified User",
        password_hash=get_password_hash("password123"),
        is_verified=False
    )
    await test_user.insert()
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/auth/login",
            data={
                "username": "unverified@example.com",
                "password": "password123"
            }
        )
    
    assert response.status_code == 403
    assert "not verified" in response.json()["error"]["message"].lower()


@pytest.mark.asyncio
async def test_verified_user_can_login(db, app):
    """
    Tests that verified users can login successfully.
    """
    # Create verified user
    test_user = User(
        id=str(uuid.uuid4()),
        email="verified@example.com",
        full_name="Verified User",
        password_hash=get_password_hash("password123"),
        is_verified=True
    )
    await test_user.insert()
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/auth/login",
            data={
                "username": "verified@example.com",
                "password": "password123"
            }
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "access_token" in data


@pytest.mark.asyncio
async def test_verify_otp_success(db, app):
    """
    Tests that correct OTP verification works.
    """
    # Create user with OTP
    test_user = User(
        id=str(uuid.uuid4()),
        email="otptest@example.com",
        full_name="OTP Test User",
        password_hash=get_password_hash("password123"),
        is_verified=False,
        otp_code="12345678",
        otp_expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
        otp_attempts=0
    )
    await test_user.insert()
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/auth/verify-otp",
            json={
                "email": "otptest@example.com",
                "otp_code": "12345678"
            }
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "access_token" in data
    
    # Verify user is now verified
    user = await User.find_one({"email": "otptest@example.com"})
    assert user.is_verified == True
    assert user.otp_code is None


@pytest.mark.asyncio
async def test_verify_otp_wrong_code(db, app):
    """
    Tests that wrong OTP is rejected.
    """
    test_user = User(
        id=str(uuid.uuid4()),
        email="wrongotp@example.com",
        full_name="Wrong OTP User",
        password_hash=get_password_hash("password123"),
        is_verified=False,
        otp_code="12345678",
        otp_expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
        otp_attempts=0
    )
    await test_user.insert()
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/auth/verify-otp",
            json={
                "email": "wrongotp@example.com",
                "otp_code": "87654321"  # Wrong code
            }
        )
    
    assert response.status_code == 400
    assert "invalid" in response.json()["error"]["message"].lower()


@pytest.mark.asyncio
async def test_verify_otp_expired(db, app):
    """
    Tests that expired OTP is rejected.
    """
    test_user = User(
        id=str(uuid.uuid4()),
        email="expiredotp@example.com",
        full_name="Expired OTP User",
        password_hash=get_password_hash("password123"),
        is_verified=False,
        otp_code="12345678",
        otp_expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),  # Expired
        otp_attempts=0
    )
    await test_user.insert()
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/auth/verify-otp",
            json={
                "email": "expiredotp@example.com",
                "otp_code": "12345678"
            }
        )
    
    assert response.status_code == 400
    assert "expired" in response.json()["error"]["message"].lower()


@pytest.mark.asyncio
async def test_forgot_password_sends_email(db, app):
    """
    Tests that forgot password creates a reset token.
    """
    test_user = User(
        id=str(uuid.uuid4()),
        email="forgotpw@example.com",
        full_name="Forgot Password User",
        password_hash=get_password_hash("password123"),
        is_verified=True
    )
    await test_user.insert()
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/auth/forgot-password",
            json={"email": "forgotpw@example.com"}
        )
    
    assert response.status_code == 200
    
    # Verify token was created
    user = await User.find_one({"email": "forgotpw@example.com"})
    assert user.password_reset_token is not None
    assert user.password_reset_expires_at is not None


@pytest.mark.asyncio
async def test_reset_password_success(db, app):
    """
    Tests that password reset with valid token works.
    """
    reset_token = "valid_reset_token_123"
    test_user = User(
        id=str(uuid.uuid4()),
        email="resetpw@example.com",
        full_name="Reset Password User",
        password_hash=get_password_hash("oldpassword"),
        is_verified=True,
        password_reset_token=reset_token,
        password_reset_expires_at=datetime.now(timezone.utc) + timedelta(hours=1)
    )
    await test_user.insert()
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/auth/reset-password",
            json={
                "token": reset_token,
                "new_password": "NewPassword123!"
            }
        )
    
    assert response.status_code == 200
    assert "successfully" in response.json()["message"].lower()
    
    # Verify password was changed
    user = await User.find_one({"email": "resetpw@example.com"})
    assert user.password_reset_token is None  # Token cleared
    
    # Try logging in with new password
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login_response = await ac.post(
            "/api/auth/login",
            data={
                "username": "resetpw@example.com",
                "password": "NewPassword123!"
            }
        )
    assert login_response.status_code == 200


@pytest.mark.asyncio
async def test_reset_password_invalid_token(db, app):
    """
    Tests that invalid reset token is rejected.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/auth/reset-password",
            json={
                "token": "invalid_token",
                "new_password": "NewPassword123!"
            }
        )
    
    assert response.status_code == 400
    assert "invalid" in response.json()["error"]["message"].lower()
