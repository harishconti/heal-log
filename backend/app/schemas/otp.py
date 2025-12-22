from pydantic import BaseModel, EmailStr, Field


class OTPVerifyRequest(BaseModel):
    """Request schema for OTP verification."""
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")


class OTPResendRequest(BaseModel):
    """Request schema for resending OTP."""
    email: EmailStr


class PasswordResetRequest(BaseModel):
    """Request schema for initiating password reset."""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Request schema for confirming password reset."""
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, description="New password (min 8 characters)")
