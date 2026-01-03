from datetime import datetime, timezone
import logging
from app.schemas.patient import Patient
from app.schemas.clinical_note import ClinicalNote
from app.schemas.sync_event import SyncEvent
from typing import Dict, Any, List
from app.core.exceptions import SyncConflictException


async def get_deleted_records(user_id: str, last_pulled_at_dt: datetime) -> Dict[str, List[str]]:
    """
    Fetches IDs of records that were soft-deleted since the last pull.
    Returns a dict with 'patients' and 'clinical_notes' arrays of deleted IDs.
    """
    deleted_patients = []
    deleted_notes = []

    try:
        # Find soft-deleted patients (deleted_at is set and after last pull)
        deleted_patients_cursor = Patient.find(
            Patient.user_id == user_id,
            {"deleted_at": {"$exists": True, "$ne": None, "$gt": last_pulled_at_dt}}
        )
        async for patient in deleted_patients_cursor:
            deleted_patients.append(str(patient.id))

        # Find soft-deleted clinical notes
        deleted_notes_cursor = ClinicalNote.find(
            ClinicalNote.user_id == user_id,
            {"deleted_at": {"$exists": True, "$ne": None, "$gt": last_pulled_at_dt}}
        )
        async for note in deleted_notes_cursor:
            deleted_notes.append(str(note.id))

    except Exception as e:
        logging.warning(f"[SYNC] Error fetching deleted records: {e}")

    return {
        "patients": deleted_patients,
        "clinical_notes": deleted_notes
    }


async def pull_changes(last_pulled_at: int, user_id: str) -> Dict[str, Any]:
    """
    Fetches changes from the database since the last pull time.
    Uses Beanie Documents directly for more reliable data handling.
    """
    try:
        # Convert last_pulled_at from milliseconds timestamp to a timezone-aware datetime object
        last_pulled_at_dt = datetime.fromtimestamp(last_pulled_at / 1000.0, tz=timezone.utc) if last_pulled_at else datetime.min.replace(tzinfo=timezone.utc)

        # Fetch created records (created AFTER last pull, excluding soft-deleted)
        created_patients_cursor = Patient.find(
            Patient.user_id == user_id,
            Patient.created_at > last_pulled_at_dt,
            {"$or": [{"deleted_at": {"$exists": False}}, {"deleted_at": None}]}
        )
        # Fetch updated records (created BEFORE last pull, but updated AFTER, excluding soft-deleted)
        updated_patients_cursor = Patient.find(
            Patient.user_id == user_id,
            Patient.created_at <= last_pulled_at_dt,
            Patient.updated_at > last_pulled_at_dt,
            {"$or": [{"deleted_at": {"$exists": False}}, {"deleted_at": None}]}
        )

        created_notes_cursor = ClinicalNote.find(
            ClinicalNote.user_id == user_id,
            ClinicalNote.created_at > last_pulled_at_dt,
            {"$or": [{"deleted_at": {"$exists": False}}, {"deleted_at": None}]}
        )
        updated_notes_cursor = ClinicalNote.find(
            ClinicalNote.user_id == user_id,
            ClinicalNote.created_at <= last_pulled_at_dt,
            ClinicalNote.updated_at > last_pulled_at_dt,
            {"$or": [{"deleted_at": {"$exists": False}}, {"deleted_at": None}]}
        )

        created_patients = await created_patients_cursor.to_list()
        updated_patients = await updated_patients_cursor.to_list()
        created_notes = await created_notes_cursor.to_list()
        updated_notes = await updated_notes_cursor.to_list()

        def serialize_document(doc):
            # Use mode='python' to keep datetime objects as Python datetime, not ISO strings
            # This is critical for WatermelonDB which expects milliseconds timestamps
            doc_dict = doc.model_dump(mode='python')
            doc_dict["id"] = str(doc.id)
            # Convert datetime fields to milliseconds for WatermelonDB compatibility
            # Handle datetime objects, ISO strings, and potentially corrupted numeric values
            current_time_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
            for field in ['created_at', 'updated_at']:
                if field in doc_dict:
                    value = doc_dict[field]
                    
                    # Debug logging
                    logging.info(f"[SYNC DEBUG] {field} raw value: {value}, type: {type(value)}")
                    
                    if isinstance(value, datetime):
                        # Check if datetime is near epoch (before year 2000 = corrupt)
                        if value.year < 2000:
                            doc_dict[field] = current_time_ms
                        else:
                            # Normal case: convert datetime to milliseconds
                            doc_dict[field] = int(value.timestamp() * 1000)
                    elif isinstance(value, str):
                        # ISO string format from model_dump() - parse and convert
                        try:
                            # Handle ISO format with 'Z' suffix (replace Z with +00:00)
                            iso_str = value.replace('Z', '+00:00')
                            parsed_dt = datetime.fromisoformat(iso_str)
                            if parsed_dt.tzinfo is None:
                                parsed_dt = parsed_dt.replace(tzinfo=timezone.utc)
                            doc_dict[field] = int(parsed_dt.timestamp() * 1000)
                        except Exception as e:
                            logging.warning(f"[SYNC DEBUG] Failed to parse {field}: {value}, error: {e}")
                            doc_dict[field] = current_time_ms
                    elif isinstance(value, (int, float)):
                        # Corrupted data: already a number, check if it's valid
                        if value < 1000000000000:  # Less than year 2001 in milliseconds
                            # Likely stored as seconds or is corrupt (e.g., 0)
                            # Set to current time as fallback
                            doc_dict[field] = current_time_ms
                        # else: already in milliseconds, keep as is
                    elif value is None or value == 0:
                        # Null or zero - set to current time
                        doc_dict[field] = current_time_ms
                    else:
                        # Unknown format - set to current time
                        doc_dict[field] = current_time_ms
                    
                    logging.info(f"[SYNC DEBUG] {field} final value: {doc_dict[field]}")
            return doc_dict

        # Fetch deleted record IDs since last pull
        deleted_records = await get_deleted_records(user_id, last_pulled_at_dt)

        await SyncEvent(user_id=user_id, success=True).insert()

        return {
            "patients": {
                "created": [serialize_document(p) for p in created_patients],
                "updated": [serialize_document(p) for p in updated_patients],
                "deleted": deleted_records["patients"]
            },
            "clinical_notes": {
                "created": [serialize_document(n) for n in created_notes],
                "updated": [serialize_document(n) for n in updated_notes],
                "deleted": deleted_records["clinical_notes"]
            }
        }
    except Exception as e:
        await SyncEvent(user_id=user_id, success=False).insert()
        raise e

