from fastapi import APIRouter, Depends, BackgroundTasks
from backend.app.schemas.beta_feedback import BetaFeedback, BetaFeedbackIn
from backend.app.services.feedback_service import feedback_service
from backend.app.models.user import User
from backend.app.core.security import get_optional_current_user

router = APIRouter()

@router.post("/submit", response_model=BetaFeedback)
async def submit_feedback(
    feedback_data: BetaFeedbackIn,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_optional_current_user) # Optional auth
):
    """
    Receives a feedback submission, stores it, and triggers a notification.
    """
    feedback = await feedback_service.create_feedback(feedback_data, background_tasks)
    return feedback
