"""
Password Reset Service - Secure password reset token management.

SECURITY: Tokens are hashed before storage using SHA-256 to prevent
token theft from database compromise.
"""
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from app.schemas.user import User
from app.core.config import settings
from app.core.hashing import get_password_hash
from app.core.logger import get_logger
from app.services.email_service import email_service

logger = get_logger(__name__)


def _hash_token(token: str) -> str:
    """Hash a token using SHA-256 for secure storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def _ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Ensure datetime is timezone-aware UTC."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class PasswordResetService:
    """Handles password reset token generation and verification."""
    
    def generate_reset_token(self) -> str:
        """Generate a secure random token for password reset.

        Uses 18 bytes (144 bits of entropy) which produces a 24-character token.
        This is cryptographically secure (2^144 combinations) and more
        secure than a 6-digit OTP for password reset operations.
        """
        return secrets.token_urlsafe(18)  # 24 chars, 144 bits entropy
    
    async def create_and_send_reset_token(self, user: User) -> Tuple[bool, str]:
        """
        Generate reset token, save hashed version to user, and send plain version via email.

        SECURITY: Only the hash is stored in the database.

        Returns (success, message) tuple.
        """
        reset_token = self.generate_reset_token()
        token_hash = _hash_token(reset_token)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES)

        # Update user with HASHED reset token
        user.password_reset_token = token_hash
        user.password_reset_expires_at = expires_at
        await user.save()

        logger.info("password_reset_token_created", email=user.email, expires_at=expires_at.isoformat())

        # Send email with plain token (user needs this to reset)
        email_sent = await email_service.send_password_reset_email(
            email=user.email,
            reset_token=reset_token,  # Plain token sent to email
            full_name=user.full_name
        )

        if email_sent:
            return True, "Password reset email sent"
        else:
            return False, "Failed to send password reset email"
    
    async def verify_reset_token(self, token: str) -> Tuple[Optional[User], str]:
        """
        Verify a password reset token.

        SECURITY: Hashes the incoming token and compares against stored hash.

        Returns (user, message) tuple. User is None if token is invalid.
        """
        # Hash the incoming token to compare with stored hash
        token_hash = _hash_token(token)

        # Find user with this token hash
        user = await User.find_one({"password_reset_token": token_hash})

        if not user:
            return None, "Invalid or expired reset token"

        # Check expiry - normalize datetime
        expires_at = _ensure_utc(user.password_reset_expires_at)
        if not expires_at or datetime.now(timezone.utc) > expires_at:
            # Clear expired token
            user.password_reset_token = None
            user.password_reset_expires_at = None
            await user.save()
            return None, "Reset token has expired. Please request a new one."

        return user, "Token is valid"
    
    async def reset_password(self, user: User, new_password: str) -> Tuple[bool, str]:
        """
        Reset user's password and clear the reset token.
        
        Returns (success, message) tuple.
        """
        try:
            # Hash new password
            user.password_hash = get_password_hash(new_password)
            
            # Clear reset token
            user.password_reset_token = None
            user.password_reset_expires_at = None
            
            # Update timestamp
            user.updated_at = datetime.now(timezone.utc)
            
            await user.save()

            logger.info("password_reset_success", email=user.email)
            return True, "Password reset successfully"
        except Exception as e:
            logger.error("password_reset_failed", email=user.email, error=str(e))
            return False, "Failed to reset password"


# Singleton instance
password_reset_service = PasswordResetService()
