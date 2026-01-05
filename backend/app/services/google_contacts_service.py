"""
Google Contacts Service for fetching contacts from Google People API.

Handles:
- Fetching contacts with pagination
- Handling sync tokens for incremental sync
- Rate limiting and error handling
- Contact normalization to internal format
"""

import logging
import asyncio
import re
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass

import httpx

from app.schemas.user import User
from app.services.google_oauth_service import google_oauth_service

logger = logging.getLogger(__name__)

# Google People API endpoint
GOOGLE_PEOPLE_API_URL = "https://people.googleapis.com/v1/people/me/connections"

# Fields to request from Google People API
PERSON_FIELDS = [
    "names",
    "phoneNumbers",
    "emailAddresses",
    "addresses",
    "photos",
    "metadata"
]

# Page size for API requests
PAGE_SIZE = 100


@dataclass
class NormalizedContact:
    """Normalized contact data from Google."""
    resource_name: str  # Google's unique identifier (e.g., "people/c12345")
    name: str
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    photo_url: Optional[str]
    raw_data: Dict[str, Any]


class GoogleContactsService:
    """Service for fetching contacts from Google People API."""

    def __init__(self):
        self._http_client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(timeout=30.0)
        return self._http_client

    async def close(self):
        """Close HTTP client."""
        if self._http_client and not self._http_client.is_closed:
            await self._http_client.aclose()

    def normalize_phone(self, phone_str: str) -> str:
        """
        Normalize phone number to a consistent format.

        Strategy:
        1. Strip all non-digit characters except leading +
        2. If starts with +, keep as-is
        3. If 10 digits and starts with 6-9, assume India (+91)
        4. If 10 digits and starts with other, assume US (+1)
        5. If 11 digits starting with 1, assume US (+1)
        6. Return original if cannot normalize
        """
        if not phone_str:
            return ""

        # Keep leading + if present
        has_plus = phone_str.startswith("+")

        # Remove all non-digits
        digits = re.sub(r"\D", "", phone_str)

        if not digits:
            return phone_str

        # If already has +, just return with normalized digits
        if has_plus:
            return f"+{digits}"

        # 10 digit numbers
        if len(digits) == 10:
            # Indian mobile numbers start with 6, 7, 8, or 9
            if digits[0] in "6789":
                return f"+91{digits}"
            # Assume US for others
            return f"+1{digits}"

        # 11 digit numbers starting with 1 (US with country code)
        if len(digits) == 11 and digits[0] == "1":
            return f"+{digits}"

        # 12 digit numbers starting with 91 (India with country code)
        if len(digits) == 12 and digits.startswith("91"):
            return f"+{digits}"

        # Return original if cannot normalize
        return phone_str

    def _extract_primary_or_first(self, items: List[Dict], value_key: str = "value") -> Optional[str]:
        """Extract primary item or first item from a list."""
        if not items:
            return None

        # Look for primary
        for item in items:
            metadata = item.get("metadata", {})
            if metadata.get("primary"):
                return item.get(value_key)

        # Return first item
        return items[0].get(value_key)

    def _extract_name(self, person: Dict) -> str:
        """Extract display name from person data."""
        names = person.get("names", [])
        if not names:
            # Fallback to phone or email if no name
            phones = person.get("phoneNumbers", [])
            if phones:
                return phones[0].get("value", "Unknown")
            emails = person.get("emailAddresses", [])
            if emails:
                return emails[0].get("value", "Unknown")
            return "Unknown Contact"

        # Get primary or first name
        for name in names:
            metadata = name.get("metadata", {})
            if metadata.get("primary"):
                return name.get("displayName", "Unknown")

        return names[0].get("displayName", "Unknown")

    def _extract_address(self, person: Dict) -> Optional[str]:
        """Extract formatted address from person data."""
        addresses = person.get("addresses", [])
        if not addresses:
            return None

        # Get primary or first address
        for addr in addresses:
            metadata = addr.get("metadata", {})
            if metadata.get("primary"):
                return addr.get("formattedValue")

        return addresses[0].get("formattedValue")

    def _extract_photo(self, person: Dict) -> Optional[str]:
        """Extract photo URL from person data."""
        photos = person.get("photos", [])
        if not photos:
            return None

        # Get primary or first photo
        for photo in photos:
            metadata = photo.get("metadata", {})
            if metadata.get("primary"):
                return photo.get("url")

        return photos[0].get("url")

    def normalize_contact(self, person: Dict) -> NormalizedContact:
        """
        Normalize a Google person object to our internal format.

        Args:
            person: Raw person data from Google API.

        Returns:
            NormalizedContact with extracted and normalized data.
        """
        resource_name = person.get("resourceName", "")
        name = self._extract_name(person)

        # Extract phone and normalize
        raw_phone = self._extract_primary_or_first(person.get("phoneNumbers", []))
        phone = self.normalize_phone(raw_phone) if raw_phone else None

        # Extract email
        email = self._extract_primary_or_first(person.get("emailAddresses", []))

        # Extract address
        address = self._extract_address(person)

        # Extract photo
        photo_url = self._extract_photo(person)

        return NormalizedContact(
            resource_name=resource_name,
            name=name,
            phone=phone,
            email=email,
            address=address,
            photo_url=photo_url,
            raw_data=person
        )

    async def fetch_contacts_page(
        self,
        access_token: str,
        page_token: Optional[str] = None,
        sync_token: Optional[str] = None
    ) -> Tuple[List[Dict], Optional[str], Optional[str]]:
        """
        Fetch a single page of contacts from Google.

        Args:
            access_token: Valid Google access token.
            page_token: Token for pagination (next page).
            sync_token: Token for incremental sync (changes since last sync).

        Returns:
            Tuple of (contacts, next_page_token, new_sync_token)
        """
        client = await self._get_client()

        params = {
            "personFields": ",".join(PERSON_FIELDS),
            "pageSize": PAGE_SIZE,
        }

        if sync_token:
            params["syncToken"] = sync_token
        if page_token:
            params["pageToken"] = page_token

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        }

        try:
            response = await client.get(
                GOOGLE_PEOPLE_API_URL,
                params=params,
                headers=headers
            )

            if response.status_code == 401:
                logger.warning("Access token expired or invalid")
                raise ValueError("Access token expired")

            if response.status_code == 429:
                # Rate limited - extract retry-after if available
                retry_after = int(response.headers.get("Retry-After", 60))
                logger.warning(f"Rate limited by Google API. Retry after {retry_after} seconds")
                raise RateLimitError(retry_after)

            if response.status_code != 200:
                logger.error(f"Google API error: {response.status_code} - {response.text}")
                raise ValueError(f"Google API error: {response.status_code}")

            data = response.json()

            connections = data.get("connections", [])
            next_page_token = data.get("nextPageToken")
            new_sync_token = data.get("nextSyncToken")

            return connections, next_page_token, new_sync_token

        except httpx.TimeoutException:
            logger.error("Timeout fetching contacts from Google")
            raise ValueError("Request timed out")

    async def fetch_all_contacts(
        self,
        user: User,
        sync_token: Optional[str] = None,
        on_progress: Optional[callable] = None
    ) -> Tuple[List[NormalizedContact], Optional[str]]:
        """
        Fetch all contacts for a user, handling pagination.

        Args:
            user: The user whose contacts to fetch.
            sync_token: Optional sync token for incremental sync.
            on_progress: Optional callback for progress updates (contacts_fetched, page_number).

        Returns:
            Tuple of (list of normalized contacts, new sync token for next time)
        """
        access_token = await google_oauth_service.get_valid_access_token(user)
        if not access_token:
            raise ValueError("No valid access token available")

        all_contacts: List[NormalizedContact] = []
        page_token: Optional[str] = None
        new_sync_token: Optional[str] = None
        page_number = 0

        while True:
            page_number += 1

            try:
                contacts, next_page_token, page_sync_token = await self.fetch_contacts_page(
                    access_token,
                    page_token=page_token,
                    sync_token=sync_token
                )

                # Normalize contacts
                for person in contacts:
                    normalized = self.normalize_contact(person)
                    # Skip contacts without phone and email
                    if normalized.phone or normalized.email:
                        all_contacts.append(normalized)

                # Update sync token (only the last page has it)
                if page_sync_token:
                    new_sync_token = page_sync_token

                # Progress callback
                if on_progress:
                    on_progress(len(all_contacts), page_number)

                # Check for more pages
                if not next_page_token:
                    break

                page_token = next_page_token

            except RateLimitError as e:
                # Wait and retry on rate limit
                logger.info(f"Rate limited, waiting {e.retry_after} seconds...")
                await asyncio.sleep(e.retry_after)
                continue

        logger.info(f"Fetched {len(all_contacts)} contacts for user {user.id}")
        return all_contacts, new_sync_token


class RateLimitError(Exception):
    """Exception for rate limit errors."""

    def __init__(self, retry_after: int):
        self.retry_after = retry_after
        super().__init__(f"Rate limited. Retry after {retry_after} seconds")


# Create a singleton instance
google_contacts_service = GoogleContactsService()
