"""
Google OAuth Service for Google Contacts integration.

Handles OAuth flow with Google, including:
- Generating authorization URLs
- Exchanging authorization codes for tokens
- Refreshing access tokens
- Storing tokens in user documents
"""

import logging
import hashlib
import hmac
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from urllib.parse import urlencode

import httpx

from app.core.config import settings
from app.schemas.user import User, GoogleOAuthTokens
from app.services.user_service import get_user_by_id

logger = logging.getLogger(__name__)

# Google OAuth endpoints
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke"

# Required scopes for Google Contacts API
GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/contacts.readonly",
    "https://www.googleapis.com/auth/userinfo.email"
]


class GoogleOAuthService:
    """Service for handling Google OAuth flows."""

    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI
        self.deep_link_scheme = settings.MOBILE_DEEP_LINK_SCHEME
        self.callback_path = settings.MOBILE_CALLBACK_PATH

    def is_configured(self) -> bool:
        """Check if Google OAuth is properly configured."""
        return bool(self.client_id and self.client_secret and self.redirect_uri)

    def _generate_state_token(self, user_id: str) -> str:
        """
        Generate a secure state token for CSRF protection.
        The state includes the user_id and a random nonce, signed with HMAC.
        """
        nonce = secrets.token_urlsafe(16)
        data = f"{user_id}:{nonce}"
        signature = hmac.new(
            settings.SECRET_KEY.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()[:16]
        return f"{data}:{signature}"

    def _verify_state_token(self, state: str) -> Optional[str]:
        """
        Verify the state token and extract the user_id.
        Returns the user_id if valid, None otherwise.
        """
        try:
            parts = state.split(":")
            if len(parts) != 3:
                return None
            user_id, nonce, signature = parts
            data = f"{user_id}:{nonce}"
            expected_signature = hmac.new(
                settings.SECRET_KEY.encode(),
                data.encode(),
                hashlib.sha256
            ).hexdigest()[:16]
            if hmac.compare_digest(signature, expected_signature):
                return user_id
            return None
        except Exception as e:
            logger.error(f"Error verifying state token: {e}")
            return None

    def get_authorization_url(self, user_id: str) -> Tuple[str, str]:
        """
        Generate the Google OAuth authorization URL.

        Args:
            user_id: The ID of the user initiating the OAuth flow.

        Returns:
            Tuple of (authorization_url, state_token)
        """
        if not self.is_configured():
            raise ValueError("Google OAuth is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.")

        state = self._generate_state_token(user_id)

        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": " ".join(GOOGLE_SCOPES),
            "state": state,
            "access_type": "offline",  # Get refresh token
            "prompt": "consent",  # Force consent to get refresh token
        }

        auth_url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
        logger.info(f"Generated authorization URL for user {user_id}")
        return auth_url, state

    async def exchange_code_for_tokens(self, code: str, state: str) -> Tuple[Optional[GoogleOAuthTokens], Optional[str]]:
        """
        Exchange the authorization code for access and refresh tokens.

        Args:
            code: The authorization code from Google.
            state: The state token to verify.

        Returns:
            Tuple of (GoogleOAuthTokens, user_id) if successful, (None, None) otherwise.
        """
        user_id = self._verify_state_token(state)
        if not user_id:
            logger.warning("Invalid state token provided")
            return None, None

        if not self.is_configured():
            raise ValueError("Google OAuth is not configured")

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    GOOGLE_TOKEN_URL,
                    data={
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": self.redirect_uri,
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )

                if response.status_code != 200:
                    logger.error(f"Failed to exchange code: {response.status_code} - {response.text}")
                    return None, None

                data = response.json()

                # Calculate token expiration
                expires_in = data.get("expires_in", 3600)
                expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

                tokens = GoogleOAuthTokens(
                    access_token=data["access_token"],
                    refresh_token=data.get("refresh_token", ""),
                    token_type=data.get("token_type", "Bearer"),
                    expires_at=expires_at,
                    scope=data.get("scope", " ".join(GOOGLE_SCOPES)),
                    connected_at=datetime.now(timezone.utc)
                )

                logger.info(f"Successfully exchanged code for tokens for user {user_id}")
                return tokens, user_id

        except Exception as e:
            logger.error(f"Error exchanging code for tokens: {e}", exc_info=True)
            return None, None

    async def refresh_access_token(self, user: User) -> Optional[GoogleOAuthTokens]:
        """
        Refresh the access token using the refresh token.

        Args:
            user: The user whose tokens need refreshing.

        Returns:
            Updated GoogleOAuthTokens if successful, None otherwise.
        """
        if not user.google_oauth_tokens or not user.google_oauth_tokens.refresh_token:
            logger.warning(f"No refresh token available for user {user.id}")
            return None

        if not self.is_configured():
            raise ValueError("Google OAuth is not configured")

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    GOOGLE_TOKEN_URL,
                    data={
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "refresh_token": user.google_oauth_tokens.refresh_token,
                        "grant_type": "refresh_token",
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )

                if response.status_code != 200:
                    logger.error(f"Failed to refresh token: {response.status_code} - {response.text}")
                    return None

                data = response.json()

                # Calculate token expiration
                expires_in = data.get("expires_in", 3600)
                expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

                # Update tokens (keep the original refresh_token if not provided)
                tokens = GoogleOAuthTokens(
                    access_token=data["access_token"],
                    refresh_token=data.get("refresh_token", user.google_oauth_tokens.refresh_token),
                    token_type=data.get("token_type", "Bearer"),
                    expires_at=expires_at,
                    scope=data.get("scope", user.google_oauth_tokens.scope),
                    connected_at=user.google_oauth_tokens.connected_at
                )

                logger.info(f"Successfully refreshed access token for user {user.id}")
                return tokens

        except Exception as e:
            logger.error(f"Error refreshing access token: {e}", exc_info=True)
            return None

    async def get_valid_access_token(self, user: User) -> Optional[str]:
        """
        Get a valid access token, refreshing if necessary.

        Args:
            user: The user whose access token is needed.

        Returns:
            Valid access token if available, None otherwise.
        """
        if not user.google_oauth_tokens:
            return None

        # Check if token is expired or will expire in the next 5 minutes
        buffer = timedelta(minutes=5)
        if user.google_oauth_tokens.expires_at <= datetime.now(timezone.utc) + buffer:
            # Refresh the token
            new_tokens = await self.refresh_access_token(user)
            if new_tokens:
                user.google_oauth_tokens = new_tokens
                await user.save()
                return new_tokens.access_token
            return None

        return user.google_oauth_tokens.access_token

    async def save_tokens_to_user(self, user_id: str, tokens: GoogleOAuthTokens) -> bool:
        """
        Save OAuth tokens to a user document.

        Args:
            user_id: The user ID.
            tokens: The tokens to save.

        Returns:
            True if successful, False otherwise.
        """
        try:
            user = await get_user_by_id(user_id)
            if not user:
                logger.error(f"User not found: {user_id}")
                return False

            user.google_oauth_tokens = tokens
            await user.save()
            logger.info(f"Saved Google OAuth tokens for user {user_id}")
            return True

        except Exception as e:
            logger.error(f"Error saving tokens to user: {e}", exc_info=True)
            return False

    async def disconnect(self, user: User) -> bool:
        """
        Disconnect Google account by revoking tokens and removing from user.

        Args:
            user: The user to disconnect.

        Returns:
            True if successful, False otherwise.
        """
        try:
            # Revoke the token with Google (optional, may fail if token is already invalid)
            if user.google_oauth_tokens:
                try:
                    async with httpx.AsyncClient() as client:
                        await client.post(
                            GOOGLE_REVOKE_URL,
                            data={"token": user.google_oauth_tokens.access_token},
                            headers={"Content-Type": "application/x-www-form-urlencoded"},
                        )
                except Exception as revoke_error:
                    logger.warning(f"Could not revoke Google token (may already be invalid): {revoke_error}")

            # Remove tokens from user
            user.google_oauth_tokens = None
            await user.save()
            logger.info(f"Disconnected Google account for user {user.id}")
            return True

        except Exception as e:
            logger.error(f"Error disconnecting Google account: {e}", exc_info=True)
            return False

    def get_mobile_callback_url(self, code: str, state: str) -> str:
        """
        Generate the mobile deep link callback URL.

        Args:
            code: The authorization code.
            state: The state token.

        Returns:
            The deep link URL for the mobile app.
        """
        params = urlencode({"code": code, "state": state})
        return f"{self.deep_link_scheme}://{self.callback_path}?{params}"


# Create a singleton instance
google_oauth_service = GoogleOAuthService()
