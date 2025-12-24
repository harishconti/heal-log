import pytest
from httpx import AsyncClient, ASGITransport
import uuid
from unittest.mock import patch, AsyncMock, MagicMock
from app.schemas.user import User, UserPlan
from app.schemas.role import UserRole
from app.core.security import create_access_token
from app.services.analytics_service import analytics_service
from app.services.user_service import user_service
import os

@pytest.mark.asyncio
async def test_create_checkout_session_success(db, app):
    """
    Tests creating a checkout session for a beta user.
    """
    test_user = User(
        id=str(uuid.uuid4()),
        email="checkout@example.com",
        full_name="Checkout User",
        password_hash="hashed_password",
        role="doctor",
        plan="basic",
        is_beta_tester=True
    )
    await test_user.insert()

    token = create_access_token(
        subject=test_user.id,
        plan=test_user.plan,
        role=test_user.role
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/payments/create-checkout-session",
            headers={"Authorization": f"Bearer {token}"}
        )

    assert response.status_code == 200
    assert "checkout_url" in response.json()

@pytest.mark.asyncio
async def test_create_checkout_session_not_beta(db, app):
    """
    Tests that non-beta users cannot create checkout session.
    """
    test_user = User(
        id=str(uuid.uuid4()),
        email="notbeta@example.com",
        full_name="Not Beta User",
        password_hash="hashed_password",
        role="doctor",
        plan="basic",
        is_beta_tester=False
    )
    await test_user.insert()

    token = create_access_token(
        subject=test_user.id,
        plan=test_user.plan,
        role=test_user.role
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/payments/create-checkout-session",
            headers={"Authorization": f"Bearer {token}"}
        )

    # Expect 403 Forbidden (BetaUserException)
    assert response.status_code == 403

@pytest.mark.asyncio
@patch("app.api.payments.verify_stripe_signature")
@patch("app.api.payments.STRIPE_WEBHOOK_SECRET", "test_secret")
async def test_payments_webhook(mock_verify, app):
    """
    Tests payments stripe webhook.
    """
    mock_verify.return_value = True

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/payments/webhooks/stripe",
            json={"type": "test_event"},
            headers={"Stripe-Signature": "t=123,v1=valid_sig"}
        )

    assert response.status_code == 200
    assert response.json()["status"] == "received"

@pytest.mark.asyncio
async def test_export_patients(db, app):
    """
    Tests exporting patients as CSV.
    """
    test_user = User(
        id=str(uuid.uuid4()),
        email="export@example.com",
        full_name="Export User",
        password_hash="hashed_password",
        role="doctor",
        plan="pro"
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
            "/api/export/patients",
            headers={"Authorization": f"Bearer {token}"}
        )

    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"

@pytest.mark.asyncio
async def test_analytics_endpoints_pro(db, app):
    """
    Tests analytics endpoints for PRO user.
    """
    test_user = User(
        id=str(uuid.uuid4()),
        email="analytics_pro@example.com",
        full_name="Analytics Pro",
        password_hash="hashed_password",
        role="doctor",
        plan="pro"
    )
    await test_user.insert()

    token = create_access_token(
        subject=test_user.id,
        plan=test_user.plan,
        role=test_user.role
    )

    # Mock the analytics service methods
    with patch.object(analytics_service, "get_patient_growth_analytics", new_callable=AsyncMock) as mock_growth:
        mock_growth.return_value = [{"date": "2023-01-01", "count": 1}]

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.get(
                "/api/analytics/patient-growth",
                headers={"Authorization": f"Bearer {token}"}
            )

        assert response.status_code == 200
        assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_analytics_endpoints_basic_forbidden(db, app):
    """
    Tests that basic users cannot access analytics.
    """
    test_user = User(
        id=str(uuid.uuid4()),
        email="analytics_basic@example.com",
        full_name="Analytics Basic",
        password_hash="hashed_password",
        role="doctor",
        plan="basic"
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
            "/api/analytics/patient-growth",
            headers={"Authorization": f"Bearer {token}"}
        )

    # Expect 403 Forbidden
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_debug_endpoint_admin(db, app):
    """
    Tests debug endpoint for admin.
    """
    test_user = User(
        id=str(uuid.uuid4()),
        email="debug_admin@example.com",
        full_name="Debug Admin",
        password_hash="hashed_password",
        role="admin",
        plan="pro"
    )
    await test_user.insert()

    token = create_access_token(
        subject=test_user.id,
        plan=test_user.plan,
        role=test_user.role
    )

    # Mock settings.ENV to be 'development'
    with patch("app.core.config.settings.ENV", "development"):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.post(
                "/api/debug/clear-all-caches",
                headers={"Authorization": f"Bearer {token}"}
            )

    assert response.status_code == 200
    assert response.json()["success"] == True
