from app.schemas.user import User, UserCreate, UserUpdate
from app.core.hashing import get_password_hash, verify_password
from typing import Optional, Dict, Any
from .base_service import BaseService
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

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

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Retrieves a user by their email address.
        """
        logger.info(f"[USER_SERVICE] Looking up user by email: {email}")
        try:
            from app.schemas.user import User as UserModel
            user = await UserModel.find_one({"email": email})
            if user:
                logger.info(f"[USER_SERVICE] User found: {user.id}")
            else:
                logger.warning(f"[USER_SERVICE] User not found for email: {email}")
            return user
        except Exception as e:
            logger.error(f"[USER_SERVICE] Error fetching user by email: {str(e)}", exc_info=True)
            raise

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """
        Retrieves a user by their ID.
        """
        logger.info(f"[USER_SERVICE] Looking up user by ID: {user_id}")
        try:
            from app.schemas.user import User as UserModel
            user = await UserModel.get(user_id)
            if user:
                logger.info(f"[USER_SERVICE] User found: {user.email}")
            else:
                logger.warning(f"[USER_SERVICE] User not found for ID: {user_id}")
            return user
        except Exception as e:
            logger.error(f"[USER_SERVICE] Error fetching user by ID: {str(e)}", exc_info=True)
            logger.error(f"[USER_SERVICE] Error type: {type(e).__name__}")
            raise

async def authenticate_user(email: str, password: str) -> Optional[User]:
    """
    Authenticates a user. Returns the user object if successful, otherwise None.
    """
    from app.schemas.user import User as UserModel
    user = await UserModel.find_one({"email": email})
    if not user or not user.password_hash or not verify_password(password, user.password_hash):
        return None

    return user

async def get_user_by_id(user_id: str) -> Optional[User]:
    """
    Retrieves a user by their ID.
    """
    logger.info(f"[USER_SERVICE] get_user_by_id called with ID: {user_id}")
    try:
        from app.schemas.user import User as UserModel
        user = await UserModel.get(user_id)
        logger.info(f"[USER_SERVICE] User lookup result: {user is not None}")
        return user
    except Exception as e:
        logger.error(f"[USER_SERVICE] Error in get_user_by_id: {str(e)}", exc_info=True)
        raise

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
