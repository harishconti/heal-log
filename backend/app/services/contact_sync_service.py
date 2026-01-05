"""
Contact Sync Service for orchestrating Google Contacts sync.

Handles:
- Creating and managing sync jobs
- Duplicate detection and matching
- Creating/updating patients from contacts
- Managing duplicate resolution
"""

import logging
import asyncio
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from difflib import SequenceMatcher
import re

from app.schemas.user import User
from app.schemas.patient import Patient, PatientCreate, PatientSource
from app.schemas.google_contacts import (
    GoogleContactsSyncJob,
    DuplicateRecord,
    DuplicateMatch,
    SyncJobStatus,
    SyncJobType,
    DuplicateStatus,
    DuplicateResolution,
)
from app.services.google_contacts_service import (
    google_contacts_service,
    NormalizedContact
)
from app.services.patient_service import patient_service

logger = logging.getLogger(__name__)

# Confidence thresholds for duplicate detection
CONFIDENCE_EXACT_PHONE = 1.0
CONFIDENCE_EXACT_EMAIL = 0.95
CONFIDENCE_PHONE_NO_COUNTRY = 0.8
CONFIDENCE_FUZZY_NAME_PARTIAL_PHONE = 0.7
CONFIDENCE_FUZZY_NAME_ONLY = 0.5
MIN_CONFIDENCE_THRESHOLD = 0.5


