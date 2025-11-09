from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid
from beanie import Document, Indexed
from typing import Optional

class ErrorEvent(Document):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    user_id: Optional[Indexed(str)] = None
    request_id: Optional[str] = None
    path: str
    method: str
    status_code: int
    error: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "error_events"
