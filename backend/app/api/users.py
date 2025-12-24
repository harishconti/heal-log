from typing import List
import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.exceptions import NotFoundException
from app.core.security import get_current_user, require_role
from app.schemas.role import UserRole
from app.schemas.user import User, UserResponse, UserUpdate, UserPasswordUpdate
from app.services.user_service import user_service


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
        raise NotFoundException(detail="User not found")

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
        logging.info(f"[UPDATE_USER] User {current_user.id} attempting profile update")
        logging.debug(f"[UPDATE_USER] Update data: {user_in.dict(exclude_none=True)}")
        
        # Convert UserUpdate to dict, excluding None values
        update_data = user_in.dict(exclude_none=True)
        
        if not update_data:
            logging.warning(f"[UPDATE_USER] No fields to update for user {current_user.id}")
            return current_user
        
        # Update user
        user = await user_service.update(current_user.id, update_data)
        
        if not user:
            logging.error(f"[UPDATE_USER] User {current_user.id} not found during update")
            raise NotFoundException(detail="User not found")
        
        logging.info(f"[UPDATE_USER] User {current_user.id} profile updated successfully")
        return user
        
    except NotFoundException:
        raise
    except Exception as e:
        logging.error(f"[UPDATE_USER] Error updating user {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile. Please try again later."
        )

@router.post("/me/password")
async def change_password(
    password_in: UserPasswordUpdate,
    current_user: User = Depends(get_current_user),
):
    """
    Change current user's password.
    """
    await user_service.change_password(current_user, password_in.current_password, password_in.new_password)
    return {"message": "Password updated successfully"}
