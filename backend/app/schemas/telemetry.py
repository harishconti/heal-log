from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid
from beanie import Document, Indexed

class TelemetryEvent(BaseModel):
    event_type: str = Field(..., min_length=1, max_length=50)
    payload: Dict[str, Any] = Field(default_factory=dict)

class Telemetry(Document):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    user_id: Indexed(str)
    event_type: str = Field(..., min_length=1, max_length=50)
    payload: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "telemetry"
