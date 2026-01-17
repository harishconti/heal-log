"""
Token Blacklist Service

Provides token revocation functionality using an in-memory cache with TTL.
For production use, consider replacing with Redis for persistence across restarts
and distributed deployments.

Usage:
    - Call `blacklist_token(jti, exp)` on logout or password change
    - Call `is_token_blacklisted(jti)` in authentication middleware
"""
from datetime import datetime, timezone
from typing import Dict, Optional
import threading

from app.core.logger import get_logger

logger = get_logger(__name__)


class TokenBlacklistService:
    """
    In-memory token blacklist with automatic cleanup of expired entries.

    Thread-safe implementation using a lock for concurrent access.
    Entries are automatically removed when their corresponding token expires.
    """

    def __init__(self):
        self._blacklist: Dict[str, datetime] = {}
        self._lock = threading.Lock()

    def blacklist_token(self, jti: str, exp: Optional[datetime] = None) -> None:
        """
        Add a token to the blacklist.

        Args:
            jti: The JWT ID (unique identifier) from the token
            exp: Token expiration time. If None, token is blacklisted indefinitely
        """
        with self._lock:
            # Clean up expired entries periodically
            self._cleanup_expired()

            # Add to blacklist with expiration
            self._blacklist[jti] = exp or datetime.max.replace(tzinfo=timezone.utc)
            logger.info("token_blacklisted", token_jti=jti)

    def blacklist_user_tokens(self, user_id: str, issued_before: datetime) -> None:
        """
        Invalidate all tokens for a user issued before a certain time.
        This is useful for password changes where we want to invalidate all
        existing sessions.

        Note: This requires storing user_id -> issued_before mapping.
        For this implementation, we track it in memory but in production
        this should be stored in a database.
        """
        with self._lock:
            # Store a marker that all tokens for this user issued before
            # this timestamp should be considered invalid
            marker_key = f"user_invalidated:{user_id}"
            self._blacklist[marker_key] = issued_before
            logger.info("user_tokens_invalidated", user_id=user_id, issued_before=issued_before.isoformat())

    def is_token_blacklisted(self, jti: str, user_id: Optional[str] = None,
                              issued_at: Optional[datetime] = None) -> bool:
        """
        Check if a token is blacklisted.

        Args:
            jti: The JWT ID to check
            user_id: Optional user ID for user-level invalidation check
            issued_at: Optional token issued_at time for user-level invalidation

        Returns:
            True if the token should be rejected, False otherwise
        """
        with self._lock:
            # Check direct blacklist
            if jti in self._blacklist:
                exp = self._blacklist[jti]
                if exp > datetime.now(timezone.utc):
                    return True
                else:
                    # Token has expired, remove from blacklist
                    del self._blacklist[jti]

            # Check user-level invalidation
            if user_id and issued_at:
                marker_key = f"user_invalidated:{user_id}"
                if marker_key in self._blacklist:
                    invalidated_before = self._blacklist[marker_key]
                    if issued_at < invalidated_before:
                        return True

            return False

    def _cleanup_expired(self) -> None:
        """Remove expired entries from the blacklist."""
        now = datetime.now(timezone.utc)
        expired_keys = [
            key for key, exp in self._blacklist.items()
            if not key.startswith("user_invalidated:") and exp <= now
        ]
        for key in expired_keys:
            del self._blacklist[key]

        if expired_keys:
            logger.debug("blacklist_cleanup", expired_count=len(expired_keys))

    def clear(self) -> None:
        """Clear all blacklisted tokens. Use with caution."""
        with self._lock:
            self._blacklist.clear()
            logger.warning("blacklist_cleared")


# Singleton instance
token_blacklist = TokenBlacklistService()
