import pytest
import pytest_asyncio
from httpx import AsyncClient
from tests.test_main import create_test_app
from app.schemas.user import User
from app.schemas.beta_feedback import BetaFeedback, DeviceInfo
from app.core.security import create_access_token
import uuid
from unittest.mock import patch, AsyncMock
from app.api import beta

# Use consistent async fixtures
@pytest_asyncio.fixture
async def beta_tester(db):
    user = User(
        id=str(uuid.uuid4()),
        email="beta@example.com",
        full_name="Beta User",
        password_hash="hashed_password",
        plan="basic",
        role="doctor",
        is_beta_tester=True
    )
    await user.insert()
    return user

@pytest_asyncio.fixture
async def beta_token(beta_tester):
    return create_access_token(
        subject=beta_tester.id,
        plan=beta_tester.plan,
        role=beta_tester.role
    )

@pytest_asyncio.fixture
async def regular_user(db):
    user = User(
        id=str(uuid.uuid4()),
        email="regular@example.com",
        full_name="Regular User",
        password_hash="hashed_password",
        plan="basic",
        role="doctor",
        is_beta_tester=False
    )
    await user.insert()
    return user

@pytest_asyncio.fixture
async def regular_token(regular_user):
    return create_access_token(
        subject=regular_user.id,
        plan=regular_user.plan,
        role=regular_user.role
    )

@pytest_asyncio.fixture
async def async_client(limiter):
    app = create_test_app(limiter)
    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_get_known_issues_authenticated_beta(async_client, beta_token):
    response = await async_client.get(
        "/api/beta/known-issues",
        headers={"Authorization": f"Bearer {beta_token}"}
    )
    assert response.status_code == 200
    issues = response.json()
    assert isinstance(issues, list)
    assert len(issues) > 0
    issue = issues[0]
    assert "id" in issue
    assert "title" in issue
    assert "description" in issue

@pytest.mark.asyncio
async def test_get_known_issues_authenticated_non_beta(async_client, regular_token):
    response = await async_client.get(
        "/api/beta/known-issues",
        headers={"Authorization": f"Bearer {regular_token}"}
    )
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_get_known_issues_unauthenticated(async_client):
    response = await async_client.get("/api/beta/known-issues")
    assert response.status_code == 401
