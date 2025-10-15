from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime, timedelta
import uuid
import re
from enum import Enum
from .role import UserRole

class UserPlan(str, Enum):
    BASIC = "basic"
    PRO = "pro"

class SubscriptionStatus(str, Enum):
    TRIALING = "trialing"
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due"

class UserBase(BaseModel):
    email: EmailStr
    phone: Optional[str] = Field(default="", max_length=25)
    full_name: str = Field(..., min_length=2, max_length=100)
    medical_specialty: Optional[str] = Field(default="general", max_length=100)

class UserCreate(UserBase):
    plan: UserPlan = UserPlan.BASIC
    role: UserRole = UserRole.PATIENT
    password: str = Field(
        ...,
        min_length=8,
        max_length=100,
        description="Password must be at least 8 characters long and contain at least one letter and one number."
    )

    @validator('password')
    def password_complexity(cls, v):
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('Password must contain at least one letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        return v

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=25)
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    medical_specialty: Optional[str] = Field(default=None, max_length=100)

class UserInDBBase(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    plan: UserPlan = UserPlan.BASIC
    role: UserRole = UserRole.PATIENT
    subscription_status: SubscriptionStatus = SubscriptionStatus.TRIALING
    subscription_end_date: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(days=90))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    password_hash: str

class UserLogin(BaseModel):
    username: EmailStr
    password: str