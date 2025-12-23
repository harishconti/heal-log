import pytest
from httpx import AsyncClient, ASGITransport
import uuid
from app.schemas.user import User, UserPlan
from app.schemas.role import UserRole
from app.core.security import create_access_token
from app.services.patient_service import patient_service
from app.schemas.patient import PatientCreate
from app.schemas.telemetry import TelemetryEvent

@pytest.mark.asyncio
async def test_analytics_health(db, app):
    """
    Tests the analytics health endpoint.
    """
    test_user = User(
        id=str(uuid.uuid4()),
        email="analytics_health@example.com",
        full_name="Analytics User",
        password_hash="hashed_password",
        role=UserRole.ADMIN
    )
    await test_user.insert()

    token = create_access_token(
        subject=test_user.id,
        plan=test_user.plan,
        role=test_user.role
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get(
            "/api/analytics/health",
            headers={"Authorization": f"Bearer {token}"}
        )
    if response.status_code != 200:
        print(f"FAILED Response Body: {response.json()}")

    assert response.status_code == 200
    assert "active_users" in response.json()


@pytest.mark.asyncio
async def test_health_check(app):
    """
    Tests the main health check endpoint.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

@pytest.mark.asyncio
async def test_api_root(app):
    """
    Tests the API root endpoint.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api")

    assert response.status_code == 200
    assert "Welcome" in response.json()["message"]

@pytest.mark.asyncio
async def test_version_endpoint(app):
    """
    Tests the version endpoint.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/version")

    assert response.status_code == 200
    assert "version" in response.json()

@pytest.mark.asyncio
async def test_metrics_endpoint_unauthorized(app):
    """
    Tests that the metrics endpoint is protected.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/metrics")

    # Expect 403 Forbidden as it requires auth/permissions
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_documents_endpoints(db, app):
    """
    Tests basic document endpoints.
    """
    test_user = User(
        id=str(uuid.uuid4()),
        email="docs@example.com",
        full_name="Docs User",
        password_hash="hashed_password",
        role="doctor",
        plan=UserPlan.PRO
    )
    await test_user.insert()

    token = create_access_token(
        subject=test_user.id,
        plan=test_user.plan,
        role=test_user.role
    )

    # Need to create a patient first
    patient = await patient_service.create(
        obj_in=PatientCreate(name="Doc Patient", patient_id=str(uuid.uuid4())),
        user_id=test_user.id
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Test GET documents for patient
        response = await ac.get(
            f"/api/documents/{patient.id}",
            headers={"Authorization": f"Bearer {token}"}
        )

    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_telemetry_endpoint(db, app):
    """
    Tests telemetry submission.
    """
    test_user = User(
        id=str(uuid.uuid4()),
        email="telemetry@example.com",
        full_name="Telemetry User",
        password_hash="hashed_password",
        role="doctor"
    )
    await test_user.insert()

    token = create_access_token(
        subject=test_user.id,
        plan=test_user.plan,
        role=test_user.role
    )

    # TelemetryEvent requires event_type and payload
    telemetry_data = {
        "event_type": "app_open",
        "payload": {
             "client_timestamp": "2023-10-27T10:00:00Z",
             "metadata": {"device": "android"}
        }
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/telemetry/",
            json=telemetry_data,
            headers={"Authorization": f"Bearer {token}"}
        )
    if response.status_code != 201:
        print(f"FAILED Telemetry Response Body: {response.json()}")

    assert response.status_code == 201
    assert response.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_webhooks_endpoint(app):
    """
    Tests webhooks endpoint (e.g., Stripe).
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/webhooks/stripe",
            json={"type": "test_event"}
        )

    assert response.status_code == 200
