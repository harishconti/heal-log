from datetime import datetime, timezone
from app.schemas.patient import Patient
from app.schemas.clinical_note import ClinicalNote
from app.schemas.sync_event import SyncEvent
from typing import Dict, Any, List
from app.core.exceptions import SyncConflictException

async def pull_changes(last_pulled_at: int, user_id: str) -> Dict[str, Any]:
    """
    Fetches changes from the database since the last pull time.
    Uses Beanie Documents directly for more reliable data handling.
    """
    try:
        # Convert last_pulled_at from milliseconds timestamp to a timezone-aware datetime object
        last_pulled_at_dt = datetime.fromtimestamp(last_pulled_at / 1000.0, tz=timezone.utc) if last_pulled_at else datetime.min.replace(tzinfo=timezone.utc)

        # Fetch created and updated records using Beanie's async queries
        created_patients_cursor = Patient.find(
            Patient.user_id == user_id,
            Patient.created_at > last_pulled_at_dt
        )
        updated_patients_cursor = Patient.find(
            Patient.user_id == user_id,
            Patient.updated_at > last_pulled_at_dt,
        )

        created_notes_cursor = ClinicalNote.find(
            ClinicalNote.user_id == user_id,
            ClinicalNote.created_at > last_pulled_at_dt
        )
        updated_notes_cursor = ClinicalNote.find(
            ClinicalNote.user_id == user_id,
            ClinicalNote.updated_at > last_pulled_at_dt,
            ClinicalNote.created_at <= last_pulled_at_dt
        )

        created_patients = await created_patients_cursor.to_list()
        updated_patients = await updated_patients_cursor.to_list()
        created_notes = await created_notes_cursor.to_list()
        updated_notes = await updated_notes_cursor.to_list()

        def serialize_document(doc):
            doc_dict = doc.model_dump()
            doc_dict["id"] = str(doc.id)
            return doc_dict

        await SyncEvent(user_id=user_id, success=True).insert()

        return {
            "patients": {
                "created": [serialize_document(p) for p in created_patients],
                "updated": [serialize_document(p) for p in updated_patients],
                "deleted": []
            },
            "clinical_notes": {
                "created": [serialize_document(n) for n in created_notes],
                "updated": [serialize_document(n) for n in updated_notes],
                "deleted": []
            }
        }
    except Exception as e:
        await SyncEvent(user_id=user_id, success=False).insert()
        raise e

async def push_changes(changes: Dict[str, Dict[str, List[Dict[str, Any]]]], user_id: str) -> None:
    """
    Applies changes from the client to the database.
    This version uses Beanie Documents for creating and updating records.
    """
    try:
        # Process created records
        if 'patients' in changes and 'created' in changes['patients']:
            for patient_data in changes['patients']['created']:
                patient_data['user_id'] = user_id
                new_patient = Patient(**patient_data)
                await new_patient.insert()

        if 'clinical_notes' in changes and 'created' in changes['clinical_notes']:
            for note_data in changes['clinical_notes']['created']:
                note_data['user_id'] = user_id
                new_note = ClinicalNote(**note_data)
                await new_note.insert()

        # Process updated records
        if 'patients' in changes and 'updated' in changes['patients']:
            for patient_data in changes['patients']['updated']:
                patient_id = patient_data.pop('id')
                patient = await Patient.get(patient_id)
                if patient and patient.user_id == user_id:
                    client_updated_at = datetime.fromtimestamp(patient_data['updated_at'] / 1000.0, tz=timezone.utc)
                    if client_updated_at < patient.updated_at.replace(tzinfo=timezone.utc):
                        raise SyncConflictException(f"Conflict detected for patient {patient_id}")
                    patient_data['updated_at'] = datetime.now(timezone.utc)
                    await patient.update({"$set": patient_data})

        if 'clinical_notes' in changes and 'updated' in changes['clinical_notes']:
            for note_data in changes['clinical_notes']['updated']:
                note_id = note_data.pop('id')
                note = await ClinicalNote.get(note_id)
                if note and note.user_id == user_id:
                    note_data['updated_at'] = datetime.now(timezone.utc)
                    await note.update({"$set": note_data})

        # Process deleted records
        if 'patients' in changes and 'deleted' in changes['patients']:
            for patient_id in changes['patients']['deleted']:
                patient = await Patient.get(patient_id)
                if patient and patient.user_id == user_id:
                    await patient.delete()

        if 'clinical_notes' in changes and 'deleted' in changes['clinical_notes']:
            for note_id in changes['clinical_notes']['deleted']:
                note = await ClinicalNote.get(note_id)
                if note and note.user_id == user_id:
                    await note.delete()

        await SyncEvent(user_id=user_id, success=True).insert()
    except Exception as e:
        await SyncEvent(user_id=user_id, success=False).insert()
        raise e