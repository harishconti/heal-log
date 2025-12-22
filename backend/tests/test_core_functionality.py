import pytest
from httpx import AsyncClient, ASGITransport
from app.schemas.user import User
from app.schemas.patient import Patient, PatientCreate
from app.core.security import create_access_token
from app.services.patient_service import patient_service
import uuid
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import timedelta, datetime, timezone

@pytest.mark.asyncio
async def test_expired_token_access(db, app):
    """
    Tests that a request with an expired token is rejected.
    """
    test_user = User(
        id=str(uuid.uuid4()),
        email="expired@example.com",
        full_name="Expired User",
        password_hash="hashed_password"
    )
    await test_user.insert()

    # Create a token that expires immediately
    token = create_access_token(
        subject=test_user.id,
        plan=test_user.plan,
        role=test_user.role,
        expires_delta=timedelta(minutes=-1)
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {token}"}
        )

    assert response.status_code == 401
    assert "Token has expired" in response.json()["detail"]

@pytest.mark.asyncio
async def test_create_duplicate_patient(db, app):
    """
    Tests that creating a patient with a duplicate name for the same user is rejected.
    """
    test_user = User(
        id=str(uuid.uuid4()),
        email="duplicate@example.com",
        full_name="Duplicate User",
        password_hash="hashed_password",
        role="doctor"  # Ensure the user has the 'doctor' role
    )
    await test_user.insert()

    token = create_access_token(
        subject=test_user.id,
        plan=test_user.plan,
        role=test_user.role
    )

    patient_data = PatientCreate(name="John Doe", patient_id=str(uuid.uuid4()))

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Create the first patient
        response1 = await ac.post(
            "/api/patients/",
            json=patient_data.model_dump(),
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response1.status_code == 201

        # Attempt to create the same patient again
        response2 = await ac.post(
            "/api/patients/",
            json=patient_data.model_dump(),
            headers={"Authorization": f"Bearer {token}"}
        )

    assert response2.status_code == 422
    assert "A patient with this name already exists" in response2.json()["detail"]

@pytest.mark.asyncio
async def test_database_error_handling(db, app):
    """
    Tests that a 500 error is returned when a database error occurs.
    """
    test_user = User(
        id=str(uuid.uuid4()),
        email="db_error@example.com",
        full_name="DB Error User",
        password_hash="hashed_password",
        role="doctor"
    )
    await test_user.insert()

    token = create_access_token(
        subject=test_user.id,
        plan=test_user.plan,
        role=test_user.role
    )

    patient_data = PatientCreate(name="Error Patient", patient_id=str(uuid.uuid4()))

    with patch("app.services.patient_service.Patient.insert", new_callable=AsyncMock) as mock_insert:
        mock_insert.side_effect = Exception("Simulated database error")

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.post(
                "/api/patients/",
                json=patient_data.model_dump(),
                headers={"Authorization": f"Bearer {token}"}
            )

    assert response.status_code == 500
    assert "An unexpected error occurred" in response.json()["detail"]

@pytest.mark.asyncio
async def test_update_patient(db, app):
    """
    Tests updating an existing patient's information.
    """
    test_user = User(
        id=str(uuid.uuid4()),
        email="update@example.com",
        full_name="Update User",
        password_hash="hashed_password",
        role="doctor"
    )
    await test_user.insert()

    token = create_access_token(
        subject=test_user.id,
        plan=test_user.plan,
        role=test_user.role
    )

    original_patient = await patient_service.create(
        obj_in=PatientCreate(name="Jane Doe", patient_id=str(uuid.uuid4())),
        user_id=test_user.id
    )

    updated_data = {"name": "Jane Smith"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.put(
            f"/api/patients/{original_patient.id}",
            json=updated_data,
            headers={"Authorization": f"Bearer {token}"}
        )

    assert response.status_code == 200
    updated_patient_response = response.json()
    assert updated_patient_response["name"] == "Jane Smith"

    db_patient = await Patient.get(original_patient.id)
    assert db_patient is not None
    assert db_patient.name == "Jane Smith"

@pytest.mark.asyncio
async def test_delete_patient(db, app):
    """
    Tests deleting an existing patient.
    """
    test_user = User(
        id=str(uuid.uuid4()),
        email="delete@example.com",
        full_name="Delete User",
        password_hash="hashed_password",
        role="doctor"
    )
    await test_user.insert()

    token = create_access_token(
        subject=test_user.id,
        plan=test_user.plan,
        role=test_user.role
    )

    patient_to_delete = await patient_service.create(
        obj_in=PatientCreate(name="John Delete", patient_id=str(uuid.uuid4())),
        user_id=test_user.id
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.delete(
            f"/api/patients/{patient_to_delete.id}",
            headers={"Authorization": f"Bearer {token}"}
        )

    assert response.status_code == 200
    assert response.json()["message"] == "Patient deleted successfully"

    db_patient = await Patient.get(patient_to_delete.id)
    assert db_patient is None

@pytest.mark.asyncio
async def test_sync_pull(db, app):
    """
    Tests the sync pull endpoint to ensure it returns new and updated records.
    """
    test_user = User(
        id=str(uuid.uuid4()),
        email="sync_pull@example.com",
        full_name="Sync Pull User",
        password_hash="hashed_password",
        role="doctor"
    )
    await test_user.insert()

    token = create_access_token(
        subject=test_user.id,
        plan=test_user.plan,
        role=test_user.role
    )

    new_patient = await patient_service.create(
        obj_in=PatientCreate(name="Sync Me", patient_id=str(uuid.uuid4())),
        user_id=test_user.id
    )
    new_patient.created_at = datetime.now(timezone.utc)
    new_patient.updated_at = datetime.now(timezone.utc)
    await new_patient.save()

    last_pulled_at = int((new_patient.created_at - timedelta(seconds=1)).timestamp() * 1000)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/sync/pull",
            json={"last_pulled_at": last_pulled_at},
            headers={"Authorization": f"Bearer {token}"}
        )

    assert response.status_code == 200
    data = response.json()
    assert "changes" in data
    assert "patients" in data["changes"]
    assert "created" in data["changes"]["patients"]
    pulled_patients = data["changes"]["patients"]["created"]
    assert len(pulled_patients) == 1
    assert pulled_patients[0]["id"] == str(new_patient.id)
    assert pulled_patients[0]["name"] == "Sync Me"

@pytest.mark.asyncio
@patch('app.services.feedback_service.settings')
@patch('app.services.feedback_service.FeedbackService.send_feedback_email', new_callable=AsyncMock)
async def test_full_feedback_flow(mock_send_email, mock_settings, db, app):
    """
    Integration test for the full feedback submission flow.
    - An authenticated user submits feedback.
    - Verify the feedback is stored in the database correctly.
    """
    # Configure settings to enable email sending logic path
    mock_settings.EMAIL_HOST = "smtp.example.com"
    mock_settings.EMAIL_TO = "support@example.com"
    mock_settings.STATIC_DIR = "/tmp/static"

    test_user = User(
        id=str(uuid.uuid4()),
        email="full_feedback@example.com",
        full_name="Full Feedback User",
        password_hash="hashed_password",
        role="doctor"
    )
    await test_user.insert()

    token = create_access_token(
        subject=test_user.id,
        plan=test_user.plan,
        role=test_user.role
    )

    feedback_data = {
        "feedback_type": "bug",
        "description": "This is a full flow integration test.",
        "device_info": {"os_version": "TestOS", "app_version": "1.0-test", "device_model": "Test Device"}
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/feedback/submit",
            json=feedback_data,
            headers={"Authorization": f"Bearer {token}"}
        )

    assert response.status_code == 200

    # Verify the feedback is in the database using BetaFeedback model
    from app.schemas.beta_feedback import BetaFeedback
    feedback_in_db = await BetaFeedback.find_one(
        BetaFeedback.description == feedback_data["description"]
    )
    assert feedback_in_db is not None
    assert feedback_in_db.feedback_type == "bug"
