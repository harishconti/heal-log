import pytest
from httpx import AsyncClient
from tests.test_main import create_test_app
from app.schemas.user import User
from app.schemas.feedback import Feedback
from app.core.security import create_access_token
import uuid
from unittest.mock import patch, AsyncMock
import json

# Fixture for a test user
@pytest.fixture
async def test_user(db):
    user = User(
        id=str(uuid.uuid4()),
        email="feedback.test@example.com",
        full_name="Feedback Test User",
        password_hash="hashed_password",
        plan="BASIC",
        role="DOCTOR"
    )
    await user.insert()
    return user

# Fixture for auth token
@pytest.fixture
def token(test_user):
    return create_access_token(
        subject=test_user.id,
        plan=test_user.plan,
        role=test_user.role
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
@patch('app.services.feedback_service.FeedbackService.send_feedback_email', new_callable=AsyncMock)
async def test_submit_feedback_authenticated(mock_send_email, async_client, test_user, token, db):
    feedback_data = {
        "feedback_type": "bug",
        "description": "This is an authenticated test bug report.",
        "device_info": {"os": "Android 12", "appVersion": "1.1.0"}
    }

    response = await async_client.post(
        "/api/feedback/submit",
        json=feedback_data,
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["feedback_type"] == feedback_data["feedback_type"]
    assert data["description"] == feedback_data["description"]
    assert data["user_id"] == test_user.id

    mock_send_email.assert_awaited_once()

    # Verify it's in the database
    feedback_in_db = await Feedback.find_one(Feedback.description == feedback_data["description"])
    assert feedback_in_db is not None
    assert feedback_in_db.user_id == test_user.id

@pytest.mark.asyncio
@patch('app.services.feedback_service.FeedbackService.send_feedback_email', new_callable=AsyncMock)
async def test_submit_feedback_anonymous(mock_send_email, async_client, db):
    feedback_data = {
        "feedback_type": "suggestion",
        "description": "Anonymous feature request.",
        "device_info": {"os": "iOS 15", "appVersion": "1.1.0"}
    }

    response = await async_client.post("/api/feedback/submit", json=feedback_data)

    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] is None
    mock_send_email.assert_awaited_once()

    # Verify it's in the database
    feedback_in_db = await Feedback.find_one(Feedback.description == feedback_data["description"])
    assert feedback_in_db is not None
    assert feedback_in_db.user_id is None

@pytest.mark.asyncio
@patch('app.services.feedback_service.upload_screenshot', new_callable=AsyncMock)
@patch('app.services.feedback_service.FeedbackService.send_feedback_email', new_callable=AsyncMock)
async def test_submit_feedback_with_screenshot(mock_send_email, mock_upload, async_client, token, db):
    mock_upload.return_value = "http://storage.example.com/screenshot.jpg"

    form_data = {
        "feedback_data": json.dumps({
            "feedback_type": "bug",
            "description": "Bug with screenshot.",
            "device_info": {"os": "Web", "appVersion": "1.2.0"}
        })
    }
    files = {"screenshot": ("test.jpg", b"fakeimagedata", "image/jpeg")}

    response = await async_client.post(
        "/api/feedback/submit",
        data=form_data,
        files=files,
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["screenshot_url"] == "http://storage.example.com/screenshot.jpg"
    mock_upload.assert_awaited_once()
    mock_send_email.assert_awaited_once()

    feedback_in_db = await Feedback.find_one(Feedback.description == "Bug with screenshot.")
    assert feedback_in_db is not None
    assert feedback_in_db.screenshot_url == "http://storage.example.com/screenshot.jpg"


@pytest.mark.asyncio
@pytest.mark.parametrize("invalid_data, expected_status", [
    ({"feedback_type": "bug"}, 422),  # Missing description
    ({"description": "Test"}, 422),   # Missing feedback_type
    ({"feedback_type": "invalid_type", "description": "Test"}, 422), # Invalid type
])
async def test_submit_feedback_validation_errors(async_client, invalid_data, expected_status):
    response = await async_client.post("/api/feedback/submit", json=invalid_data)
    assert response.status_code == expected_status
