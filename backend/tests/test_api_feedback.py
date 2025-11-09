import pytest
from httpx import AsyncClient
from tests.test_main import create_test_app
from app.schemas.user import User
from app.core.security import create_access_token
import uuid

@pytest.mark.asyncio
async def test_submit_feedback_authenticated(db, limiter):
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
        "email": "test@example.com",
        "device_info": {"os": "Android", "version": "12"}
    }

    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/feedback/",
            json=feedback_data,
            headers={"Authorization": f"Bearer {token}"}
        )

    assert response.status_code == 201
    data = response.json()
    assert data["feedback_type"] == feedback_data["feedback_type"]
    assert data["description"] == feedback_data["description"]
    assert data["email"] == feedback_data["email"]
    assert data["user_id"] == test_user.id
    assert data["device_info"] == feedback_data["device_info"]

@pytest.mark.asyncio
async def test_submit_feedback_anonymous(db, limiter):
    app = create_test_app(limiter)
    feedback_data = {
        "feedback_type": "feature",
        "description": "This is a test feature request.",
        "email": "anonymous@example.com"
    }

    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/feedback/", json=feedback_data)

    assert response.status_code == 201
    data = response.json()
    assert data["feedback_type"] == feedback_data["feedback_type"]
    assert data["description"] == feedback_data["description"]
    assert data["email"] == feedback_data["email"]
    assert data["user_id"] is None


@pytest.mark.asyncio
async def test_submit_feedback_rate_limit(db, limiter):
    app = create_test_app(limiter)
    base_feedback_data = {
        "feedback_type": "other",
        "description": "This is a test idea.",
    }

    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # The rate limit is 10 requests per hour.
        # Sending 11 requests to trigger the rate limit.
        for i in range(10):
            feedback_data = base_feedback_data.copy()
            feedback_data["email"] = f"limittest{i}@example.com"
            response = await ac.post("/api/feedback/", json=feedback_data)
            assert response.status_code == 201

        feedback_data = base_feedback_data.copy()
        feedback_data["email"] = "limittest10@example.com"
        response = await ac.post("/api/feedback/", json=feedback_data)
        assert response.status_code == 429


@pytest.mark.asyncio
async def test_submit_feedback_validation_error(db, limiter):
    app = create_test_app(limiter)
    # Missing 'description' field
    feedback_data = {
        "feedback_type": "bug",
        "email": "validationtest@example.com"
    }

    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/feedback/", json=feedback_data)

    assert response.status_code == 422
