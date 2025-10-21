from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime, timezone
import uuid
from beanie import Document, Indexed
from pymongo import IndexModel

class Patient(Document):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    patient_id: str
    user_id: Indexed(str)
    name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = Field(default="", max_length=25)
    email: Optional[EmailStr] = None
    address: Optional[str] = Field(default="", max_length=255)
    location: Optional[str] = Field(default="", max_length=100)
    initial_complaint: Optional[str] = Field(default="", max_length=5000)
    initial_diagnosis: Optional[str] = Field(default="", max_length=5000)
    photo: Optional[str] = None
    group: Optional[str] = Field(default="general", max_length=50)
    is_favorite: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "patients"
        indexes = [
            IndexModel([("user_id", 1), ("patient_id", 1)], unique=True),
            [("user_id", 1), ("created_at", -1)]
        ]

    class Config:
        populate_by_name = True

class PatientCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = Field(default="", max_length=25)
    email: Optional[EmailStr] = None
    address: Optional[str] = Field(default="", max_length=255)
    location: Optional[str] = Field(default="", max_length=100)
    initial_complaint: Optional[str] = Field(default="", max_length=5000)
    initial_diagnosis: Optional[str] = Field(default="", max_length=5000)
    photo: Optional[str] = None
    group: Optional[str] = Field(default="general", max_length=50)
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