from pydantic import BaseModel, EmailStr, Field, field_validator
import re


def validate_password_strength(password: str) -> str:
    """
    Validate password strength requirements:
    - Minimum 12 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    if len(password) < 12:
        raise ValueError("Password must be at least 12 characters long")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise ValueError("Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)")
    return password


class OTPVerifyRequest(BaseModel):
    """Request schema for OTP verification."""
    email: EmailStr
    otp_code: str = Field(..., min_length=8, max_length=8, description="8-digit OTP code")


class OTPResendRequest(BaseModel):
    """Request schema for resending OTP."""
    email: EmailStr


class PasswordResetRequest(BaseModel):
    """Request schema for initiating password reset."""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Request schema for confirming password reset."""
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=12, description="New password with strong requirements")

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return validate_password_strength(v)
