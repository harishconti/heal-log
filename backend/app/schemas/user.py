from pydantic import BaseModel, EmailStr, Field, BeforeValidator, field_validator
from typing import Optional, Annotated, List
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


class GoogleOAuthTokens(BaseModel):
    """Stores Google OAuth tokens for Google Contacts integration."""
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_at: datetime
    scope: str
    connected_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class User(Document):
    id: PyObjectId = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    email: Indexed(EmailStr, unique=True)
    phone: Optional[str] = Field(default="", max_length=25)
    full_name: str = Field(..., min_length=2, max_length=100)
    medical_specialty: Optional[str] = Field(default="general", max_length=100)
    password_hash: Optional[str] = None
    plan: UserPlan = UserPlan.BASIC
    role: UserRole = UserRole.DOCTOR
    subscription_status: SubscriptionStatus = SubscriptionStatus.TRIALING
    subscription_end_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=90))
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_beta_tester: bool = False
    
    # Email verification fields
    is_verified: bool = False
    otp_code: Optional[str] = None
    otp_expires_at: Optional[datetime] = None
    otp_attempts: int = 0
    
    # Password reset fields
    password_reset_token: Optional[str] = None
    password_reset_expires_at: Optional[datetime] = None

    # Profile photo (base64 encoded)
    profile_photo: Optional[str] = None

    # Google OAuth Integration
    google_oauth_tokens: Optional[GoogleOAuthTokens] = None

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
    profile_photo: Optional[str] = Field(default=None)  # Base64 encoded image

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
    is_verified: bool = False
    profile_photo: Optional[str] = None
    google_contacts_connected: bool = False
    google_contacts_connected_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_user(cls, user: "User") -> "UserResponse":
        """Create UserResponse from User model with computed google_contacts_connected."""
        return cls(
            id=user.id,
            email=user.email,
            phone=user.phone,
            full_name=user.full_name,
            medical_specialty=user.medical_specialty,
            plan=user.plan,
            role=user.role,
            subscription_status=user.subscription_status,
            subscription_end_date=user.subscription_end_date,
            is_verified=user.is_verified,
            profile_photo=user.profile_photo,
            google_contacts_connected=user.google_oauth_tokens is not None,
            google_contacts_connected_at=user.google_oauth_tokens.connected_at if user.google_oauth_tokens else None
        )

class UserLogin(BaseModel):
    username: EmailStr
    password: str

class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=12)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        """Validate password strength requirements."""
        import re
        if len(v) < 12:
            raise ValueError("Password must be at least 12 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character")
        return v