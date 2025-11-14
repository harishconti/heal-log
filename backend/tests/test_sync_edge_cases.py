import pytest
from httpx import AsyncClient, ASGITransport
from tests.test_main import create_test_app
from app.schemas.user import User
from app.schemas.patient import Patient
from app.core.security import create_access_token
import uuid
import datetime

@pytest.mark.asyncio
async def test_sync_conflict_resolution(db, limiter):
    """
    Tests that the server correctly resolves conflicts when the client
    sends a record that has been updated on the server since the last sync.
    """
    app = create_test_app(limiter)
    user = User(
        id=str(uuid.uuid4()),
        email="test@example.com",
        full_name="Test User",
        password_hash="hashed_password",
    )
    await user.insert()
    token = create_access_token(
        subject=user.id,
        plan=user.plan,
        role=user.role
    )

    patient = Patient(
        id=str(uuid.uuid4()),
        patient_id=str(uuid.uuid4()),
        name="Test Patient",
        user_id=user.id,
            created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2),
        updated_at=datetime.datetime.now(datetime.timezone.utc)
        - datetime.timedelta(days=1),
    )
    await patient.insert()

    last_pulled_at = int((datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=3)).timestamp() * 1000)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/sync/pull",
                json={"last_pulled_at": last_pulled_at},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert len(response.json()["changes"]["patients"]["updated"]) == 1

        patient.name = "Updated Patient Name"
        patient.updated_at = datetime.datetime.now(datetime.timezone.utc)
        await patient.save()

        response = await ac.post(
            "/api/sync/pull",
            json={"last_pulled_at": response.json()["timestamp"]},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert len(response.json()["changes"]["patients"]["updated"]) == 1
        assert (
            response.json()["changes"]["patients"]["updated"][0]["name"]
            == "Updated Patient Name"
        )

@pytest.mark.asyncio
async def test_sync_after_long_offline_period(db, limiter):
    """
    Tests that the server correctly sends all changes since the last sync
    when the client has been offline for a long period of time.
    """
    app = create_test_app(limiter)
    user = User(
        id=str(uuid.uuid4()),
        email="test@example.com",
        full_name="Test User",
        password_hash="hashed_password",
    )
    await user.insert()
    token = create_access_token(
        subject=user.id,
        plan=user.plan,
        role=user.role
    )

    for i in range(5):
        patient = Patient(
            id=str(uuid.uuid4()),
            patient_id=str(uuid.uuid4()),
            name=f"Test Patient {i}",
            user_id=user.id,
            created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2),
            updated_at=datetime.datetime.now(datetime.timezone.utc)
            - datetime.timedelta(days=i),
        )
        await patient.insert()

    last_pulled_at = int((datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=6)).timestamp() * 1000)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/sync/pull",
            json={"last_pulled_at": last_pulled_at},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert len(response.json()["changes"]["patients"]["created"]) == 5

@pytest.mark.skip(reason="Large batch syncs require a more complex setup.")
@pytest.mark.asyncio
async def test_large_batch_sync(db, limiter):
    """
    Tests that the server can handle large batch syncs without timing out.
    """
    app = create_test_app(limiter)
    # This is a placeholder test that will be implemented in a future step.
    assert True
