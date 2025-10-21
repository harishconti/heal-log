from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import uuid
from bson import ObjectId

from app.schemas.patient import PatientResponse

class Patient(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    user_id: str
    name: str
    phone: Optional[str] = ""
    email: Optional[str] = ""
    address: Optional[str] = ""
    location: Optional[str] = ""
    initial_complaint: Optional[str] = ""
    initial_diagnosis: Optional[str] = ""
    photo: Optional[str] = ""
    group: Optional[str] = "general"
    is_favorite: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def to_response(self) -> PatientResponse:
        return PatientResponse(
            id=self.id,
            patient_id=self.patient_id,
            user_id=self.user_id,
            name=self.name,
            phone=self.phone,
            email=self.email,
            address=self.address,
            location=self.location,
            initial_complaint=self.initial_complaint,
            initial_diagnosis=self.initial_diagnosis,
            photo=self.photo,
            group=self.group,
            is_favorite=self.is_favorite,
            created_at=self.created_at,
            updated_at=self.updated_at
        )