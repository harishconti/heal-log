import logging
from async_lru import alru_cache
from app.schemas.patient import PatientCreate, PatientUpdate, Patient
from app.schemas.clinical_note import NoteCreate, ClinicalNote
from app.services import clinical_note_service, analytics_service
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from .base_service import BaseService

class PatientService(BaseService[Patient, PatientCreate, PatientUpdate]):

    async def get_next_patient_id(self, user_id: str) -> str:
        """
        Generates the next patient ID for a given user.
        """
        last_patient = await self.model.find(self.model.user_id == user_id).sort(-self.model.patient_id).limit(1).first_or_none()
        if not last_patient or not last_patient.patient_id.startswith("PAT"):
            return "PAT001"

        last_num = int(last_patient.patient_id[3:])
        return f"PAT{last_num + 1:03d}"

    async def create(self, obj_in: PatientCreate, user_id: str) -> Patient:
        """
        Overrides the base create method to add user_id and a sequential patient_id.
        """
        patient_id = await self.get_next_patient_id(user_id)

        patient_data = obj_in.dict()
        patient_data["id"] = str(uuid.uuid4())
        patient_data["patient_id"] = patient_id
        patient_data["user_id"] = user_id

        db_obj = self.model(**patient_data)
        await db_obj.insert()

        # Invalidate caches
        self.get_patients_by_user_id.cache_clear()
        self.get_patient_groups.cache_clear()
        self.get_user_stats.cache_clear()
        analytics_service.get_patient_growth_analytics.cache_clear()

        return db_obj

    def _build_patient_query(
        self,
        user_id: str,
        search: Optional[str] = None,
        group: Optional[str] = None,
        favorites_only: bool = False
    ) -> List[Any]:
        """
        Builds the Beanie query for fetching patients based on filters.
        """
        query = [self.model.user_id == user_id]
        logging.info(f"Building query for user {user_id} with search: {search}")
        if search:
            search_regex = {"$regex": search, "$options": "i"}
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
        return query

    @alru_cache(maxsize=128)
    async def get_patients_by_user_id(
        self,
        user_id: str,
        search: Optional[str] = None,
        group: Optional[str] = None,
        favorites_only: bool = False
    ) -> List[Patient]:
        """
        Retrieves a list of patients for a user, with optional filters.
        """
        query = self._build_patient_query(user_id, search, group, favorites_only)
        logging.info(f"Executing query: {query}")
        print(f"Executing query: {query}")
        return await self.model.find(*query).sort(-self.model.created_at).to_list()

    async def update(self, patient_id: str, patient_data: PatientUpdate, user_id: str) -> Optional[Patient]:
        patient = await self.get(patient_id, user_id=user_id)
        if not patient:
            return None

        updated_patient = await super().update(patient, patient_data)

        # Invalidate caches
        self.get_patients_by_user_id.cache_clear()
        self.get_patient_groups.cache_clear()
        self.get_user_stats.cache_clear()

        return updated_patient

    async def delete(self, patient_id: str, user_id: str) -> bool:
        """
        Deletes a patient by their ID. Returns True if successful.
        """
        patient = await self.get(patient_id, user_id=user_id)
        if not patient:
            return False

        await super().delete(patient.id)

        # Invalidate caches
        self.get_patients_by_user_id.cache_clear()
        self.get_patient_groups.cache_clear()
        self.get_user_stats.cache_clear()
        analytics_service.get_patient_growth_analytics.cache_clear()

        return True

    async def add_note_to_patient(self, patient_id: str, note_data: NoteCreate, user_id: str) -> Optional[ClinicalNote]:
        """
        Adds a new note to a patient's record.
        """
        patient = await self.get(patient_id, user_id=user_id)
        if not patient:
            return None

        note = await clinical_note_service.create_note(patient_id, note_data, user_id)

        patient.updated_at = datetime.utcnow()
        await patient.save()

        return note

    async def get_patient_notes(self, patient_id: str, user_id: str) -> Optional[List[ClinicalNote]]:
        """
        Retrieves all notes for a specific patient.
        """
        patient = await self.get(patient_id, user_id=user_id)
        if not patient:
            return None

        return await clinical_note_service.get_notes_for_patient(patient_id, user_id)

    @alru_cache(maxsize=32)
    async def get_patient_groups(self, user_id: str) -> List[str]:
        """
        Retrieves all unique patient groups for a user.
        """
        return await self.model.distinct(self.model.group, {"user_id": user_id})

    @alru_cache(maxsize=32)
    async def get_user_stats(self, user_id: str) -> Dict[str, any]:
        """
        Retrieves statistics for a user.
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