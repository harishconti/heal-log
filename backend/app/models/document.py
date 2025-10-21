from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
import uuid

class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    user_id: str
    file_name: str
    storage_url: str  # URL from Google Cloud Storage
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))