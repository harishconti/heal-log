import pytest
import pytest_asyncio
from httpx import AsyncClient
from tests.test_main import create_test_app
from app.schemas.user import User
from app.core.security import create_access_token
import uuid
from unittest.mock import patch, AsyncMock
from app.api.health import get_database

# Fixture for a test admin user
@pytest_asyncio.fixture
async def test_admin_user(db):
    user = User(
        id=str(uuid.uuid4()),
        email="monitoring.admin@example.com",
        full_name="Monitoring Admin",
        password_hash="hashed_password",
        plan="pro",
        role="admin"
    )
    await user.insert()
    return user

# Fixture for a test non-admin user
@pytest_asyncio.fixture
async def test_doctor_user(db):
    user = User(
        id=str(uuid.uuid4()),
        email="monitoring.doctor@example.com",
        full_name="Monitoring Doctor",
        password_hash="hashed_password",
        plan="basic",
        role="doctor"
    )
    await user.insert()
    return user

# Fixture for admin token
@pytest_asyncio.fixture
async def admin_token(test_admin_user):
    return create_access_token(
        subject=test_admin_user.id,
        plan=test_admin_user.plan,
        role=test_admin_user.role
    )

# Fixture for non-admin token
@pytest_asyncio.fixture
async def doctor_token(test_doctor_user):
    return create_access_token(
        subject=test_doctor_user.id,
        plan=test_doctor_user.plan,
        role=test_doctor_user.role
    )

# Async client fixture
@pytest_asyncio.fixture
async def async_client(limiter):
    app = create_test_app(limiter)

    # Override the database dependency
    mock_db = AsyncMock()
    mock_db.command.return_value = {"ok": 1}
    async def mock_get_database():
        return mock_db

    app.dependency_overrides[get_database] = mock_get_database

    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
@patch("app.api.health.FastAPICache")
async def test_health_check(mock_cache, async_client):
    # Mock Cache ping
    mock_cache.get_backend.return_value.ping = AsyncMock(return_value=True)

    response = await async_client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "details": {
            "api": "ok",
            "mongodb": "ok",
            "cache": "ok",
        },
    }
    # x-request-id is added by middleware
    assert "x-request-id" in response.headers

@pytest.mark.asyncio
async def test_get_metrics_as_admin(async_client, admin_token):
    response = await async_client.get(
        "/api/metrics",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "total_requests" in data
    assert "active_users" in data

@pytest.mark.asyncio
async def test_get_metrics_as_doctor(async_client, doctor_token):
    response = await async_client.get(
        "/api/metrics",
        headers={"Authorization": f"Bearer {doctor_token}"}
    )
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_get_metrics_unauthenticated(async_client):
    response = await async_client.get("/api/metrics")
    # HTTPBearer returns 403 when no credentials are provided
    assert response.status_code == 403

@pytest.mark.asyncio
@patch("app.api.health.FastAPICache")
async def test_request_id_middleware(mock_cache, async_client):
    # Mock Cache to ensure request succeeds
    mock_cache.get_backend.return_value.ping = AsyncMock(return_value=True)

    response = await async_client.get("/api/health")
    assert "x-request-id" in response.headers
    assert isinstance(uuid.UUID(response.headers["x-request-id"]), uuid.UUID)
