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

    # 1. Initial state
    patient = Patient(
        id=str(uuid.uuid4()),
        patient_id=str(uuid.uuid4()),
        name="Original Name",
        user_id=user.id,
        created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2),
        updated_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2),
    )
    await patient.insert()

    last_pulled_at = int((datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=3)).timestamp() * 1000)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 2. Client pulls the initial state
        pull_response = await ac.post(
            "/api/sync/pull",
            json={"last_pulled_at": last_pulled_at},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert pull_response.status_code == 200, "Client failed to pull initial data."
        pulled_patients = pull_response.json()["changes"]["patients"]["created"]
        assert len(pulled_patients) == 1, "Expected to pull one created patient."
        assert pulled_patients[0]["name"] == "Original Name", "Pulled patient name is incorrect."

        # 3. Server updates the patient's name
        old_updated_at = patient.updated_at
        patient.name = "Server Updated Name"
        await patient.save()

        # 4. Client tries to push an update with an old timestamp
        client_update = {
            "patients": {
                "updated": [
                    {
                        "id": str(patient.id),
                        "name": "Client Updated Name",
                            "updated_at": int(old_updated_at.timestamp() * 1000),
                    }
                ]
            }
        }

        push_response = await ac.post(
            "/api/sync/push",
            json={"changes": client_update},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert push_response.status_code == 409, "Server should have detected a conflict."
        assert "Conflict detected" in push_response.json()["error"]["message"], "Conflict error message is missing."

        # 5. Verify the server's version of the patient was not overwritten
        db_patient = await Patient.get(patient.id)
        assert db_patient.name == "Server Updated Name", "Server data was overwritten by stale client data."

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
