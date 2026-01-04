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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "patients"
        indexes = [
            IndexModel([("user_id", 1), ("patient_id", 1)], unique=True),
            IndexModel([("user_id", 1), ("created_at", -1)])
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
    created_at: datetime
    updated_at: datetime