class ContactSyncService:
    """Service for orchestrating Google Contacts synchronization."""

    def normalize_phone_for_comparison(self, phone: str) -> str:
        """Strip phone to just digits for comparison."""
        if not phone:
            return ""
        return re.sub(r"\D", "", phone)

    def compare_phones(self, phone1: str, phone2: str) -> Tuple[bool, float, str]:
        """
        Compare two phone numbers.

        Returns:
            Tuple of (is_match, confidence, reason)
        """
        if not phone1 or not phone2:
            return False, 0.0, ""

        # Normalize both phones
        digits1 = self.normalize_phone_for_comparison(phone1)
        digits2 = self.normalize_phone_for_comparison(phone2)

        if not digits1 or not digits2:
            return False, 0.0, ""

        # Exact match (including country code)
        if digits1 == digits2:
            return True, CONFIDENCE_EXACT_PHONE, "phone_exact"

        # Match without country code (last 10 digits)
        if len(digits1) >= 10 and len(digits2) >= 10:
            if digits1[-10:] == digits2[-10:]:
                return True, CONFIDENCE_PHONE_NO_COUNTRY, "phone_last_10"

        return False, 0.0, ""

    def compare_emails(self, email1: str, email2: str) -> Tuple[bool, float, str]:
        """
        Compare two email addresses.

        Returns:
            Tuple of (is_match, confidence, reason)
        """
        if not email1 or not email2:
            return False, 0.0, ""

        # Case-insensitive comparison
        if email1.lower().strip() == email2.lower().strip():
            return True, CONFIDENCE_EXACT_EMAIL, "email_exact"

        return False, 0.0, ""

    def fuzzy_name_match(self, name1: str, name2: str) -> float:
        """
        Calculate fuzzy match ratio between two names.

        Returns:
            Match ratio between 0.0 and 1.0
        """
        if not name1 or not name2:
            return 0.0

        # Normalize names
        n1 = name1.lower().strip()
        n2 = name2.lower().strip()

        return SequenceMatcher(None, n1, n2).ratio()

    async def find_duplicate_patients(
        self,
        contact: NormalizedContact,
        user_id: str
    ) -> List[DuplicateMatch]:
        """
        Find potential duplicate patients for a contact.

        Args:
            contact: The normalized contact to check.
            user_id: The user's ID.

        Returns:
            List of potential duplicate matches with confidence scores.
        """
        matches: List[DuplicateMatch] = []

        # Get all patients for user
        existing_patients = await Patient.find({"user_id": user_id}).to_list()

        for patient in existing_patients:
            confidence = 0.0
            reasons = []

            # Check phone match
            if contact.phone and patient.phone:
                is_match, conf, reason = self.compare_phones(contact.phone, patient.phone)
                if is_match:
                    confidence = max(confidence, conf)
                    reasons.append(reason)

            # Check email match
            if contact.email and patient.email:
                is_match, conf, reason = self.compare_emails(contact.email, patient.email)
                if is_match:
                    confidence = max(confidence, conf)
                    reasons.append(reason)

            # Check fuzzy name match
            name_ratio = self.fuzzy_name_match(contact.name, patient.name)
            if name_ratio > 0.85:
                if reasons:  # Has phone or email match too
                    confidence = max(confidence, CONFIDENCE_FUZZY_NAME_PARTIAL_PHONE)
                else:
                    confidence = max(confidence, CONFIDENCE_FUZZY_NAME_ONLY)
                reasons.append(f"name_fuzzy_{int(name_ratio * 100)}")

            # Add match if above threshold
            if confidence >= MIN_CONFIDENCE_THRESHOLD:
                matches.append(DuplicateMatch(
                    patient_id=patient.id,
                    patient_name=patient.name,
                    patient_phone=patient.phone or "",
                    patient_email=patient.email or "",
                    confidence=confidence,
                    match_reasons=reasons
                ))

        # Sort by confidence descending
        matches.sort(key=lambda x: x.confidence, reverse=True)
        return matches

    async def create_sync_job(
        self,
        user_id: str,
        job_type: SyncJobType = SyncJobType.INITIAL
    ) -> GoogleContactsSyncJob:
        """
        Create a new sync job.

        Args:
            user_id: The user's ID.
            job_type: Type of sync (initial or incremental).

        Returns:
            The created sync job.
        """
        job = GoogleContactsSyncJob(
            user_id=user_id,
            job_type=job_type,
            status=SyncJobStatus.PENDING
        )
        await job.insert()
        logger.info(f"Created sync job {job.id} for user {user_id}")
        return job

    async def get_sync_job(self, job_id: str, user_id: str) -> Optional[GoogleContactsSyncJob]:
        """Get a sync job by ID for a specific user."""
        return await GoogleContactsSyncJob.find_one({
            "_id": job_id,
            "user_id": user_id
        })

    async def get_active_sync_job(self, user_id: str) -> Optional[GoogleContactsSyncJob]:
        """Get any active sync job for a user."""
        return await GoogleContactsSyncJob.find_one({
            "user_id": user_id,
            "status": {"$in": [SyncJobStatus.PENDING, SyncJobStatus.IN_PROGRESS]}
        })

    async def get_last_sync_job(self, user_id: str) -> Optional[GoogleContactsSyncJob]:
        """Get the most recent completed sync job for a user."""
        return await GoogleContactsSyncJob.find_one(
            {"user_id": user_id, "status": SyncJobStatus.COMPLETED},
            sort=[("completed_at", -1)]
        )

    async def cancel_sync_job(self, job_id: str, user_id: str) -> bool:
        """Request cancellation of a sync job."""
        job = await self.get_sync_job(job_id, user_id)
        if not job:
            return False

        if job.status in [SyncJobStatus.COMPLETED, SyncJobStatus.FAILED, SyncJobStatus.CANCELLED]:
            return False

        job.cancel_requested = True
        await job.save()
        logger.info(f"Requested cancellation of sync job {job_id}")
        return True

    async def process_contact(
        self,
        contact: NormalizedContact,
        user_id: str,
        job: GoogleContactsSyncJob
    ) -> str:
        """
        Process a single contact - create patient, update existing, or flag as duplicate.

        Args:
            contact: The normalized contact to process.
            user_id: The user's ID.
            job: The current sync job.

        Returns:
            Action taken: "created", "updated", "duplicate", or "skipped"
        """
        # First check if we already have this contact by external_id
        existing_by_external = await Patient.find_one({
            "user_id": user_id,
            "external_id": contact.resource_name
        })

        if existing_by_external:
            # Check if locally modified
            if existing_by_external.local_modified_at and existing_by_external.last_synced_at:
                if existing_by_external.local_modified_at > existing_by_external.last_synced_at:
                    # Local modifications exist, skip to preserve user changes
                    logger.debug(f"Skipping locally modified patient {existing_by_external.id}")
                    return "skipped"

            # Update existing patient
            await self._update_patient_from_contact(existing_by_external, contact)
            return "updated"

        # Find potential duplicates
        duplicates = await self.find_duplicate_patients(contact, user_id)

        if duplicates:
            # Create duplicate record for user review
            duplicate_record = DuplicateRecord(
                sync_job_id=job.id,
                user_id=user_id,
                google_contact={
                    "resource_name": contact.resource_name,
                    "name": contact.name,
                    "phone": contact.phone,
                    "email": contact.email,
                    "address": contact.address,
                    "photo_url": contact.photo_url,
                },
                matched_patients=duplicates,
                highest_confidence=duplicates[0].confidence,
                match_reasons=duplicates[0].match_reasons
            )
            await duplicate_record.insert()

            # Add to job's pending duplicates
            job.pending_duplicates.append(duplicate_record.id)
            return "duplicate"

        # No duplicates - create new patient
        await self._create_patient_from_contact(contact, user_id)
        return "created"

    async def _create_patient_from_contact(
        self,
        contact: NormalizedContact,
        user_id: str
    ) -> Patient:
        """Create a new patient from a contact."""
        patient_data = PatientCreate(
            name=contact.name,
            phone=contact.phone or "",
            email=contact.email,
            address=contact.address or "",
            source=PatientSource.GOOGLE_CONTACTS,
            external_id=contact.resource_name,
        )

        patient = await patient_service.create(patient_data, user_id)

        # Set sync fields
        patient.last_synced_at = datetime.now(timezone.utc)
        patient.sync_version = 1
        await patient.save()

        logger.debug(f"Created patient {patient.id} from Google contact {contact.resource_name}")
        return patient

    async def _update_patient_from_contact(
        self,
        patient: Patient,
        contact: NormalizedContact
    ) -> Patient:
        """Update an existing patient from a contact."""
        patient.name = contact.name
        if contact.phone:
            patient.phone = contact.phone
        if contact.email:
            patient.email = contact.email
        if contact.address:
            patient.address = contact.address
        patient.last_synced_at = datetime.now(timezone.utc)
        patient.sync_version = (patient.sync_version or 0) + 1

        await patient.save()
        logger.debug(f"Updated patient {patient.id} from Google contact {contact.resource_name}")
        return patient

    async def run_sync(self, user: User, job: GoogleContactsSyncJob) -> GoogleContactsSyncJob:
        """
        Run the sync process for a user.

        Args:
            user: The user to sync for.
            job: The sync job to update.

        Returns:
            The updated sync job.
        """
        try:
            job.status = SyncJobStatus.IN_PROGRESS
            job.started_at = datetime.now(timezone.utc)
            await job.save()

            # Get sync token from last job for incremental sync
            sync_token = None
            if job.job_type == SyncJobType.INCREMENTAL:
                last_job = await self.get_last_sync_job(user.id)
                if last_job:
                    sync_token = last_job.google_sync_token

            # Fetch contacts
            def on_progress(contacts_fetched, page_number):
                logger.debug(f"Fetched {contacts_fetched} contacts (page {page_number})")

            contacts, new_sync_token = await google_contacts_service.fetch_all_contacts(
                user,
                sync_token=sync_token,
                on_progress=on_progress
            )

            job.total_contacts = len(contacts)
            job.google_sync_token = new_sync_token
            await job.save()

            # Process each contact
            for i, contact in enumerate(contacts):
                # Check for cancellation
                if job.cancel_requested:
                    job.status = SyncJobStatus.CANCELLED
                    job.completed_at = datetime.now(timezone.utc)
                    await job.save()
                    logger.info(f"Sync job {job.id} cancelled by user")
                    return job

                try:
                    action = await self.process_contact(contact, user.id, job)

                    # Update counters
                    job.processed_contacts += 1
                    if action == "created":
                        job.created_patients += 1
                    elif action == "updated":
                        job.updated_patients += 1
                    elif action == "duplicate":
                        job.duplicates_found += 1
                    elif action == "skipped":
                        job.skipped_contacts += 1

                    # Save progress periodically
                    if i % 10 == 0:
                        await job.save()

                except Exception as e:
                    logger.error(f"Error processing contact {contact.resource_name}: {e}")
                    job.skipped_contacts += 1

            # Mark as completed
            job.status = SyncJobStatus.COMPLETED
            job.completed_at = datetime.now(timezone.utc)
            await job.save()

            logger.info(
                f"Sync job {job.id} completed: "
                f"created={job.created_patients}, updated={job.updated_patients}, "
                f"duplicates={job.duplicates_found}, skipped={job.skipped_contacts}"
            )

            return job

        except Exception as e:
            logger.error(f"Sync job {job.id} failed: {e}", exc_info=True)
            job.status = SyncJobStatus.FAILED
            job.error_message = str(e)
            job.completed_at = datetime.now(timezone.utc)
            await job.save()
            return job

    async def get_pending_duplicates(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[DuplicateRecord]:
        """Get pending duplicates for a user."""
        return await DuplicateRecord.find(
            {"user_id": user_id, "status": DuplicateStatus.PENDING}
        ).skip(offset).limit(limit).to_list()

    async def get_pending_duplicates_count(self, user_id: str) -> int:
        """Get count of pending duplicates for a user."""
        return await DuplicateRecord.find(
            {"user_id": user_id, "status": DuplicateStatus.PENDING}
        ).count()

    async def resolve_duplicate(
        self,
        duplicate_id: str,
        user_id: str,
        resolution: DuplicateResolution,
        merge_fields: Optional[Dict[str, str]] = None
    ) -> Optional[str]:
        """
        Resolve a duplicate record.

        Args:
            duplicate_id: The duplicate record ID.
            user_id: The user's ID.
            resolution: How to resolve the duplicate.
            merge_fields: For merge resolution, which fields to use from which source.

        Returns:
            The resolved patient ID, or None if failed.
        """
        duplicate = await DuplicateRecord.find_one({
            "_id": duplicate_id,
            "user_id": user_id
        })

        if not duplicate:
            return None

        if duplicate.status != DuplicateStatus.PENDING:
            logger.warning(f"Duplicate {duplicate_id} already resolved")
            return duplicate.resolved_patient_id

        google_contact = duplicate.google_contact
        matched_patient_id = duplicate.matched_patients[0].patient_id if duplicate.matched_patients else None

        try:
            if resolution == DuplicateResolution.KEEP_EXISTING:
                # Just mark as resolved, keep existing patient
                patient_id = matched_patient_id

            elif resolution == DuplicateResolution.CREATE_NEW:
                # Create a new patient from the contact
                contact = NormalizedContact(
                    resource_name=google_contact.get("resource_name", ""),
                    name=google_contact.get("name", "Unknown"),
                    phone=google_contact.get("phone"),
                    email=google_contact.get("email"),
                    address=google_contact.get("address"),
                    photo_url=google_contact.get("photo_url"),
                    raw_data=google_contact
                )
                patient = await self._create_patient_from_contact(contact, user_id)
                patient_id = patient.id

            elif resolution == DuplicateResolution.REPLACE:
                # Replace existing patient with Google data
                if matched_patient_id:
                    patient = await Patient.find_one({"_id": matched_patient_id})
                    if patient:
                        patient.name = google_contact.get("name", patient.name)
                        if google_contact.get("phone"):
                            patient.phone = google_contact["phone"]
                        if google_contact.get("email"):
                            patient.email = google_contact["email"]
                        if google_contact.get("address"):
                            patient.address = google_contact["address"]
                        patient.external_id = google_contact.get("resource_name")
                        patient.source = PatientSource.GOOGLE_CONTACTS
                        patient.last_synced_at = datetime.now(timezone.utc)
                        await patient.save()
                        patient_id = patient.id
                    else:
                        patient_id = None
                else:
                    patient_id = None

            elif resolution == DuplicateResolution.MERGE:
                # Merge fields based on user selection
                if matched_patient_id and merge_fields:
                    patient = await Patient.find_one({"_id": matched_patient_id})
                    if patient:
                        for field, source in merge_fields.items():
                            if source == "google":
                                value = google_contact.get(field)
                                if value and hasattr(patient, field):
                                    setattr(patient, field, value)
                        patient.external_id = google_contact.get("resource_name")
                        patient.last_synced_at = datetime.now(timezone.utc)
                        await patient.save()
                        patient_id = patient.id
                    else:
                        patient_id = None
                else:
                    patient_id = matched_patient_id

            else:
                patient_id = None

            # Update duplicate record
            duplicate.status = DuplicateStatus.RESOLVED
            duplicate.resolution = resolution
            duplicate.resolved_patient_id = patient_id
            duplicate.resolved_at = datetime.now(timezone.utc)
            await duplicate.save()

            # Update sync job duplicate counters
            job = await GoogleContactsSyncJob.find_one({"_id": duplicate.sync_job_id})
            if job:
                job.duplicates_resolved += 1
                if duplicate.id in job.pending_duplicates:
                    job.pending_duplicates.remove(duplicate.id)
                await job.save()

            logger.info(f"Resolved duplicate {duplicate_id} as {resolution}")
            return patient_id

        except Exception as e:
            logger.error(f"Error resolving duplicate {duplicate_id}: {e}", exc_info=True)
            return None

    async def batch_resolve_duplicates(
        self,
        user_id: str,
        resolutions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Resolve multiple duplicates at once.

        Args:
            user_id: The user's ID.
            resolutions: List of {id, resolution, merge_fields?} dicts.

        Returns:
            Results summary.
        """
        results = {
            "success": 0,
            "failed": 0,
            "details": []
        }

        for res in resolutions:
            dup_id = res.get("id")
            resolution = DuplicateResolution(res.get("resolution"))
            merge_fields = res.get("merge_fields")

            patient_id = await self.resolve_duplicate(
                dup_id, user_id, resolution, merge_fields
            )

            if patient_id:
                results["success"] += 1
                results["details"].append({"id": dup_id, "status": "success", "patient_id": patient_id})
            else:
                results["failed"] += 1
                results["details"].append({"id": dup_id, "status": "failed"})

        return results

    async def skip_duplicate(self, duplicate_id: str, user_id: str) -> bool:
        """Skip/dismiss a duplicate without resolving."""
        duplicate = await DuplicateRecord.find_one({
            "_id": duplicate_id,
            "user_id": user_id
        })

        if not duplicate:
            return False

        duplicate.status = DuplicateStatus.SKIPPED
        duplicate.resolved_at = datetime.now(timezone.utc)
        await duplicate.save()

        # Update sync job
        job = await GoogleContactsSyncJob.find_one({"_id": duplicate.sync_job_id})
        if job and duplicate.id in job.pending_duplicates:
            job.pending_duplicates.remove(duplicate.id)
            await job.save()

        return True


# Create singleton instance
contact_sync_service = ContactSyncService()
