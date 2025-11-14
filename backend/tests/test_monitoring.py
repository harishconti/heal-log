import pytest
from httpx import AsyncClient
from tests.test_main import create_test_app
from app.schemas.user import User
from app.core.security import create_access_token
import uuid

# Fixture for a test admin user
@pytest.fixture
async def test_admin_user(db):
    user = User(
        id=str(uuid.uuid4()),
        email="monitoring.admin@example.com",
        full_name="Monitoring Admin",
        password_hash="hashed_password",
        plan="PRO",
        role="ADMIN"
    )
    await user.insert()
    return user

# Fixture for a test non-admin user
@pytest.fixture
async def test_doctor_user(db):
    user = User(
        id=str(uuid.uuid4()),
        email="monitoring.doctor@example.com",
        full_name="Monitoring Doctor",
        password_hash="hashed_password",
        plan="BASIC",
        role="DOCTOR"
    )
    await user.insert()
    return user

# Fixture for admin token
@pytest.fixture
def admin_token(test_admin_user):
    return create_access_token(
        subject=test_admin_user.id,
        plan=test_admin_user.plan,
        role=test_admin_user.role
    )

# Fixture for non-admin token
@pytest.fixture
def doctor_token(test_doctor_user):
    return create_access_token(
        subject=test_doctor_user.id,
        plan=test_doctor_user.plan,
        role=test_doctor_user.role
    )

# Async client fixture
@pytest.fixture
async def async_client(limiter):
    app = create_test_app(limiter)
    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_health_check(async_client):
    response = await async_client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
    assert "x-request-id" in response.headers

@pytest.mark.asyncio
async def test_get_metrics_as_admin(async_client, admin_token):
    response = await async_client.get(
        "/api/metrics",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert "application_info" in response.json()

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
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_request_id_middleware(async_client):
    response = await async_client.get("/api/health")
    assert "x-request-id" in response.headers
    assert isinstance(uuid.UUID(response.headers["x-request-id"]), uuid.UUID)
