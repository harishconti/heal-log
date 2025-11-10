from pydantic import BaseModel, EmailStr, Field, BeforeValidator
from typing import Optional, Annotated
from datetime import datetime, timedelta, timezone
import uuid
from enum import Enum
from beanie import Document, Indexed
from .role import UserRole

PyObjectId = Annotated[str, BeforeValidator(str)]

class UserPlan(str, Enum):
    BASIC = "basic"
    PRO = "pro"

class SubscriptionStatus(str, Enum):
    TRIALING = "trialing"
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due"

class User(Document):
    id: PyObjectId = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    email: Indexed(EmailStr, unique=True)
    phone: Optional[str] = Field(default="", max_length=25)
    full_name: str = Field(..., min_length=2, max_length=100)
    medical_specialty: Optional[str] = Field(default="general", max_length=100)
    password_hash: str
    plan: UserPlan = UserPlan.BASIC
    role: UserRole = UserRole.DOCTOR
    subscription_status: SubscriptionStatus = SubscriptionStatus.TRIALING
    subscription_end_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=90))
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"

class UserCreate(BaseModel):
    email: EmailStr
    phone: Optional[str] = Field(default="", max_length=25)
    full_name: str = Field(..., min_length=2, max_length=100)
    medical_specialty: Optional[str] = Field(default="general", max_length=100)
    password: str

class UserUpdate(BaseModel):
    phone: Optional[str] = Field(default=None, max_length=25)
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    medical_specialty: Optional[str] = Field(default=None, max_length=100)

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    phone: Optional[str]
    full_name: str
    medical_specialty: Optional[str]
    plan: UserPlan
    role: UserRole
    subscription_status: SubscriptionStatus
    subscription_end_date: datetime

class UserLogin(BaseModel):
    username: EmailStr
    password: str