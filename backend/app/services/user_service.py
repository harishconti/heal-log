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

async def authenticate_user(email: str, password: str) -> Optional[User]:
    """
    Authenticates a user. Returns the user object if successful, otherwise None.
    """
    user = await User.find_one({"email": email})
    if not user or not verify_password(password, user.password_hash):
        return None
    return user

user_service = UserService(User)