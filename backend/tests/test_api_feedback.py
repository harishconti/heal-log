import pytest
from httpx import AsyncClient
from tests.test_main import create_test_app
from app.schemas.user import User
from app.core.security import create_access_token
import uuid
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
@patch('app.services.feedback_service.FeedbackService.send_feedback_email', new_callable=AsyncMock)
async def test_submit_feedback_authenticated(mock_send_email, db, limiter):
    app = create_test_app(limiter)
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

    feedback_data = {
        "feedback_type": "bug",
        "description": "This is a test bug report.",
        "device_info": {"os_version": "Android 12", "app_version": "1.0.0", "device_model": "Pixel 6"}
    }

    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
                "/api/feedback/submit",
            json=feedback_data,
            headers={"Authorization": f"Bearer {token}"}
        )

    assert response.status_code == 200
    data = response.json()
    assert data["feedback_type"] == feedback_data["feedback_type"]
    assert data["description"] == feedback_data["description"]
    assert data["device_info"] == feedback_data["device_info"]

@pytest.mark.asyncio
@patch('app.services.feedback_service.FeedbackService.send_feedback_email', new_callable=AsyncMock)
async def test_submit_feedback_anonymous(mock_send_email, db, limiter):
    app = create_test_app(limiter)
    feedback_data = {
        "feedback_type": "suggestion",
        "description": "This is a test feature request.",
        "device_info": {"os_version": "iOS 15", "app_version": "1.0.0", "device_model": "iPhone 13"}
    }

    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/feedback/submit", json=feedback_data)

    assert response.status_code == 200
    data = response.json()
    assert data["feedback_type"] == feedback_data["feedback_type"]
    assert data["description"] == feedback_data["description"]


@pytest.mark.asyncio
@patch('app.services.feedback_service.FeedbackService.send_feedback_email', new_callable=AsyncMock)
async def test_submit_feedback_rate_limit(mock_send_email, db, limiter):
    app = create_test_app(limiter)
    base_feedback_data = {
        "feedback_type": "general",
        "description": "This is a test idea.",
        "device_info": {"os_version": "Android 12", "app_version": "1.0.0", "device_model": "Pixel 6"}
    }

    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # The rate limit is 10 requests per hour.
        # Sending enough requests to trigger the rate limit, accounting for other tests.
        for i in range(8):
            response = await ac.post("/api/feedback/submit", json=base_feedback_data)
            assert response.status_code == 200

        # This request should be the one that gets rate limited
        response = await ac.post("/api/feedback/submit", json=base_feedback_data)
        assert response.status_code == 429


@pytest.mark.asyncio
async def test_submit_feedback_validation_error(db, limiter):
    app = create_test_app(limiter)
    # Missing 'description' field
    feedback_data = {
        "feedback_type": "bug",
        "device_info": {"os_version": "Android 12", "app_version": "1.0.0", "device_model": "Pixel 6"}
    }

    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/feedback/submit", json=feedback_data)

    assert response.status_code == 422
