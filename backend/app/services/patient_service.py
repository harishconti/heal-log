import logging
import re
from fastapi_cache.decorator import cache
from app.schemas.patient import PatientCreate, PatientUpdate, Patient
from app.schemas.clinical_note import NoteCreate, ClinicalNote
from app.services import clinical_note_service
from typing import List, Optional, Dict, Any, Literal
import uuid
from datetime import datetime, timezone
from .base_service import BaseService
from fastapi_cache import FastAPICache
from app.db.session import get_database


def sanitize_regex_input(user_input: str, max_length: int = 100) -> str:
    """
    Sanitizes user input for safe use in MongoDB regex queries.

    - Escapes all regex special characters to prevent injection
    - Limits input length to prevent ReDoS attacks
    - Returns empty string if input is None or empty
    """
    if not user_input:
        return ""

    # Truncate to max length to prevent ReDoS
    truncated = user_input[:max_length]

    # Escape all regex special characters
    return re.escape(truncated)

class PatientService(BaseService[Patient, PatientCreate, PatientUpdate]):

    async def get_next_patient_id(self, user_id: str, max_retries: int = 5) -> str:
        """
        Generates the next patient ID for a given user using atomic MongoDB operations.
        Format: PTYYYYMM001 (e.g., PT202501001 for first patient in Jan 2025)

        The ID includes:
        - PT: Prefix for patient
        - YYYY: 4-digit year
        - MM: 2-digit month
        - 001: 3-digit sequential number (resets each month)

        Uses MongoDB's findOneAndUpdate with upsert for atomic counter increment,
        eliminating race conditions entirely.
        """
        now = datetime.now(timezone.utc)
        year_month = now.strftime("%Y%m")  # e.g., "202501"
        prefix = f"PT{year_month}"  # e.g., "PT202501"
        counter_key = f"{user_id}_{year_month}"

        db = await get_database()
        counters_collection = db.get_collection("patient_id_counters")

        for attempt in range(max_retries):
            try:
                # Atomically increment and return the new counter value
                result = await counters_collection.find_one_and_update(
                    {"_id": counter_key},
                    {"$inc": {"sequence": 1}},
                    upsert=True,
                    return_document=True  # Return the document after update
                )

                next_seq = result["sequence"]
                candidate_id = f"{prefix}{next_seq:03d}"

                # Verify the ID doesn't already exist (belt and suspenders check for edge cases)
                existing = await self.model.find_one(
                    self.model.user_id == user_id,
                    self.model.patient_id == candidate_id
                )

                if not existing:
                    return candidate_id

                # ID exists (shouldn't happen with atomic counter, but handle edge cases)
                logging.warning(f"[PATIENT_SERVICE] Patient ID collision detected for {candidate_id}, retrying...")

            except Exception as e:
                logging.error(f"[PATIENT_SERVICE] Error generating patient ID: {e}")
                if attempt == max_retries - 1:
                    raise

        # If all retries exhausted, use timestamp-based fallback with microseconds for uniqueness
        fallback_seq = int(datetime.now().timestamp() * 1000) % 100000
        fallback_id = f"{prefix}{fallback_seq:05d}"
        logging.warning(f"[PATIENT_SERVICE] Using fallback patient ID: {fallback_id}")
        return fallback_id

    async def _clear_patient_caches(self) -> None:
        """
        Clears patient-related caches with graceful error handling.
        Redis connection errors are logged but don't crash the operation.
        """
        try:
            if FastAPICache.get_backend():
                await FastAPICache.clear(namespace="get_patients_by_user_id")
                await FastAPICache.clear(namespace="get_patient_groups")
                await FastAPICache.clear(namespace="get_user_stats")
                await FastAPICache.clear(namespace="get_patient_growth_analytics")
        except Exception as e:
            # Log the error but don't crash - cache invalidation is non-critical
            logging.warning(f"Failed to clear cache: {e}")

    async def create(self, obj_in: PatientCreate, user_id: str) -> Patient:
        """
        Overrides the base create method to add user_id and a sequential patient_id.
        """
        existing_patient = await self.model.find_one(
            self.model.user_id == user_id,
            self.model.name == obj_in.name
        )
        if existing_patient:
            raise ValueError("A patient with this name already exists.")

        patient_id = await self.get_next_patient_id(user_id)

        patient_data = obj_in.model_dump()
        patient_data["id"] = str(uuid.uuid4())
        patient_data["patient_id"] = patient_id
        patient_data["user_id"] = user_id

        db_obj = self.model(**patient_data)
        await db_obj.insert()

        # Invalidate caches if a backend is available
        await self._clear_patient_caches()

        return db_obj

    def _build_patient_query(
        self,
        user_id: str,
        search: Optional[str] = None,
        group: Optional[str] = None,
        favorites_only: bool = False,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> List[Any]:
        """
        Builds the Beanie query for fetching patients based on filters.
        Supports text search, group filter, favorites, and date range filtering.
        """
        query = [self.model.user_id == user_id]
        if search:
            # SECURITY: Sanitize search input to prevent NoSQL regex injection
            sanitized_search = sanitize_regex_input(search)
            if sanitized_search:
                search_regex = {"$regex": sanitized_search, "$options": "i"}
                query.append(
                    {"$or": [
                        {"name": search_regex},
                        {"patient_id": search_regex},
                        {"phone": search_regex},
                        {"email": search_regex}
                    ]}
                )
        if group:
            query.append(self.model.group == group)
        if favorites_only:
            query.append(self.model.is_favorite == True)
        if date_from:
            query.append(self.model.created_at >= date_from)
        if date_to:
            query.append(self.model.created_at <= date_to)
        return query

    @cache(namespace="get_patients_by_user_id", expire=60)
    async def get_patients_by_user_id(
        self,
        user_id: str,
        search: Optional[str] = None,
        group: Optional[str] = None,
        favorites_only: bool = False,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        sort_by: Literal["name", "created_at", "updated_at"] = "created_at",
        sort_order: Literal["asc", "desc"] = "desc",
        skip: int = 0,
        limit: int = 100
    ) -> List[Patient]:
        """
        Retrieves a list of patients for a user, with optional filters.
        Supports pagination with skip and limit parameters.
        Supports sorting by name, created_at, or updated_at.
        Supports date range filtering on created_at.
        """
        query = self._build_patient_query(
            user_id, search, group, favorites_only, date_from, date_to
        )

        # Build sort criteria
        sort_field = getattr(self.model, sort_by)
        if sort_order == "desc":
            sort_criteria = -sort_field
        else:
            sort_criteria = +sort_field

        return await self.model.find(*query).sort(sort_criteria).skip(skip).limit(limit).to_list()

    async def update(self, patient_id: str, patient_data: PatientUpdate, user_id: str) -> Optional[Patient]:
        patient = await self.get(patient_id, user_id=user_id)
        if not patient:
            return None

        updated_patient = await super().update(patient, patient_data)

        # Invalidate caches if a backend is available
        await self._clear_patient_caches()

        return updated_patient

    async def delete(self, patient_id: str, user_id: str) -> bool:
        """
        Deletes a patient by their ID. Returns True if successful.
        """
        patient = await self.get(patient_id, user_id=user_id)
        if not patient:
            return False

        await super().delete(patient)

        # Invalidate caches if a backend is available
        await self._clear_patient_caches()

        return True

    async def add_note_to_patient(self, patient_id: str, note_data: NoteCreate, user_id: str) -> Optional[ClinicalNote]:
        """
        Adds a new note to a patient's record.
        """
        patient = await self.get(patient_id, user_id=user_id)
        if not patient:
            return None

        note = await clinical_note_service.create_note(patient_id, note_data, user_id)

        patient.updated_at = datetime.now(timezone.utc)
        await patient.save()

        return note

    async def get_patient_notes(
        self,
        patient_id: str,
        user_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> Optional[List[ClinicalNote]]:
        """
        Retrieves notes for a specific patient with pagination support.
        """
        patient = await self.get(patient_id, user_id=user_id)
        if not patient:
            return None

        return await clinical_note_service.get_notes_for_patient(patient_id, user_id, skip=skip, limit=limit)

    async def delete_patient_note(self, patient_id: str, note_id: str, user_id: str) -> Optional[bool]:
        """
        Deletes a specific note from a patient's record.
        Returns True if deleted, False if note not found, None if patient not found.
        """
        patient = await self.get(patient_id, user_id=user_id)
        if not patient:
            return None

        deleted = await clinical_note_service.delete_note(note_id, patient_id, user_id)
        if deleted:
            patient.updated_at = datetime.now(timezone.utc)
            await patient.save()
        return deleted

    @cache(namespace="get_patient_groups", expire=60)
    async def get_patient_groups(self, user_id: str) -> List[str]:
        """
        Retrieves all unique patient groups for a user.
        """
        return await self.model.distinct(self.model.group, {"user_id": user_id})

    @cache(namespace="get_user_stats", expire=60)
    async def get_user_stats(self, user_id: str) -> Dict[str, any]:
        """
        Retrieve statistics for a user.
        """
        total_patients = await self.model.find({"user_id": user_id}).count()
        favorite_patients = await self.model.find({"user_id": user_id, "is_favorite": True}).count()

        pipeline = [
            {"$match": {"user_id": user_id, "group": {"$ne": None}}},
            {"$group": {"_id": "$group", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        group_stats = await self.model.aggregate(pipeline).to_list()

        return {
            "total_patients": total_patients,
            "favorite_patients": favorite_patients,
            "groups": group_stats
        }

patient_service = PatientService(Patient)