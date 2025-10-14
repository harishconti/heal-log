from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
import uuid

class ClinicalNote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    user_id: str
    content: str
    visit_type: Literal["regular", "follow-up", "emergency"] = "regular"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }