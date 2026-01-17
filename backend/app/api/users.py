from typing import List

from fastapi import APIRouter, Depends, Request

from app.core.exceptions import NotFoundException, BadRequestException, InternalServerException
from app.core.security import get_current_user, require_role
from app.core.limiter import limiter
from app.core.logger import get_logger
from app.core.constants import RATE_LIMIT_PASSWORD_CHANGE
from app.schemas.role import UserRole
from app.schemas.user import User, UserResponse, UserUpdate, UserPasswordUpdate
from app.services.user_service import user_service

logger = get_logger(__name__)

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """
    Retrieve all users. Admin role required.
    """
    users = await user_service.get_multi(skip=skip, limit=limit)
    return users

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get the current authenticated user's information.
    """
    if not current_user:
        raise NotFoundException(resource="User")

    return current_user

@router.put("/me", response_model=UserResponse)
async def update_user_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
):
    """
    Update current user's profile.
    """
    try:
        # Log the update attempt
        logger.info("user_profile_update_attempt", user_id=str(current_user.id))
        logger.debug("user_profile_update_data", fields=list(user_in.dict(exclude_none=True).keys()))

        # Convert UserUpdate to dict, excluding None values
        update_data = user_in.dict(exclude_none=True)

        if not update_data:
            logger.warning("user_profile_no_fields", user_id=str(current_user.id))
            return current_user

        # Update user
        user = await user_service.update(current_user.id, update_data)

        if not user:
            logger.error("user_profile_not_found", user_id=str(current_user.id))
            raise NotFoundException(resource="User")

        logger.info("user_profile_updated", user_id=str(current_user.id))
        return user

    except NotFoundException:
        raise
    except Exception as e:
        logger.error("user_profile_update_error", user_id=str(current_user.id), error=str(e), exc_info=True)
        raise InternalServerException("Failed to update user profile. Please try again later.")

@router.post("/me/password")
@limiter.limit(RATE_LIMIT_PASSWORD_CHANGE)
async def change_password(
    request: Request,
    password_in: UserPasswordUpdate,
    current_user: User = Depends(get_current_user),
):
    """
    Change current user's password.
    Rate limited to 3 attempts per hour to prevent brute force attacks.
    """
    try:
        await user_service.change_password(current_user, password_in.current_password, password_in.new_password)
        return {"message": "Password updated successfully"}
    except ValueError as e:
        raise BadRequestException(message=str(e))
