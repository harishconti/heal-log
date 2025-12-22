import pytest
from httpx import AsyncClient, ASGITransport
from app.schemas.user import User
from app.core.hashing import get_password_hash
from app.core.security import create_refresh_token
import uuid

@pytest.mark.asyncio
async def test_refresh_token_returns_new_refresh_token(db, app):
    # Create a test user directly in the database
    test_user = User(
        id=str(uuid.uuid4()),
        email="test_refresh@example.com",
        full_name="Test Refresh User",
        password_hash=get_password_hash("password123")
    )
    await test_user.insert()

    # Create a refresh token for the user
    old_refresh_token = create_refresh_token(subject=str(test_user.id))

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/auth/refresh",
            json={"refresh_token": old_refresh_token}
        )

    assert response.status_code == 200
    new_tokens = response.json()
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens
    assert new_tokens["refresh_token"] != old_refresh_token

@pytest.mark.asyncio
async def test_register_duplicate_email_returns_409(db, app):
    """
    Tests that registering with an existing email returns 409 Conflict.
    """
    # Create a test user directly in the database
    test_user = User(
        id=str(uuid.uuid4()),
        email="existing@example.com",
        full_name="Existing User",
        password_hash=get_password_hash("password123")
    )
    await test_user.insert()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/auth/register",
            json={
                "email": "existing@example.com",
                "password": "NewPassword123!",
                "full_name": "Duplicate User"
            }
        )

    assert response.status_code == 409
    assert "already exists" in response.json()["error"]["message"]
