from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

class DeviceInfo(BaseModel):
    os_version: Optional[str] = None
    app_version: Optional[str] = None
    device_model: Optional[str] = None

class BetaFeedbackIn(BaseModel):
    feedback_type: Literal["bug", "suggestion", "general"]
    description: str = Field(..., min_length=10, max_length=500)
    steps_to_reproduce: Optional[str] = None
    device_info: DeviceInfo
    screenshot: Optional[str] = None # Base64 encoded string

class BetaFeedback(Document):
    feedback_type: Literal["bug", "suggestion", "general"]
    description: str = Field(..., min_length=10, max_length=500)
    steps_to_reproduce: Optional[str] = None
    device_info: DeviceInfo
    screenshot_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "beta_feedback"
