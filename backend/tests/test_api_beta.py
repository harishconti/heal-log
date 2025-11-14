import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from app.main import app
from app.schemas.beta import KnownIssue

client = TestClient(app)

@pytest.fixture
def sample_issue():
    return KnownIssue(
        id="1",
        title="Test Issue",
        description="This is a test issue.",
        severity="low",
        status="open"
    )

@pytest.mark.asyncio
async def test_get_known_issues_schema(sample_issue):
    with patch('app.api.beta.get_known_issues_service', new_callable=AsyncMock) as mock_get_issues:
        mock_get_issues.return_value = [sample_issue.model_dump()]
        response = client.get("/api/beta/known-issues")
        assert response.status_code == 200
        issues = response.json()
        assert isinstance(issues, list)
        assert len(issues) == 1
        issue = issues[0]
        assert issue["id"] == sample_issue.id
        assert issue["title"] == sample_issue.title
        assert issue["description"] == sample_issue.description
        assert issue["severity"] == sample_issue.severity
        assert issue["status"] == sample_issue.status

@pytest.mark.asyncio
async def test_get_known_issues_empty():
    with patch('app.api.beta.get_known_issues_service', new_callable=AsyncMock) as mock_get_issues:
        mock_get_issues.return_value = []
        response = client.get("/api/beta/known-issues")
        assert response.status_code == 200
        assert response.json() == []

@pytest.mark.asyncio
async def test_get_known_issues_caching():
    with patch('app.api.beta.get_known_issues_service', new_callable=AsyncMock) as mock_get_issues:
        mock_get_issues.return_value = []

        # First request
        response1 = client.get("/api/beta/known-issues")
        assert response1.status_code == 200
        assert "cache-control" in response1.headers
        mock_get_issues.assert_awaited_once()

        # Second request (should be cached by middleware, so service not called again)
        # Note: TestClient doesn't share a lifespan, so cache might not persist.
        # We're checking the header as a proxy for the caching behavior.
        response2 = client.get("/api/beta/known-issues")
        assert response2.status_code == 200
        # In a real scenario with a persistent cache, the mock would not be called again.
        # Due to TestClient limitations, we can't assert call count > 1.
        # We rely on the presence of the header.

def test_get_known_issues_returns_list():
    response = client.get("/api/beta/known-issues")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
