import pytest
from httpx import AsyncClient
from main import app
from app.schemas.user import User
from app.schemas.role import UserRole
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

@pytest.mark.asyncio
async def test_read_users_forbidden_for_non_admin(db):
    # Create a non-admin test user
    test_user = User(
        id=str(uuid.uuid4()),
        email="nonadmin@example.com",
        full_name="Non-Admin User",
        password_hash="hashed_password",
        role=UserRole.PATIENT  # Explicitly set a non-admin role
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
            "/api/users/",
            headers={"Authorization": f"Bearer {token}"}
        )

    assert response.status_code == 403

@pytest.mark.asyncio
async def test_read_users_success_for_admin(db):
    # Create an admin test user
    admin_user = User(
        id=str(uuid.uuid4()),
        email="admin@example.com",
        full_name="Admin User",
        password_hash="hashed_password",
        role=UserRole.ADMIN  # Explicitly set the admin role
    )
    await admin_user.insert()

    # Create another user to be in the list
    other_user = User(
        id=str(uuid.uuid4()),
        email="other@example.com",
        full_name="Other User",
        password_hash="hashed_password"
    )
    await other_user.insert()

    token = create_access_token(
        subject=admin_user.id,
        plan=admin_user.plan,
        role=admin_user.role
    )

    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get(
            "/api/users/",
            headers={"Authorization": f"Bearer {token}"}
        )

    assert response.status_code == 200
    user_list = response.json()
    assert isinstance(user_list, list)
    assert len(user_list) >= 2  # At least the admin and the other user

    # Check if the emails of our test users are in the response
    emails_in_response = [user['email'] for user in user_list]
    assert admin_user.email in emails_in_response
    assert other_user.email in emails_in_response
