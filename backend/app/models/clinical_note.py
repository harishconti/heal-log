from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime, timezone
import uuid

from app.schemas.clinical_note import ClinicalNoteResponse

class ClinicalNote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    user_id: str
    content: str
    visit_type: Literal["regular", "follow-up", "emergency"] = "regular"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def to_response(self) -> ClinicalNoteResponse:
        return ClinicalNoteResponse(
            id=self.id,
            patient_id=self.patient_id,
            user_id=self.user_id,
            content=self.content,
            visit_type=self.visit_type,
            created_at=self.created_at,
            updated_at=self.updated_at
        )