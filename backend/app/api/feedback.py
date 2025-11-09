from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services.feedback_service import feedback_service
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.core.security import get_optional_current_user
from typing import Optional

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.post(
    "/",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit feedback",
)
@limiter.limit("10/hour")
async def submit_feedback(
    request: Request,
    feedback_in: FeedbackCreate,
    user_id: Optional[str] = Depends(get_optional_current_user),
):
    """
    Submit feedback.
    """
    feedback = await feedback_service.create(feedback_in, user_id=user_id)
    return feedback
