"""
OTP Service - Generate, store, and verify one-time passwords.

SECURITY:
- OTP codes are hashed using SHA-256 before storage
- Atomic increment is used to prevent race condition bypasses
"""
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from app.schemas.user import User
from app.core.config import settings
from app.core.logger import get_logger
from app.services.email_service import email_service

logger = get_logger(__name__)


def _hash_otp(otp_code: str) -> str:
    """Hash an OTP code using SHA-256 for secure storage."""
    return hashlib.sha256(otp_code.encode()).hexdigest()


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
        """Generate a 6-digit OTP."""
        return ''.join([str(secrets.randbelow(10)) for _ in range(6)])
    
    async def create_and_send_otp(self, user: User) -> Tuple[bool, str]:
        """
        Generate OTP, save hashed version to user, and send plain version via email.

        SECURITY: Only the hash is stored in the database.

        Returns (success, message) tuple.
        """
        otp_code = self.generate_otp()
        otp_hash = _hash_otp(otp_code)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

        # Update user with HASHED OTP
        user.otp_code = otp_hash
        user.otp_expires_at = expires_at
        user.otp_attempts = 0
        await user.save()

        logger.info("otp_created", email=user.email, expires_at=expires_at.isoformat())

        # Send email with plain OTP (user needs this to verify)
        email_sent = await email_service.send_otp_email(
            email=user.email,
            otp_code=otp_code,  # Plain OTP sent to email
            full_name=user.full_name
        )

        if email_sent:
            return True, "OTP sent successfully"
        else:
            return False, "Failed to send OTP email"
    
    async def verify_otp(self, user: User, otp_code: str) -> Tuple[bool, str]:
        """
        Verify the OTP for a user.

        SECURITY:
        - Hashes incoming OTP and compares against stored hash
        - Uses atomic increment to prevent race condition bypass

        Returns (success, message) tuple.
        """
        # Check if OTP exists
        if not user.otp_code or not user.otp_expires_at:
            return False, "No OTP found. Please request a new one."

        # Check attempt limit BEFORE incrementing
        if user.otp_attempts >= settings.OTP_MAX_ATTEMPTS:
            return False, "Maximum attempts exceeded. Please request a new OTP."

        # Atomic increment using MongoDB's $inc operator to prevent race conditions
        # This ensures that even if multiple requests come in simultaneously,
        # the attempt counter is incremented atomically
        result = await User.find_one(
            {"_id": user.id, "otp_attempts": {"$lt": settings.OTP_MAX_ATTEMPTS}}
        ).update({"$inc": {"otp_attempts": 1}})

        # If no document was updated, another request already maxed out attempts
        if not result or result.modified_count == 0:
            return False, "Maximum attempts exceeded. Please request a new OTP."

        # Reload user to get updated attempt count
        user = await User.get(user.id)
        if not user:
            return False, "User not found"

        # Check expiry - normalize both datetimes to UTC
        now = datetime.now(timezone.utc)
        expires_at = _ensure_utc(user.otp_expires_at)
        if now > expires_at:
            return False, "OTP has expired. Please request a new one."

        # Hash incoming OTP and compare using constant-time comparison
        otp_hash = _hash_otp(otp_code)
        if not secrets.compare_digest(user.otp_code, otp_hash):
            remaining = settings.OTP_MAX_ATTEMPTS - user.otp_attempts
            return False, f"Invalid OTP. {remaining} attempts remaining."

        # Success - clear OTP and mark verified
        user.is_verified = True
        user.otp_code = None
        user.otp_expires_at = None
        user.otp_attempts = 0
        await user.save()

        logger.info("otp_verified", email=user.email)
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
