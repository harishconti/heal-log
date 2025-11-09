from pydantic import BaseModel, Field, EmailStr, BeforeValidator
from typing import Optional, Dict, Annotated
from datetime import datetime, timezone
from enum import Enum
import uuid
from beanie import Document, Indexed

PyObjectId = Annotated[str, BeforeValidator(str)]

class FeedbackType(str, Enum):
    BUG = "bug"
    FEATURE = "feature"
    OTHER = "other"

class FeedbackCreate(BaseModel):
    feedback_type: FeedbackType
    description: str = Field(..., max_length=1000)
    email: Optional[EmailStr] = None
    device_info: Optional[Dict] = None

class FeedbackResponse(BaseModel):
    id: str
    feedback_type: FeedbackType
    description: str
    email: Optional[EmailStr] = None
    user_id: Optional[str] = None
    device_info: Optional[Dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Feedback(Document):
    id: PyObjectId = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    feedback_type: FeedbackType
    description: str
    email: Optional[EmailStr] = None
    user_id: Optional[str] = None
    device_info: Optional[Dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "feedback"
