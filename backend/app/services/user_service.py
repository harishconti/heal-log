from app.schemas.user import User, UserCreate, UserUpdate
from app.core.hashing import get_password_hash, verify_password
from app.core.logger import get_logger, LoggerMixin
from typing import Optional, Dict, Any
from .base_service import BaseService
import uuid
from bson import ObjectId

logger = get_logger(__name__)

async def get_user_by_id(user_id: str) -> Optional[User]:
    """
    Retrieves a user by their ID.
    Handles both MongoDB ObjectId format and UUID strings.
    """
    logger.info("user_lookup_by_id", user_id=user_id)
    try:
        # Try converting to ObjectId first (for MongoDB _id queries)
        try:
            oid = ObjectId(user_id)
            user = await User.find_one({"_id": oid})
            if user:
                logger.info("user_found", lookup_method="objectid", email=user.email)
                return user
        except Exception as oid_error:
            logger.debug("objectid_parse_failed", error=str(oid_error))

        # Fallback: Try as string _id
        user = await User.find_one({"_id": user_id})
        if user:
            logger.info("user_found", lookup_method="string_id", email=user.email)
            return user

        # Fallback: Try by id field (UUID string)
        logger.debug("user_lookup_fallback", lookup_method="id_field")
        user = await User.find_one({"id": user_id})

        if user:
            logger.info("user_found", lookup_method="id_field", email=user.email)
        else:
            logger.warning("user_not_found", user_id=user_id)
        return user
    except Exception as e:
        logger.error("user_lookup_error", user_id=user_id, error=str(e), exc_info=True)
        return None

class UserService(BaseService[User, UserCreate, UserUpdate]):
    async def create(self, obj_in: UserCreate, **kwargs: Any) -> User:
        """
        Overrides the base create method to handle password hashing.
        """
        password_hash = get_password_hash(obj_in.password)
        user_data = obj_in.model_dump(exclude={"password"})
        user_data["password_hash"] = password_hash
        user_data["id"] = str(uuid.uuid4())
        db_user = User(**user_data)
        await db_user.insert()
        return db_user

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Retrieves a user by their email address.
        """
        logger.info("user_lookup_by_email", email=email)
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

    # Allowlist of fields that users can update on their own profile
    # SECURITY: Do not add sensitive fields like 'role', 'plan', 'is_verified', 'password_hash', etc.
    ALLOWED_UPDATE_FIELDS = frozenset({
        'full_name',
        'phone',
        'medical_specialty',
        'profile_image',
        'preferences',
    })

    async def update(self, user_id: str, user_data: dict) -> Optional[User]:
        """
        Updates a user's information.
        Only allows updating fields in ALLOWED_UPDATE_FIELDS to prevent mass assignment attacks.
        """
        logger.info("user_update_started", user_id=user_id)
        try:
            user = await self.get_user_by_id(user_id)
            if not user:
                logger.warning("user_update_not_found", user_id=user_id)
                return None

            # Filter to only allowed fields to prevent mass assignment vulnerability
            filtered_data = {
                key: value for key, value in user_data.items()
                if key in self.ALLOWED_UPDATE_FIELDS
            }

            # Log any rejected fields for security monitoring
            rejected_fields = set(user_data.keys()) - set(filtered_data.keys())
            if rejected_fields:
                logger.warning(
                    "user_update_rejected_fields",
                    user_id=user_id,
                    rejected_fields=list(rejected_fields)
                )

            # Update only filtered fields
            for key, value in filtered_data.items():
                if hasattr(user, key):
                    setattr(user, key, value)
                    logger.debug("user_field_updated", field=key)

            await user.save()
            logger.info("user_update_success", user_id=user_id, fields_updated=list(filtered_data.keys()))
            return user
        except Exception as e:
            logger.error("user_update_error", user_id=user_id, error=str(e), exc_info=True)
            raise

    async def change_password(self, user: User, current_password: str, new_password: str) -> bool:
        """
        Changes a user's password after verifying the current password.

        Args:
            user: The user object
            current_password: The current password to verify
            new_password: The new password to set

        Returns:
            True if password was changed successfully

        Raises:
            ValueError: If current password is incorrect or new password is invalid
        """
        logger.info("password_change_started", user_id=str(user.id))

        # Verify current password
        if not user.password_hash or not verify_password(current_password, user.password_hash):
            logger.warning("password_change_invalid_current", user_id=str(user.id))
            raise ValueError("Current password is incorrect")

        # Validate new password length
        if len(new_password) < 12:
            raise ValueError("New password must be at least 12 characters long")

        # Hash and save new password
        user.password_hash = get_password_hash(new_password)
        await user.save()

        # Revoke all existing tokens for this user (force re-login on all devices)
        # Lazy import to avoid circular dependency
        from app.core.security import revoke_all_user_tokens
        revoke_all_user_tokens(str(user.id))

        logger.info("password_change_success", user_id=str(user.id))
        return True

# Create a singleton instance of the service
user_service = UserService(User)
