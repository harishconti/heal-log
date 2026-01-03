"""
OTP Service - Generate, store, and verify one-time passwords.
"""
import secrets
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from app.schemas.user import User
from app.core.config import settings
from app.services.email_service import email_service

logger = logging.getLogger(__name__)


def _ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Ensure datetime is timezone-aware UTC."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class OTPService:
    """Handles OTP generation, storage, and verification."""
    
    def generate_otp(self) -> str:
        """Generate an 8-digit OTP."""
        return ''.join([str(secrets.randbelow(10)) for _ in range(8)])
    
    async def create_and_send_otp(self, user: User) -> Tuple[bool, str]:
        """
        Generate OTP, save to user, and send via email.
        
        Returns (success, message) tuple.
        """
        otp_code = self.generate_otp()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
        
        # Update user with OTP
        user.otp_code = otp_code
        user.otp_expires_at = expires_at
        user.otp_attempts = 0
        await user.save()
        
        logger.info(f"[OTP_SERVICE] OTP created for user {user.email}, expires at {expires_at}")
        
        # Send email
        email_sent = await email_service.send_otp_email(
            email=user.email,
            otp_code=otp_code,
            full_name=user.full_name
        )
        
        if email_sent:
            return True, "OTP sent successfully"
        else:
            return False, "Failed to send OTP email"
    
    async def verify_otp(self, user: User, otp_code: str) -> Tuple[bool, str]:
        """
        Verify the OTP for a user.
        
        Returns (success, message) tuple.
        """
        # Check if OTP exists
        if not user.otp_code or not user.otp_expires_at:
            return False, "No OTP found. Please request a new one."
        
        # Check attempt limit
        if user.otp_attempts >= settings.OTP_MAX_ATTEMPTS:
            return False, "Maximum attempts exceeded. Please request a new OTP."
        
        # Increment attempts
        user.otp_attempts += 1
        await user.save()
        
        # Check expiry - normalize both datetimes to UTC
        now = datetime.now(timezone.utc)
        expires_at = _ensure_utc(user.otp_expires_at)
        if now > expires_at:
            return False, "OTP has expired. Please request a new one."
        
        # Verify code using constant-time comparison to prevent timing attacks
        if not secrets.compare_digest(user.otp_code, otp_code):
            remaining = settings.OTP_MAX_ATTEMPTS - user.otp_attempts
            return False, f"Invalid OTP. {remaining} attempts remaining."
        
        # Success - clear OTP and mark verified
        user.is_verified = True
        user.otp_code = None
        user.otp_expires_at = None
        user.otp_attempts = 0
        await user.save()
        
        logger.info(f"[OTP_SERVICE] User {user.email} verified successfully")
        return True, "Email verified successfully"
    
    def can_resend_otp(self, user: User) -> Tuple[bool, int]:
        """
        Check if OTP can be resent (cooldown check).
        
        Returns (can_resend, seconds_remaining) tuple.
        """
        if not user.otp_expires_at:
            return True, 0
        
        # Calculate when OTP was created - normalize datetime
        expires_at = _ensure_utc(user.otp_expires_at)
        otp_created_at = expires_at - timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
        cooldown_end = otp_created_at + timedelta(seconds=settings.OTP_RESEND_COOLDOWN_SECONDS)
        
        now = datetime.now(timezone.utc)
        if now >= cooldown_end:
            return True, 0
        
        seconds_remaining = int((cooldown_end - now).total_seconds())
        return False, seconds_remaining


# Singleton instance
otp_service = OTPService()
