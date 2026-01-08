"""
Account Lockout Service - Protect against brute force login attacks.

Implements account lockout after multiple failed login attempts using
an in-memory cache with automatic cleanup. For production with multiple
instances, replace with Redis.
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
import threading

logger = logging.getLogger(__name__)

# Configuration
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15
ATTEMPT_WINDOW_MINUTES = 15  # Track attempts within this window


class AccountLockoutService:
    """
    Tracks failed login attempts and enforces account lockout.

    Thread-safe implementation using a lock for concurrent access.
    """

    def __init__(self):
        # Structure: {email: {'attempts': int, 'first_attempt': datetime, 'locked_until': datetime | None}}
        self._attempts: dict = {}
        self._lock = threading.Lock()

    def record_failed_attempt(self, email: str) -> Tuple[bool, Optional[int]]:
        """
        Record a failed login attempt.

        Returns:
            Tuple of (is_locked, seconds_until_unlock or attempts_remaining)
            - If locked: (True, seconds_until_unlock)
            - If not locked: (False, attempts_remaining)
        """
        email_lower = email.lower().strip()
        now = datetime.now(timezone.utc)

        with self._lock:
            self._cleanup_expired()

            if email_lower not in self._attempts:
                self._attempts[email_lower] = {
                    'attempts': 1,
                    'first_attempt': now,
                    'locked_until': None
                }
                remaining = MAX_FAILED_ATTEMPTS - 1
                logger.info(f"[LOCKOUT] First failed attempt for {email_lower[:3]}***")
                return False, remaining

            record = self._attempts[email_lower]

            # Check if currently locked
            if record['locked_until'] and now < record['locked_until']:
                seconds_remaining = int((record['locked_until'] - now).total_seconds())
                logger.warning(f"[LOCKOUT] Login attempt while locked: {email_lower[:3]}***")
                return True, seconds_remaining

            # Check if window has expired, reset if so
            window_expires = record['first_attempt'] + timedelta(minutes=ATTEMPT_WINDOW_MINUTES)
            if now > window_expires:
                record['attempts'] = 1
                record['first_attempt'] = now
                record['locked_until'] = None
                remaining = MAX_FAILED_ATTEMPTS - 1
                return False, remaining

            # Increment attempts
            record['attempts'] += 1
            record['locked_until'] = None  # Clear any expired lock

            if record['attempts'] >= MAX_FAILED_ATTEMPTS:
                # Lock the account
                record['locked_until'] = now + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
                seconds_remaining = LOCKOUT_DURATION_MINUTES * 60
                logger.warning(
                    f"[LOCKOUT] Account locked due to {record['attempts']} failed attempts: "
                    f"{email_lower[:3]}*** for {LOCKOUT_DURATION_MINUTES} minutes"
                )
                return True, seconds_remaining

            remaining = MAX_FAILED_ATTEMPTS - record['attempts']
            logger.info(
                f"[LOCKOUT] Failed attempt {record['attempts']}/{MAX_FAILED_ATTEMPTS} "
                f"for {email_lower[:3]}***"
            )
            return False, remaining

    def is_locked(self, email: str) -> Tuple[bool, Optional[int]]:
        """
        Check if an account is locked.

        Returns:
            Tuple of (is_locked, seconds_until_unlock if locked else None)
        """
        email_lower = email.lower().strip()
        now = datetime.now(timezone.utc)

        with self._lock:
            if email_lower not in self._attempts:
                return False, None

            record = self._attempts[email_lower]
            if record['locked_until'] and now < record['locked_until']:
                seconds_remaining = int((record['locked_until'] - now).total_seconds())
                return True, seconds_remaining

            return False, None

    def clear_attempts(self, email: str) -> None:
        """
        Clear failed attempts after successful login.
        """
        email_lower = email.lower().strip()

        with self._lock:
            if email_lower in self._attempts:
                del self._attempts[email_lower]
                logger.info(f"[LOCKOUT] Cleared attempts for {email_lower[:3]}***")

    def _cleanup_expired(self) -> None:
        """Remove expired entries to prevent memory bloat."""
        now = datetime.now(timezone.utc)
        expired_keys = []

        for email, record in self._attempts.items():
            # Remove if: no lock and window expired, or lock has expired
            window_expired = (
                record['locked_until'] is None and
                now > record['first_attempt'] + timedelta(minutes=ATTEMPT_WINDOW_MINUTES * 2)
            )
            lock_expired = (
                record['locked_until'] is not None and
                now > record['locked_until'] + timedelta(minutes=ATTEMPT_WINDOW_MINUTES)
            )

            if window_expired or lock_expired:
                expired_keys.append(email)

        for key in expired_keys:
            del self._attempts[key]

        if expired_keys:
            logger.debug(f"[LOCKOUT] Cleaned up {len(expired_keys)} expired entries")


# Singleton instance
account_lockout = AccountLockoutService()
