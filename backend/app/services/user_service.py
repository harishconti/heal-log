from app.schemas.user import User, UserCreate, UserUpdate
from app.core.hashing import get_password_hash, verify_password
from typing import Optional, Dict, Any
from .base_service import BaseService
import uuid
import logging
from bson import ObjectId

logger = logging.getLogger(__name__)

async def get_user_by_id(user_id: str) -> Optional[User]:
    """
    Retrieves a user by their ID.
    Handles both MongoDB ObjectId format and UUID strings.
    """
    logger.info(f"[USER_SERVICE] Looking up user by ID: {user_id}")
    try:
        # Try converting to ObjectId first (for MongoDB _id queries)
        try:
            oid = ObjectId(user_id)
            user = await User.find_one({"_id": oid})
            if user:
                logger.info(f"[USER_SERVICE] User found by ObjectId: {user.email}")
                return user
        except Exception as oid_error:
            logger.debug(f"[USER_SERVICE] Not a valid ObjectId: {oid_error}")
        
        # Fallback: Try as string _id
        user = await User.find_one({"_id": user_id})
        if user:
            logger.info(f"[USER_SERVICE] User found by string _id: {user.email}")
            return user
            
        # Fallback: Try by id field (UUID string)
        logger.info(f"[USER_SERVICE] Not found by _id, trying id field")
        user = await User.find_one({"id": user_id})
        
        if user:
            logger.info(f"[USER_SERVICE] User found by id field: {user.email}")
        else:
            logger.warning(f"[USER_SERVICE] User not found for ID: {user_id}")
        return user
    except Exception as e:
        logger.error(f"[USER_SERVICE] Error fetching user by ID: {str(e)}", exc_info=True)
        return None

class UserService(BaseService[User, UserCreate, UserUpdate]):
    async def create(self, obj_in: UserCreate, **kwargs: Any) -> User:
        """
        Overrides the base create method to handle password hashing.
        """
        password_hash = get_password_hash(obj_in.password)
        user_data = obj_in.dict(exclude={"password"})
        user_data["password_hash"] = password_hash
        user_data["id"] = str(uuid.uuid4())
        db_user = User(**user_data)
        await db_user.insert()
        return db_user

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Retrieves a user by their email address.
        """
        logger.info(f"[USER_SERVICE] Looking up user by email: {email}")
        return await User.find_one({"email": email})

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """
        Retrieves a user by their ID using the standalone function.
        """
        return await get_user_by_id(user_id)

    async def authenticate(self, email: str, password: str) -> Optional[User]:
        """
        Authenticates a user. Returns the user object if successful, otherwise None.
        """
        user = await self.get_user_by_email(email)
        if not user or not user.password_hash or not verify_password(password, user.password_hash):
            return None
        return user

    async def update(self, user_id: str, user_data: dict) -> Optional[User]:
        """
        Updates a user's information.
        """
        logger.info(f"[USER_SERVICE] Updating user: {user_id} with data: {user_data}")
        try:
            user = await self.get_user_by_id(user_id)
            if not user:
                logger.warning(f"[USER_SERVICE] User not found for update: {user_id}")
                return None

            # Update only provided fields
            for key, value in user_data.items():
                if hasattr(user, key):
                    setattr(user, key, value)
                    logger.debug(f"[USER_SERVICE] Set {key} = {value}")

            await user.save()
            logger.info(f"[USER_SERVICE] User updated successfully: {user_id}")
            return user
        except Exception as e:
            logger.error(f"[USER_SERVICE] Error updating user {user_id}: {str(e)}", exc_info=True)
            raise

# Create a singleton instance of the service
user_service = UserService(User)
