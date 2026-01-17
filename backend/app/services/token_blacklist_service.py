"""
Token Blacklist Service

Provides token revocation functionality using Redis for persistence across restarts
and distributed deployments. Falls back to in-memory cache if Redis is unavailable.

Usage:
    - Call `blacklist_token(jti, exp)` on logout or password change
    - Call `is_token_blacklisted(jti)` in authentication middleware
"""
from datetime import datetime, timezone
from typing import Dict, Optional
import asyncio
from redis import asyncio as aioredis

from app.core.logger import get_logger
from app.core.config import settings

logger = get_logger(__name__)


class TokenBlacklistService:
    """
    Token blacklist with Redis backend for persistence and distributed deployments.
    Falls back to in-memory storage if Redis is unavailable.

    Async-safe implementation using asyncio.Lock for concurrent access.
    Entries are automatically removed when their corresponding token expires.
    """

    def __init__(self):
        self._redis: Optional[aioredis.Redis] = None
        self._blacklist: Dict[str, datetime] = {}  # In-memory fallback
        self._lock = asyncio.Lock()
        self._prefix = "token_blacklist:"
        self._user_invalidation_prefix = "user_invalidated:"
        self._redis_available = False

    async def initialize(self):
        """
        Initialize Redis connection. Should be called at application startup.
        Falls back to in-memory storage if Redis is not available.
        """
        if settings.REDIS_URL:
            try:
                self._redis = aioredis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True
                )
                # Test connection
                await self._redis.ping()
                self._redis_available = True
                logger.info("redis_token_blacklist_initialized", redis_url=settings.REDIS_URL.split('@')[-1])
            except Exception as e:
                logger.warning("redis_connection_failed_fallback_to_memory", error=str(e))
                self._redis_available = False
        else:
            logger.info("redis_not_configured_using_memory_blacklist")

    async def blacklist_token(self, jti: str, exp: Optional[datetime] = None) -> None:
        """
        Add a token to the blacklist.

        Args:
            jti: The JWT ID (unique identifier) from the token
            exp: Token expiration time. If None, token is blacklisted indefinitely
        """
        if self._redis_available and self._redis:
            try:
                # Calculate TTL in seconds
                if exp:
                    ttl = int((exp - datetime.now(timezone.utc)).total_seconds())
                    if ttl > 0:
                        await self._redis.setex(f"{self._prefix}{jti}", ttl, "1")
                        logger.info("token_blacklisted_redis", token_jti=jti, ttl=ttl)
                else:
                    # No expiration - set with very long TTL (10 years)
                    await self._redis.setex(f"{self._prefix}{jti}", 315360000, "1")
                    logger.info("token_blacklisted_redis_indefinite", token_jti=jti)
            except Exception as e:
                logger.error("redis_blacklist_failed_fallback", error=str(e))
                self._redis_available = False
                # Fall through to in-memory

        # In-memory fallback
        if not self._redis_available:
            async with self._lock:
                await self._cleanup_expired()
                self._blacklist[jti] = exp or datetime.max.replace(tzinfo=timezone.utc)
                logger.info("token_blacklisted_memory", token_jti=jti)

    async def blacklist_user_tokens(self, user_id: str, issued_before: datetime) -> None:
        """
        Invalidate all tokens for a user issued before a certain time.
        This is useful for password changes where we want to invalidate all
        existing sessions.

        Stores a marker that all tokens for this user issued before
        this timestamp should be considered invalid.
        """
        marker_key = f"{self._user_invalidation_prefix}{user_id}"
        timestamp_str = issued_before.isoformat()

        if self._redis_available and self._redis:
            try:
                # Store with 7 days TTL (longer than typical token lifetime)
                await self._redis.setex(marker_key, 604800, timestamp_str)
                logger.info("user_tokens_invalidated_redis", user_id=user_id, issued_before=timestamp_str)
            except Exception as e:
                logger.error("redis_user_invalidation_failed_fallback", error=str(e))
                self._redis_available = False

        # In-memory fallback
        if not self._redis_available:
            async with self._lock:
                self._blacklist[marker_key] = issued_before
                logger.info("user_tokens_invalidated_memory", user_id=user_id, issued_before=timestamp_str)

    async def is_token_blacklisted(self, jti: str, user_id: Optional[str] = None,
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
        if self._redis_available and self._redis:
            try:
                # Check direct blacklist
                exists = await self._redis.exists(f"{self._prefix}{jti}")
                if exists:
                    return True

                # Check user-level invalidation
                if user_id and issued_at:
                    marker_key = f"{self._user_invalidation_prefix}{user_id}"
                    timestamp_str = await self._redis.get(marker_key)
                    if timestamp_str:
                        invalidated_before = datetime.fromisoformat(timestamp_str)
                        if issued_at < invalidated_before:
                            return True

                return False
            except Exception as e:
                logger.error("redis_check_failed_fallback", error=str(e))
                self._redis_available = False

        # In-memory fallback
        async with self._lock:
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
                marker_key = f"{self._user_invalidation_prefix}{user_id}"
                if marker_key in self._blacklist:
                    invalidated_before = self._blacklist[marker_key]
                    if issued_at < invalidated_before:
                        return True

            return False

    async def _cleanup_expired(self) -> None:
        """Remove expired entries from the in-memory blacklist. Redis handles TTL automatically."""
        now = datetime.now(timezone.utc)
        expired_keys = [
            key for key, exp in self._blacklist.items()
            if not key.startswith(self._user_invalidation_prefix) and exp <= now
        ]
        for key in expired_keys:
            del self._blacklist[key]

        if expired_keys:
            logger.debug("blacklist_cleanup", expired_count=len(expired_keys))

    async def clear(self) -> None:
        """Clear all blacklisted tokens. Use with caution."""
        if self._redis_available and self._redis:
            try:
                # Clear all tokens matching our prefix
                cursor = 0
                while True:
                    cursor, keys = await self._redis.scan(cursor, match=f"{self._prefix}*", count=100)
                    if keys:
                        await self._redis.delete(*keys)
                    if cursor == 0:
                        break
                logger.warning("blacklist_cleared_redis")
            except Exception as e:
                logger.error("redis_clear_failed", error=str(e))

        # Clear in-memory storage
        async with self._lock:
            self._blacklist.clear()
            logger.warning("blacklist_cleared_memory")


# Singleton instance
token_blacklist = TokenBlacklistService()
