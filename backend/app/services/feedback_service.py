import os
import base64
import re
from uuid import uuid4
from fastapi import BackgroundTasks
from app.services.base_service import BaseService
from app.schemas.beta_feedback import BetaFeedback, BetaFeedbackIn
from app.core.config import settings
from app.core.logger import get_logger
from app.db.session import get_database

logger = get_logger(__name__)

# Maximum file size for screenshots (5MB)
MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024
# Allowed image magic bytes (PNG, JPEG, GIF, WebP)
ALLOWED_IMAGE_SIGNATURES = [
    b'\x89PNG\r\n\x1a\n',  # PNG
    b'\xff\xd8\xff',       # JPEG
    b'GIF87a',             # GIF87a
    b'GIF89a',             # GIF89a
    b'RIFF',               # WebP (starts with RIFF, followed by size, then WEBP)
]

async def get_feedback_collection():
    db = await get_database()
    return db.get_collection("beta_feedback")


def _validate_base64_image(base64_string: str) -> bytes:
    """
    Validates and decodes a base64-encoded image.

    Raises:
        ValueError: If the base64 string is invalid or the image exceeds size limits
    """
    # Remove data URL prefix if present (e.g., "data:image/png;base64,")
    if ',' in base64_string:
        base64_string = base64_string.split(',', 1)[1]

    # Validate base64 format
    if not re.match(r'^[A-Za-z0-9+/]*={0,2}$', base64_string):
        raise ValueError("Invalid base64 format")

    try:
        decoded_data = base64.b64decode(base64_string)
    except Exception as e:
        raise ValueError(f"Failed to decode base64 data: {e}")

    # Check file size
    if len(decoded_data) > MAX_SCREENSHOT_SIZE:
        raise ValueError(f"Screenshot exceeds maximum size of {MAX_SCREENSHOT_SIZE // (1024 * 1024)}MB")

    # Validate image signature (magic bytes)
    is_valid_image = False
    for sig in ALLOWED_IMAGE_SIGNATURES:
        if decoded_data.startswith(sig):
            is_valid_image = True
            break

    # Special check for WebP (RIFF....WEBP)
    if decoded_data.startswith(b'RIFF') and len(decoded_data) > 12:
        if decoded_data[8:12] == b'WEBP':
            is_valid_image = True

    if not is_valid_image:
        raise ValueError("Invalid image format. Only PNG, JPEG, GIF, and WebP are allowed")

    return decoded_data


class FeedbackService(BaseService):
    async def create_feedback(self, feedback_data: BetaFeedbackIn, background_tasks: BackgroundTasks) -> BetaFeedback:
        screenshot_url = None
        if feedback_data.screenshot:
            try:
                screenshot_data = _validate_base64_image(feedback_data.screenshot)
            except ValueError as e:
                logger.warning("feedback_invalid_screenshot", error=str(e))
                raise ValueError(f"Screenshot validation failed: {e}")

            screenshot_filename = f"{uuid4()}.png"
            screenshot_path = os.path.join(settings.STATIC_DIR, screenshot_filename)

            os.makedirs(settings.STATIC_DIR, exist_ok=True)
            with open(screenshot_path, "wb") as f:
                f.write(screenshot_data)
            screenshot_url = f"/static/{screenshot_filename}"

        feedback = BetaFeedback(
            **feedback_data.model_dump(exclude={"screenshot"}),
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
            logger.info("feedback_email_skipped", reason="email_not_configured")
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
        Device Info: {feedback.device_info.model_dump()}
        Screenshot: {settings.BASE_URL}{feedback.screenshot_url if feedback.screenshot_url else 'N/A'}
        """
        message.attach(MIMEText(body, "plain"))

        server = None
        try:
            server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT)
            server.starttls()
            server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
            server.sendmail(settings.EMAIL_USER, settings.EMAIL_TO, message.as_string())
            logger.info("feedback_email_sent", feedback_type=feedback.feedback_type)
        except Exception as e:
            logger.error("feedback_email_failed", error=str(e))
        finally:
            if server:
                try:
                    server.quit()
                except Exception:
                    pass  # Ignore errors during cleanup

feedback_service = FeedbackService(get_feedback_collection)
