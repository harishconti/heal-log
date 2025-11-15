import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from main import app
from app.schemas.beta_feedback import BetaFeedback, DeviceInfo

client = TestClient(app)

@pytest.fixture
def sample_issue():
    return BetaFeedback(
        feedback_type="bug",
        description="This is a test issue.",
        device_info=DeviceInfo(os_version="Android 12", app_version="1.1.0")
    )

def test_get_known_issues_schema():
    response = client.get("/api/beta/known-issues")
    assert response.status_code == 200
    issues = response.json()
    assert isinstance(issues, list)
    assert len(issues) > 0
    issue = issues[0]
    assert "id" in issue
    assert "title" in issue
    assert "description" in issue

def test_get_known_issues_returns_list():
    response = client.get("/api/beta/known-issues")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_known_issues_returns_list():
    response = client.get("/api/beta/known-issues")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
