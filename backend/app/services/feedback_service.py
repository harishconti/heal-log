from app.schemas.feedback import Feedback, FeedbackCreate
from .base_service import BaseService
from typing import Optional
import uuid

class FeedbackService(BaseService[Feedback, FeedbackCreate, None]):
    async def create(self, obj_in: FeedbackCreate, user_id: Optional[str] = None) -> Feedback:
        feedback_data = obj_in.model_dump()
        db_obj = Feedback(
            **feedback_data,
            id=str(uuid.uuid4()),
            user_id=user_id
        )
        await db_obj.insert()
        return db_obj

feedback_service = FeedbackService(Feedback)
