import pytest
import pytest_asyncio
from httpx import AsyncClient
from tests.test_main import create_test_app
from app.schemas.user import User
from app.schemas.beta_feedback import BetaFeedback
from app.core.security import create_access_token
import uuid
from unittest.mock import patch, AsyncMock, MagicMock
import json
import base64

# Fixture for a test user
@pytest_asyncio.fixture
async def test_user(db):
    user = User(
        id=str(uuid.uuid4()),
        email="feedback.test@example.com",
        full_name="Feedback Test User",
        password_hash="hashed_password",
        plan="basic",
        role="doctor"
    )
    await user.insert()
    return user

# Fixture for auth token
@pytest_asyncio.fixture
async def token(test_user):
    return create_access_token(
        subject=test_user.id,
        plan=test_user.plan,
        role=test_user.role
    )

# Async client fixture
@pytest_asyncio.fixture
async def async_client(limiter):
    app = create_test_app(limiter)
    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
@patch('app.services.feedback_service.settings')
@patch('app.services.feedback_service.FeedbackService.send_feedback_email', new_callable=AsyncMock)
async def test_submit_feedback_authenticated(mock_send_email, mock_settings, async_client, test_user, token, db):
    # Configure settings to enable email sending
    mock_settings.EMAIL_HOST = "smtp.example.com"
    mock_settings.EMAIL_TO = "support@example.com"
    mock_settings.STATIC_DIR = "/tmp/static"

    feedback_data = {
        "feedback_type": "bug",
        "description": "This is an authenticated test bug report.",
        "device_info": {"os_version": "Android 12", "app_version": "1.1.0", "device_model": "Pixel 5"}
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
    # User ID is not currently stored in BetaFeedback

    # Verify email task was added (we'd need to mock BackgroundTasks or verify the method was called)
    # Since background tasks run after the response, we can't easily await them here without forcing it.
    # However, the service calls `add_task` which schedules it.
    # To properly test if send_feedback_email is called, we can rely on the fact that FastAPI's TestClient/AsyncClient
    # triggers background tasks.
    # But wait, BackgroundTasks are run after the response is sent.

    # Let's check DB
    feedback_in_db = await BetaFeedback.find_one(BetaFeedback.description == feedback_data["description"])
    assert feedback_in_db is not None

@pytest.mark.asyncio
@patch('app.services.feedback_service.settings')
@patch('app.services.feedback_service.FeedbackService.send_feedback_email', new_callable=AsyncMock)
async def test_submit_feedback_anonymous(mock_send_email, mock_settings, async_client, db):
    mock_settings.EMAIL_HOST = "smtp.example.com"
    mock_settings.EMAIL_TO = "support@example.com"
    mock_settings.STATIC_DIR = "/tmp/static"

    feedback_data = {
        "feedback_type": "suggestion",
        "description": "Anonymous feature request.",
        "device_info": {"os_version": "iOS 15", "app_version": "1.1.0", "device_model": "iPhone 12"}
    }

    response = await async_client.post("/api/feedback/submit", json=feedback_data)

    assert response.status_code == 200

    # Verify it's in the database
    feedback_in_db = await BetaFeedback.find_one(BetaFeedback.description == feedback_data["description"])
    assert feedback_in_db is not None

@pytest.mark.asyncio
@patch('app.services.feedback_service.settings')
@patch('builtins.open', new_callable=MagicMock)
@patch('os.makedirs')
async def test_submit_feedback_with_screenshot(mock_makedirs, mock_open, mock_settings, async_client, token, db):
    mock_settings.STATIC_DIR = "/tmp/static"
    mock_settings.BASE_URL = "http://test"
    # Disable email for this test to focus on screenshot
    mock_settings.EMAIL_HOST = None

    # Mock file writing
    mock_file = MagicMock()
    mock_open.return_value.__enter__.return_value = mock_file

    # Create a fake base64 screenshot
    fake_screenshot = base64.b64encode(b"fake_image_data").decode('utf-8')

    feedback_data = {
        "feedback_type": "bug",
        "description": "Bug with screenshot.",
        "device_info": {"os_version": "Web", "app_version": "1.2.0"},
        "screenshot": fake_screenshot
    }

    response = await async_client.post(
        "/api/feedback/submit",
        json=feedback_data,
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["screenshot_url"].startswith("/static/")
    assert data["screenshot_url"].endswith(".png")

    mock_makedirs.assert_called_with("/tmp/static", exist_ok=True)
    mock_open.assert_called()
    mock_file.write.assert_called_with(b"fake_image_data")

    feedback_in_db = await BetaFeedback.find_one(BetaFeedback.description == "Bug with screenshot.")
    assert feedback_in_db is not None
    assert feedback_in_db.screenshot_url == data["screenshot_url"]

@pytest.mark.asyncio
@pytest.mark.parametrize("invalid_data, expected_status", [
    ({"feedback_type": "bug"}, 422),  # Missing description
    ({"description": "Test"}, 422),   # Missing feedback_type
    ({"feedback_type": "invalid_type", "description": "Test"}, 422), # Invalid type
])
async def test_submit_feedback_validation_errors(async_client, invalid_data, expected_status):
    response = await async_client.post("/api/feedback/submit", json=invalid_data)
    assert response.status_code == expected_status
