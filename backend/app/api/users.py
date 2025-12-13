from typing import List

from fastapi import APIRouter, Depends

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
    # Convert UserUpdate to dict, excluding None values
    update_data = user_in.dict(exclude_none=True)
    user = await user_service.update(current_user.id, update_data)
    return user

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
