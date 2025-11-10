from typing import List

from fastapi import APIRouter, Depends

from app.core.exceptions import NotFoundException
from app.core.security import get_current_user, require_role
from app.schemas.role import UserRole
from app.schemas.user import UserResponse
from app.services.user_service import user_service


router = APIRouter()

@router.get(
    "/",
    response_model=List[UserResponse],
    summary="Get All Users",
    description="Retrieves a list of all users. This endpoint is restricted to users with the ADMIN role.",
    responses={
        200: {"description": "A list of users."},
        403: {"description": "User does not have permission to access this resource."},
    },
)
async def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user_id: str = Depends(require_role(UserRole.ADMIN)),
):
    users = await user_service.get_multi(skip=skip, limit=limit)
    return users

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Current User",
    description="Retrieves the profile information for the currently authenticated user.",
    responses={
        200: {
            "description": "User profile retrieved successfully.",
            "content": {
                "application/json": {
                    "example": {
                        "id": "60d5ec49e77a7b001f8e8b45",
                        "email": "user@example.com",
                        "full_name": "Dr. John Doe",
                        "is_active": True,
                        "role": "DOCTOR",
                        "plan": "PRO",
                        "trial_ends_at": "2025-12-31T23:59:59Z",
                    }
                }
            },
        },
        401: {"description": "User is not authenticated"},
        404: {"description": "User not found"},
    },
)
async def read_users_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user