async def push_changes(changes: Dict[str, Dict[str, List[Dict[str, Any]]]], user_id: str) -> None:
    """
    Applies changes from the client to the database.
    Uses batch queries to avoid N+1 query problems.
    """
    try:
        # Helper function to sanitize patient data
        def sanitize_patient_data(data: dict) -> dict:
            """Convert empty strings to None for optional email field"""
            if 'email' in data and data['email'] == '':
                data['email'] = None
            return data

        # Helper function to convert milliseconds timestamps to datetime
        def convert_timestamps(data: dict) -> dict:
            """Convert milliseconds timestamps from WatermelonDB to datetime objects.
            Handles missing, null, and zero values by setting current time."""
            current_time = datetime.now(timezone.utc)
            
            for field in ['created_at', 'updated_at']:
                value = data.get(field)
                
                if value is None or value == 0 or value == '':
                    # Missing or invalid - set to current time
                    data[field] = current_time
                elif isinstance(value, (int, float)):
                    # Valid milliseconds timestamp
                    if value < 1000000000000:  # Less than year ~2001 in ms (likely seconds or corrupt)
                        data[field] = current_time
                    else:
                        data[field] = datetime.fromtimestamp(value / 1000.0, tz=timezone.utc)
                elif isinstance(value, datetime):
                    # Already a datetime, keep as is
                    pass
                else:
                    # Unknown format - set to current time
                    data[field] = current_time
                    
            return data

        # Process created records (bulk insert)
        if 'patients' in changes and 'created' in changes['patients']:
            patients_to_create = []
            for patient_data in changes['patients']['created']:
                patient_data['user_id'] = user_id
                patient_data = sanitize_patient_data(patient_data)
                patient_data = convert_timestamps(patient_data)
                patients_to_create.append(Patient(**patient_data))
            if patients_to_create:
                await Patient.insert_many(patients_to_create)

        if 'clinical_notes' in changes and 'created' in changes['clinical_notes']:
            notes_to_create = []
            for note_data in changes['clinical_notes']['created']:
                note_data['user_id'] = user_id
                note_data = convert_timestamps(note_data)
                notes_to_create.append(ClinicalNote(**note_data))
            if notes_to_create:
                await ClinicalNote.insert_many(notes_to_create)

        # Process updated records with batch fetch
        if 'patients' in changes and 'updated' in changes['patients']:
            # Extract and validate all patient IDs first
            patient_updates = []
            for patient_data in changes['patients']['updated']:
                patient_id = patient_data.pop('id', None)
                if not patient_id:
                    raise ValueError("Missing 'id' field in patient update data")
                if 'updated_at' not in patient_data:
                    raise ValueError(f"Missing 'updated_at' field in patient update data for {patient_id}")
                # Convert timestamps from milliseconds to datetime for updated records
                patient_data = convert_timestamps(patient_data)
                patient_updates.append((patient_id, sanitize_patient_data(patient_data)))

            if patient_updates:
                # Batch fetch all patients at once
                patient_ids = [pid for pid, _ in patient_updates]
                existing_patients = await Patient.find(
                    {"_id": {"$in": patient_ids}, "user_id": user_id}
                ).to_list()
                patients_by_id = {str(p.id): p for p in existing_patients}

                # Process updates
                for patient_id, patient_data in patient_updates:
                    patient = patients_by_id.get(patient_id)
                    if patient:
                        # client_updated_at is already converted to datetime by convert_timestamps
                        client_updated_at = patient_data['updated_at']
                        if not isinstance(client_updated_at, datetime):
                            # Fallback if somehow not converted
                            client_updated_at = datetime.fromtimestamp(client_updated_at / 1000.0, tz=timezone.utc)
                        server_updated_at = patient.updated_at.astimezone(timezone.utc) if patient.updated_at.tzinfo else patient.updated_at.replace(tzinfo=timezone.utc)
                        if client_updated_at < server_updated_at:
                            raise SyncConflictException(f"Conflict detected for patient {patient_id}")
                        patient_data['updated_at'] = datetime.now(timezone.utc)
                        await patient.update({"$set": patient_data})

        if 'clinical_notes' in changes and 'updated' in changes['clinical_notes']:
            # Extract and validate all note IDs first
            note_updates = []
            for note_data in changes['clinical_notes']['updated']:
                note_id = note_data.pop('id', None)
                if not note_id:
                    raise ValueError("Missing 'id' field in clinical note update data")
                # Convert timestamps from milliseconds to datetime for updated records
                note_data = convert_timestamps(note_data)
                note_updates.append((note_id, note_data))

            if note_updates:
                # Batch fetch all notes at once
                note_ids = [nid for nid, _ in note_updates]
                existing_notes = await ClinicalNote.find(
                    {"_id": {"$in": note_ids}, "user_id": user_id}
                ).to_list()
                notes_by_id = {str(n.id): n for n in existing_notes}

                # Process updates
                for note_id, note_data in note_updates:
                    note = notes_by_id.get(note_id)
                    if note:
                        note_data['updated_at'] = datetime.now(timezone.utc)
                        await note.update({"$set": note_data})

        # Process deleted records with soft delete (mark as deleted instead of removing)
        # This allows deleted records to be synced to other clients
        if 'patients' in changes and 'deleted' in changes['patients']:
            patient_ids_to_delete = changes['patients']['deleted']
            if patient_ids_to_delete:
                # Soft delete: set deleted_at timestamp instead of removing
                current_time = datetime.now(timezone.utc)
                await Patient.find(
                    {"_id": {"$in": patient_ids_to_delete}, "user_id": user_id}
                ).update_many({"$set": {"deleted_at": current_time}})

        if 'clinical_notes' in changes and 'deleted' in changes['clinical_notes']:
            note_ids_to_delete = changes['clinical_notes']['deleted']
            if note_ids_to_delete:
                # Soft delete: set deleted_at timestamp instead of removing
                current_time = datetime.now(timezone.utc)
                await ClinicalNote.find(
                    {"_id": {"$in": note_ids_to_delete}, "user_id": user_id}
                ).update_many({"$set": {"deleted_at": current_time}})

        await SyncEvent(user_id=user_id, success=True).insert()
    except Exception as e:
        await SyncEvent(user_id=user_id, success=False).insert()
        raise e