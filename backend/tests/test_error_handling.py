from fastapi import FastAPI, Request, status
from httpx import ASGITransport, AsyncClient
import pytest

from app.core.exceptions import APIException, api_exception_handler
import uuid

# Create a new FastAPI app instance for testing
test_app = FastAPI()

@test_app.middleware("http")
async def add_request_id(request: Request, call_next):
    request.state.request_id = str(uuid.uuid4())
    response = await call_next(request)
    return response

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
    response_json = response.json()
    assert response_json["success"] is False
    assert response_json["error"]["message"] == "Test API Exception"
    assert "request_id" in response_json
    assert isinstance(uuid.UUID(response_json["request_id"]), uuid.UUID)
