from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid
from beanie import Document, Indexed

class SyncEvent(Document):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    user_id: Indexed(str)
    success: bool
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "sync_events"
