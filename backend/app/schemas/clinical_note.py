from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Literal

class ClinicalNoteBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000, description="The content of the clinical note.")
    visit_type: Literal["regular", "follow-up", "emergency"] = "regular"

    @validator('content')
    def content_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('Content must not be empty')
        return v

class NoteCreate(ClinicalNoteBase):
    pass

class ClinicalNoteCreate(ClinicalNoteBase):
    patient_id: str

class ClinicalNoteUpdate(BaseModel):
    content: str | None = None
    visit_type: Literal["regular", "follow-up", "emergency"] | None = None


class ClinicalNoteResponse(ClinicalNoteBase):
    id: str
    patient_id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True