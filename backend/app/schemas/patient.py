from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime, timezone
import uuid
from beanie import Document, Indexed
from pymongo import IndexModel

# Field length constants
MAX_NAME_LENGTH = 100
MAX_PHONE_LENGTH = 25
MAX_ADDRESS_LENGTH = 255
MAX_LOCATION_LENGTH = 100
MAX_COMPLAINT_LENGTH = 5000
MAX_DIAGNOSIS_LENGTH = 5000
MAX_GROUP_LENGTH = 50
MAX_SOURCE_LENGTH = 50
MAX_EXTERNAL_ID_LENGTH = 255
MAX_TREATMENT_PLAN_LENGTH = 5000

# Gender choices
GENDER_CHOICES = ["male", "female", "other"]


class PatientSource(str):
    """Valid sources for patient records."""
    MANUAL = "manual"
    GOOGLE_CONTACTS = "google_contacts"
    DEVICE_CONTACTS = "device_contacts"
    IMPORTED = "imported"


class Patient(Document):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    patient_id: str
    user_id: Indexed(str)
    name: str = Field(..., min_length=2, max_length=MAX_NAME_LENGTH)
    phone: Optional[str] = Field(default="", max_length=MAX_PHONE_LENGTH)
    email: Optional[EmailStr] = None
    address: Optional[str] = Field(default="", max_length=MAX_ADDRESS_LENGTH)
    location: Optional[str] = Field(default="", max_length=MAX_LOCATION_LENGTH)
    initial_complaint: Optional[str] = Field(default="", max_length=MAX_COMPLAINT_LENGTH)
    initial_diagnosis: Optional[str] = Field(default="", max_length=MAX_DIAGNOSIS_LENGTH)
    photo: Optional[str] = None
    group: Optional[str] = Field(default="general", max_length=MAX_GROUP_LENGTH)
    is_favorite: bool = False
    # New patient profile fields
    year_of_birth: Optional[int] = Field(default=None, ge=1900, le=2100)
    gender: Optional[str] = Field(default=None)
    active_treatment_plan: Optional[str] = Field(default="", max_length=MAX_TREATMENT_PLAN_LENGTH)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Source tracking for imports (Google Contacts sync)
    source: Optional[str] = Field(default="manual", max_length=MAX_SOURCE_LENGTH)
    external_id: Optional[str] = Field(default=None, max_length=MAX_EXTERNAL_ID_LENGTH)
    last_synced_at: Optional[datetime] = None
    sync_version: Optional[int] = Field(default=0)
    local_modified_at: Optional[datetime] = None

    class Settings:
        name = "patients"
        indexes = [
            IndexModel([("user_id", 1), ("patient_id", 1)], unique=True),
            IndexModel([("user_id", 1), ("created_at", -1)]),
            IndexModel([("user_id", 1), ("external_id", 1)]),
            IndexModel([("user_id", 1), ("source", 1)])
        ]

    class Config:
        populate_by_name = True

    async def save(self, *args, **kwargs):
        self.updated_at = datetime.now(timezone.utc)
        await super().save(*args, **kwargs)

class PatientCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=MAX_NAME_LENGTH)
    phone: Optional[str] = Field(default="", max_length=MAX_PHONE_LENGTH)
    email: Optional[EmailStr] = None
    address: Optional[str] = Field(default="", max_length=MAX_ADDRESS_LENGTH)
    location: Optional[str] = Field(default="", max_length=MAX_LOCATION_LENGTH)
    initial_complaint: Optional[str] = Field(default="", max_length=MAX_COMPLAINT_LENGTH)
    initial_diagnosis: Optional[str] = Field(default="", max_length=MAX_DIAGNOSIS_LENGTH)
    photo: Optional[str] = None
    group: Optional[str] = Field(default="general", max_length=MAX_GROUP_LENGTH)
    is_favorite: bool = False
    # New patient profile fields
    year_of_birth: Optional[int] = Field(default=None, ge=1900, le=2100)
    gender: Optional[str] = Field(default=None)
    active_treatment_plan: Optional[str] = Field(default="", max_length=MAX_TREATMENT_PLAN_LENGTH)
    # Source tracking (optional - defaults to manual if not specified)
    source: Optional[str] = Field(default="manual", max_length=MAX_SOURCE_LENGTH)
    external_id: Optional[str] = Field(default=None, max_length=MAX_EXTERNAL_ID_LENGTH)

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    location: Optional[str] = None
    initial_complaint: Optional[str] = None
    initial_diagnosis: Optional[str] = None
    photo: Optional[str] = None
    group: Optional[str] = None
    is_favorite: Optional[bool] = None
    year_of_birth: Optional[int] = None
    gender: Optional[str] = None
    active_treatment_plan: Optional[str] = None

class PatientResponse(BaseModel):
    id: str
    patient_id: str
    user_id: str
    name: str
    phone: Optional[str]
    email: Optional[EmailStr]
    address: Optional[str]
    location: Optional[str]
    initial_complaint: Optional[str]
    initial_diagnosis: Optional[str]
    photo: Optional[str]
    group: Optional[str]
    is_favorite: bool
    # New patient profile fields
    year_of_birth: Optional[int] = None
    gender: Optional[str] = None
    active_treatment_plan: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Source tracking fields
    source: Optional[str] = "manual"
    external_id: Optional[str] = None
    last_synced_at: Optional[datetime] = None
    sync_version: Optional[int] = 0
    local_modified_at: Optional[datetime] = None