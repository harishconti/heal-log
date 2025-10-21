from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Literal
import uuid
from beanie import Document, Indexed

class ClinicalNote(Document):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    patient_id: Indexed(str)
    user_id: Indexed(str)
    content: str = Field(..., min_length=1, max_length=5000)
    visit_type: Literal["regular", "follow-up", "emergency"] = "regular"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "clinical_notes"

    class Config:
        populate_by_name = True

class NoteCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    visit_type: Literal["regular", "follow-up", "emergency"] = "regular"

class ClinicalNoteUpdate(BaseModel):
    content: str | None = None
    visit_type: Literal["regular", "follow-up", "emergency"] | None = None

class ClinicalNoteResponse(BaseModel):
    id: str
    patient_id: str
    user_id: str
    content: str
    visit_type: str
    created_at: datetime
    updated_at: datetime