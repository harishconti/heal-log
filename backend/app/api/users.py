from fastapi import APIRouter, Depends, HTTPException
from app.services.user_service import user_service
from app.core.security import get_current_user
from app.schemas.user import UserResponse

router = APIRouter()

@router.get("/me", response_model=dict)
async def read_users_me(current_user_id: str = Depends(get_current_user)):
    """
    Get the current authenticated user's information.
    """
    user = await user_service.get(current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"success": True, "user": UserResponse(**user.dict())}