import pytest
from unittest.mock import patch, AsyncMock
from app.services.user_service import user_service
from app.schemas.user import UserCreate, User
from app.core import hashing

@pytest.mark.asyncio
async def test_create_user(db):
    user_data = UserCreate(
        email="test@example.com",
        password="password123",
        full_name="Test User"
    )

    with patch.object(user_service, "create", new_callable=AsyncMock) as mock_create:

        mock_create.return_value = User(
            email=user_data.email,
            full_name=user_data.full_name,
            password_hash=hashing.get_password_hash("password123")
        )

        created_user = await user_service.create(user_data)

        mock_create.assert_called_once_with(user_data)

        assert created_user.email == user_data.email
        assert hashing.verify_password("password123", created_user.password_hash)

@pytest.mark.asyncio
async def test_get_user_by_id(db):
    mock_user = User(
        id="123",
        email="test@example.com",
        full_name="Test User",
        password_hash="hashed_password"
    )

    with patch.object(user_service, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_user

        retrieved_user = await user_service.get("123")

        mock_get.assert_called_once_with("123")
        assert retrieved_user == mock_user