from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional
from datetime import datetime
import re

class PatientBase(BaseModel):
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

    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('Name must not be empty')
        return v

    @validator('phone')
    def validate_phone_number(cls, v):
        if v and not re.match(r'^\+?1?\d{9,15}$', v):
            raise ValueError('Invalid phone number format.')
        return v

class PatientCreate(PatientBase):
    pass

class PatientUpdate(PatientBase):
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


class PatientResponse(PatientBase):
    id: str
    patient_id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True