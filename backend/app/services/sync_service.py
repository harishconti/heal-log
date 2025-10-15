from datetime import datetime
from app.db.session import get_db
from app.models.patient import Patient
from app.models.clinical_note import ClinicalNote
from bson import ObjectId
from typing import Dict, Any, List

async def pull_changes(last_pulled_at: int, user_id: str):
    db = get_db()

    # Convert last_pulled_at from milliseconds to a datetime object
    last_pulled_at_dt = datetime.fromtimestamp(last_pulled_at / 1000.0) if last_pulled_at else datetime.min

    # Fetch created and updated records
    created_patients = await db.patients.find({"user_id": user_id, "created_at": {"$gt": last_pulled_at_dt}}).to_list(length=None)
    updated_patients = await db.patients.find({"user_id": user_id, "updated_at": {"$gt": last_pulled_at_dt}, "created_at": {"$lte": last_pulled_at_dt}}).to_list(length=None)

    created_notes = await db.clinical_notes.find({"user_id": user_id, "created_at": {"$gt": last_pulled_at_dt}}).to_list(length=None)
    updated_notes = await db.clinical_notes.find({"user_id": user_id, "updated_at": {"$gt": last_pulled_at_dt}, "created_at": {"$lte": last_pulled_at_dt}}).to_list(length=None)

    # Since WatermelonDB doesn't have a concept of "deleted" records in the pull, we assume deletions are handled by setting a status.
    # For this implementation, we will not handle deletions in the pull.

    return {
        "patients": {
            "created": [Patient(**p).to_response() for p in created_patients],
            "updated": [Patient(**p).to_response() for p in updated_patients],
            "deleted": []
        },
        "clinical_notes": {
            "created": [ClinicalNote(**n).to_response() for n in created_notes],
            "updated": [ClinicalNote(**n).to_response() for n in updated_notes],
            "deleted": []
        }
    }

async def push_changes(changes: Dict[str, Dict[str, List[Dict[str, Any]]]], user_id: str):
    db = get_db()

    # Process created records
    if 'created' in changes.get('patients', {}):
        for patient_data in changes['patients']['created']:
            patient_data['user_id'] = user_id
            await db.patients.insert_one(patient_data)

    if 'created' in changes.get('clinical_notes', {}):
        for note_data in changes['clinical_notes']['created']:
            note_data['user_id'] = user_id
            await db.clinical_notes.insert_one(note_data)

    # Process updated records
    if 'updated' in changes.get('patients', {}):
        for patient_data in changes['patients']['updated']:
            patient_id = patient_data.pop('id')
            await db.patients.update_one({"_id": ObjectId(patient_id)}, {"$set": patient_data})

    if 'updated' in changes.get('clinical_notes', {}):
        for note_data in changes['clinical_notes']['updated']:
            note_id = note_data.pop('id')
            await db.clinical_notes.update_one({"_id": ObjectId(note_id)}, {"$set": note_data})

    # Process deleted records
    if 'deleted' in changes.get('patients', {}):
        for patient_id in changes['patients']['deleted']:
            await db.patients.delete_one({"_id": ObjectId(patient_id)})

    if 'deleted' in changes.get('clinical_notes', {}):
        for note_id in changes['clinical_notes']['deleted']:
            await db.clinical_notes.delete_one({"_id": ObjectId(note_id)})