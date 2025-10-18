from app.schemas.user import User, UserCreate, UserUpdate
from app.core.hashing import get_password_hash, verify_password
from typing import Optional, Dict, Any
from .base_service import BaseService
import uuid
from datetime import datetime

class UserService(BaseService[User, UserCreate, UserUpdate]):
    async def create(self, obj_in: UserCreate, **kwargs: Any) -> User:
        """
        Overrides the base create method to handle password hashing.
        """
        password_hash = get_password_hash(obj_in.password)

        # Create a dictionary from the input schema, excluding the plain password
        user_data = obj_in.dict(exclude={"password"})

        # Add the hashed password and a new UUID to the dictionary
        user_data["password_hash"] = password_hash
        user_data["id"] = str(uuid.uuid4())

        # Create the user object and insert it into the database
        db_user = User(**user_data)
        await db_user.insert()
        return db_user

import logging

async def authenticate_user(email: str, password: str) -> Optional[User]:
    """
    Authenticates a user. Returns the user object if successful, otherwise None.
    """
    logging.info(f"Attempting to authenticate user: {email}")
    user = await User.find_one({"email": email})
    if not user:
        logging.warning(f"Authentication failed: User not found for email {email}")
        return None

    if not verify_password(password, user.password_hash):
        logging.warning(f"Authentication failed: Invalid password for user {email}")
        return None

    logging.info(f"Successfully authenticated user: {email}")
    return user

async def get_user_by_id(user_id: str) -> Optional[User]:
    """
    Retrieves a user by their ID.
    """
    return await User.get(user_id)

async def update_user(user_id: str, user_data: dict) -> Optional[User]:
    """
    Updates a user's information.
    """
    user = await get_user_by_id(user_id)
    if not user:
        return None

    for key, value in user_data.items():
        setattr(user, key, value)

    await user.save()
    return user

user_service = UserService(User)