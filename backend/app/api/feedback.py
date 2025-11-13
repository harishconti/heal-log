from fastapi import APIRouter, Depends, BackgroundTasks
from app.schemas.beta_feedback import BetaFeedback, BetaFeedbackIn
from app.services.feedback_service import feedback_service
from app.models.user import User
from app.core.security import get_optional_current_user
from app.core.limiter import limiter
from fastapi import Request

router = APIRouter()

@router.post("/submit", response_model=BetaFeedback)
@limiter.limit("10/hour")
async def submit_feedback(
    request: Request,
    feedback_data: BetaFeedbackIn,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_optional_current_user) # Optional auth
):
    """
    Receives a feedback submission, stores it, and triggers a notification.
    """
    feedback = await feedback_service.create_feedback(feedback_data, background_tasks)
    return feedback
