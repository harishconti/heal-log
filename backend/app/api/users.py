from fastapi import APIRouter, Depends, HTTPException
from app.services import user_service
from app.core.security import get_current_user

router = APIRouter()

@router.get("/me", response_model=dict)
async def read_users_me(current_user_id: str = Depends(get_current_user)):
    """
    Get the current authenticated user's information.
    """
    user = await user_service.get_user_by_id(current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"success": True, "user": user.to_response()}