from fastapi import FastAPI, Request, status
from httpx import ASGITransport, AsyncClient
import pytest

from app.core.errors import APIException, api_exception_handler

# Create a new FastAPI app instance for testing
test_app = FastAPI()
test_app.add_exception_handler(APIException, api_exception_handler)

@test_app.get("/test_api_exception")
async def raise_api_exception_endpoint():
    raise APIException(status_code=status.HTTP_400_BAD_REQUEST, detail="Test API Exception")

@pytest.mark.asyncio
async def test_api_exception_handler():
    # Use ASGITransport to allow httpx to call the app directly
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/test_api_exception")

    assert response.status_code == 400
    assert response.json() == {
        "success": False,
        "error": {"message": "Test API Exception"},
    }
