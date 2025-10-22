import pytest
from httpx import AsyncClient
from main import app
from app.schemas.user import User
from app.core.hashing import get_password_hash
from app.core.security import create_refresh_token
import uuid

@pytest.mark.asyncio
async def test_refresh_token_returns_new_refresh_token(db):
    # Create a test user directly in the database
    test_user = User(
        id=str(uuid.uuid4()),
        email="test_refresh@example.com",
        full_name="Test Refresh User",
        password_hash=get_password_hash("password123")
    )
    await test_user.insert()

    # Create a refresh token for the user
    old_refresh_token = create_refresh_token(subject=test_user.id)

    from httpx import ASGITransport
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
