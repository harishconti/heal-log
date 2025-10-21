from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime, timedelta, timezone
import uuid
from bson import ObjectId
from app.schemas.user import UserPlan, SubscriptionStatus
from app.schemas.role import UserRole

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    phone: Optional[str] = ""
    full_name: str
    medical_specialty: Optional[str] = "general"
    plan: UserPlan = UserPlan.BASIC
    role: UserRole = UserRole.DOCTOR
    subscription_status: SubscriptionStatus = SubscriptionStatus.TRIALING
    subscription_end_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=90))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    password_hash: Optional[str] = None