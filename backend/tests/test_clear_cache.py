import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_clear_all_caches():
    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/debug/clear-all-caches")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
