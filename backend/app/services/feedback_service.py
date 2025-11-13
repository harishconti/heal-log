import os
import base64
from uuid import uuid4
from fastapi import BackgroundTasks
from backend.app.services.base_service import BaseService
from backend.app.schemas.beta_feedback import BetaFeedback, BetaFeedbackIn
from backend.app.core.config import settings

class FeedbackService(BaseService):
    async def create_feedback(self, feedback_data: BetaFeedbackIn, background_tasks: BackgroundTasks) -> BetaFeedback:
        screenshot_url = None
        if feedback_data.screenshot:
            screenshot_data = base64.b64decode(feedback_data.screenshot)
            screenshot_filename = f"{uuid4()}.png"
            screenshot_path = os.path.join(settings.STATIC_DIR, screenshot_filename)

            os.makedirs(settings.STATIC_DIR, exist_ok=True)
            with open(screenshot_path, "wb") as f:
                f.write(screenshot_data)
            screenshot_url = f"/static/{screenshot_filename}"

        feedback = BetaFeedback(
            **feedback_data.dict(exclude={"screenshot"}),
            screenshot_url=screenshot_url
        )
        await feedback.insert()

        # background_tasks.add_task(self.send_feedback_email, feedback)
        return feedback

    async def send_feedback_email(self, feedback: BetaFeedback):
        # This is a placeholder for a real email sending implementation
        # For now, we will just print to the console to simulate
        print(f"--- New Feedback Received ---")
        print(f"Type: {feedback.feedback_type}")
        print(f"Description: {feedback.description}")
        if feedback.steps_to_reproduce:
            print(f"Steps to Reproduce: {feedback.steps_to_reproduce}")
        print(f"Device Info: {feedback.device_info.dict()}")
        if feedback.screenshot_url:
            print(f"Screenshot: {settings.BASE_URL}{feedback.screenshot_url}")
        print(f"--------------------------")

feedback_service = FeedbackService(BetaFeedback)
