import os
import base64
from uuid import uuid4
from fastapi import BackgroundTasks
from app.services.base_service import BaseService
from app.schemas.beta_feedback import BetaFeedback, BetaFeedbackIn
from app.core.config import settings
from app.db.session import get_database

async def get_feedback_collection():
    db = await get_database()
    return db.get_collection("beta_feedback")

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

        if settings.EMAIL_HOST and settings.EMAIL_TO:
            background_tasks.add_task(self.send_feedback_email, feedback)
        return feedback

    async def send_feedback_email(self, feedback: BetaFeedback):
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        if not all([settings.EMAIL_HOST, settings.EMAIL_PORT, settings.EMAIL_USER, settings.EMAIL_PASSWORD, settings.EMAIL_TO]):
            print("Email settings are not configured. Skipping email notification.")
            return

        message = MIMEMultipart()
        message["From"] = settings.EMAIL_USER
        message["To"] = settings.EMAIL_TO
        message["Subject"] = f"New Feedback Received: {feedback.feedback_type.capitalize()}"

        body = f"""
        A new piece of feedback has been submitted.

        Type: {feedback.feedback_type}
        Description: {feedback.description}
        Steps to Reproduce: {feedback.steps_to_reproduce or 'N/A'}
        Device Info: {feedback.device_info.dict()}
        Screenshot: {settings.BASE_URL}{feedback.screenshot_url if feedback.screenshot_url else 'N/A'}
        """
        message.attach(MIMEText(body, "plain"))

        try:
            server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT)
            server.starttls()
            server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
            server.sendmail(settings.EMAIL_USER, settings.EMAIL_TO, message.as_string())
            server.quit()
            print("Feedback email sent successfully.")
        except Exception as e:
            print(f"Failed to send feedback email: {e}")

feedback_service = FeedbackService(get_feedback_collection)
