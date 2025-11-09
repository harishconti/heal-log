from typing import List

from fastapi import APIRouter, Depends

from app.core.exceptions import NotFoundException
from app.core.security import get_current_user, require_role
from app.schemas.role import UserRole
from app.schemas.user import UserResponse
from app.services.user_service import user_service


router = APIRouter()

@router.get("/", response_model=List[UserResponse])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user_id: str = Depends(require_role(UserRole.ADMIN)),
):
    """
    Retrieve all users. Admin role required.
    """
    users = await user_service.get_multi(skip=skip, limit=limit)
    return users

@router.get("/me", response_model=dict)
async def read_users_me(current_user_id: str = Depends(get_current_user)):
    """
    Get the current authenticated user's information.
    """
    user = await user_service.get(current_user_id)
    if not user:
        raise NotFoundException(detail="User not found")

    return {"success": True, "user": UserResponse(**user.model_dump())}
