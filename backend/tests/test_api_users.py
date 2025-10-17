import pytest
from httpx import AsyncClient
from main import app
from app.schemas.user import User
from app.core.security import create_access_token
import uuid

@pytest.mark.asyncio
async def test_read_users_me(db):
    test_user = User(
        id=str(uuid.uuid4()),
        email="test@example.com",
        full_name="Test User",
        password_hash="hashed_password"
    )
    await test_user.insert()

    token = create_access_token(
        subject=test_user.id,
        plan=test_user.plan,
        role=test_user.role
    )

    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {token}"}
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["user"]["email"] == test_user.email
    assert data["user"]["full_name"] == test_user.full_name