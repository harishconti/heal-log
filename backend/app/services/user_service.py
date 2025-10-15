from app.db.session import UserCollection
from app.schemas.user import UserCreate, UserPlan, SubscriptionStatus
from app.core.hashing import get_password_hash, verify_password
from app.models.user import User
from bson import ObjectId
from typing import Optional
import uuid
from datetime import datetime, timedelta

async def create_user(user_data: UserCreate) -> User:
    """
    Creates a new user in the database.
    """
    existing_user = await UserCollection.find_one({"email": user_data.email})
    if existing_user:
        raise ValueError("Email already registered")

    user_dict = user_data.dict()
    user_dict["password_hash"] = get_password_hash(user_dict.pop("password"))

    # Create a User model instance for the database.
    # Pydantic will apply the default values for id, plan, subscription_status,
    # subscription_end_date, created_at, and updated_at from the User model.
    db_user = User(**user_dict)

    # Insert the dictionary representation into the database
    await UserCollection.insert_one(db_user.dict())

    return db_user

async def authenticate_user(email: str, password: str) -> Optional[User]:
    """
    Authenticates a user. Returns the user object if successful, otherwise None.
    """
    user_from_db = await UserCollection.find_one({"email": email})
    if not user_from_db or not verify_password(password, user_from_db.get("password_hash", "")):
        return None

    return User(**user_from_db)

async def get_user_by_id(user_id: str) -> User | None:
    """
    Retrieves a user by their ID.
    """
    user_from_db = await UserCollection.find_one({"id": user_id})
    if user_from_db:
        return User(**user_from_db)
    return None

async def get_user_by_email(email: str) -> User | None:
    """
    Retrieves a user by their email.
    """
    user_from_db = await UserCollection.find_one({"email": email})
    if user_from_db:
        return User(**user_from_db)
    return None

async def update_user(user_id: str, updates: dict) -> Optional[User]:
    """
    Updates a user's data in the database.
    """
    # Ensure 'updated_at' is always updated on every change.
    updates["updated_at"] = datetime.utcnow()

    result = await UserCollection.find_one_and_update(
        {"id": user_id},
        {"$set": updates},
        return_document=True
    )

    if result:
        return User(**result)
    return None