from datetime import datetime, timezone
import logging
import asyncio
from app.schemas.patient import Patient
from app.schemas.clinical_note import ClinicalNote
from app.schemas.sync_event import SyncEvent
from typing import Dict, Any, List, Optional, Tuple
from app.core.exceptions import SyncConflictException
from app.core.config import settings

# Configuration - can be overridden via environment variables
MAX_SYNC_RECORDS = getattr(settings, 'MAX_SYNC_RECORDS', 5000)
DEFAULT_BATCH_SIZE = getattr(settings, 'SYNC_BATCH_SIZE', 500)
MIN_BATCH_SIZE = getattr(settings, 'MIN_SYNC_BATCH_SIZE', 50)


def serialize_document(doc, current_time_ms: Optional[int] = None) -> dict:
    """
    Serialize a document for sync response.
    Converts datetime fields to milliseconds for WatermelonDB compatibility.
    Handles datetime objects, ISO strings, and potentially corrupted numeric values.
    """
    if current_time_ms is None:
        current_time_ms = int(datetime.now(timezone.utc).timestamp() * 1000)

    doc_dict = doc.model_dump(mode='python')
    doc_dict["id"] = str(doc.id)

    for field in ['created_at', 'updated_at']:
        if field in doc_dict:
            value = doc_dict[field]

            if isinstance(value, datetime):
                # Check if datetime is near epoch (before year 2000 = corrupt)
                if value.year < 2000:
                    doc_dict[field] = current_time_ms
                else:
                    doc_dict[field] = int(value.timestamp() * 1000)
            elif isinstance(value, str):
                # ISO string format from model_dump() - parse and convert
                try:
                    iso_str = value.replace('Z', '+00:00')
                    parsed_dt = datetime.fromisoformat(iso_str)
                    if parsed_dt.tzinfo is None:
                        parsed_dt = parsed_dt.replace(tzinfo=timezone.utc)
                    doc_dict[field] = int(parsed_dt.timestamp() * 1000)
                except Exception as e:
                    logging.warning(f"[SYNC] Failed to parse {field}: {value}, error: {e}")
                    doc_dict[field] = current_time_ms
            elif isinstance(value, (int, float)):
                # Corrupted data: already a number, check if it's valid
                if value < 1000000000000:  # Less than year 2001 in milliseconds
                    doc_dict[field] = current_time_ms
                # else: already in milliseconds, keep as is
            elif value is None or value == 0:
                doc_dict[field] = current_time_ms
            else:
                doc_dict[field] = current_time_ms

    return doc_dict


def ensure_timezone_aware(dt: datetime) -> datetime:
    """Ensure datetime is timezone-aware (UTC)."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


async def get_sync_stats(user_id: str, last_pulled_at: Optional[int]) -> Dict[str, int]:
    """
    Get count of records that need to be synced.
    Useful for progress indication and batch size optimization.
    Uses asyncio.gather() for parallel query execution.
    """
    try:
        last_pulled_at_dt = datetime.fromtimestamp(last_pulled_at / 1000.0, tz=timezone.utc) if last_pulled_at else datetime.min.replace(tzinfo=timezone.utc)

        # Execute all count queries in parallel for better performance
        created_patients_count, updated_patients_count, created_notes_count, updated_notes_count = await asyncio.gather(
            # Count created patients
            Patient.find(
                Patient.user_id == user_id,
                Patient.created_at > last_pulled_at_dt,
                {"$or": [{"deleted_at": {"$exists": False}}, {"deleted_at": None}]}
            ).count(),
            # Count updated patients
            Patient.find(
                Patient.user_id == user_id,
                Patient.created_at <= last_pulled_at_dt,
                Patient.updated_at > last_pulled_at_dt,
                {"$or": [{"deleted_at": {"$exists": False}}, {"deleted_at": None}]}
            ).count(),
            # Count created notes
            ClinicalNote.find(
                ClinicalNote.user_id == user_id,
                ClinicalNote.created_at > last_pulled_at_dt,
                {"$or": [{"deleted_at": {"$exists": False}}, {"deleted_at": None}]}
            ).count(),
            # Count updated notes
            ClinicalNote.find(
                ClinicalNote.user_id == user_id,
                ClinicalNote.created_at <= last_pulled_at_dt,
                ClinicalNote.updated_at > last_pulled_at_dt,
                {"$or": [{"deleted_at": {"$exists": False}}, {"deleted_at": None}]}
            ).count()
        )

        return {
            "patients_created": created_patients_count,
            "patients_updated": updated_patients_count,
            "notes_created": created_notes_count,
            "notes_updated": updated_notes_count,
            "total": created_patients_count + updated_patients_count + created_notes_count + updated_notes_count
        }
    except Exception as e:
        logging.warning(f"[SYNC] Error getting sync stats: {e}")
        return {"patients_created": 0, "patients_updated": 0, "notes_created": 0, "notes_updated": 0, "total": 0}


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


async def pull_changes_batched(
    last_pulled_at: int,
    user_id: str,
    batch_size: int = DEFAULT_BATCH_SIZE,
    cursor_patient: Optional[str] = None,
    cursor_note: Optional[str] = None,
    # Legacy skip-based parameters (deprecated, kept for backward compatibility)
    skip_patients: int = 0,
    skip_notes: int = 0
) -> Dict[str, Any]:
    """
    Fetches changes in batches for more efficient sync of large datasets.
    Uses cursor-based pagination for O(1) performance regardless of dataset size.

    Args:
        last_pulled_at: Timestamp in milliseconds of last pull
        user_id: User ID for filtering
        batch_size: Number of records per batch
        cursor_patient: Last patient created_at timestamp for cursor-based pagination
        cursor_note: Last note created_at timestamp for cursor-based pagination
        skip_patients: (Deprecated) Legacy skip-based offset for patients
        skip_notes: (Deprecated) Legacy skip-based offset for notes

    Returns has_more flag and cursors for next batch.
    """
    batch_size = max(MIN_BATCH_SIZE, min(batch_size, MAX_SYNC_RECORDS))
    current_time_ms = int(datetime.now(timezone.utc).timestamp() * 1000)

    try:
        last_pulled_at_dt = datetime.fromtimestamp(last_pulled_at / 1000.0, tz=timezone.utc) if last_pulled_at else datetime.min.replace(tzinfo=timezone.utc)

        # Build patient query with cursor-based pagination (more efficient than skip)
        patient_base_query = {
            "$and": [
                {"user_id": user_id},
                {"$or": [
                    {"created_at": {"$gt": last_pulled_at_dt}},
                    {"$and": [{"created_at": {"$lte": last_pulled_at_dt}}, {"updated_at": {"$gt": last_pulled_at_dt}}]}
                ]},
                {"$or": [{"deleted_at": {"$exists": False}}, {"deleted_at": None}]}
            ]
        }

        # Add cursor filter for efficient pagination (O(1) vs O(n) for skip)
        if cursor_patient:
            cursor_dt = datetime.fromtimestamp(int(cursor_patient) / 1000.0, tz=timezone.utc)
            patient_base_query["$and"].append({"created_at": {"$gt": cursor_dt}})

        # Build note query with cursor-based pagination
        note_base_query = {
            "$and": [
                {"user_id": user_id},
                {"$or": [
                    {"created_at": {"$gt": last_pulled_at_dt}},
                    {"$and": [{"created_at": {"$lte": last_pulled_at_dt}}, {"updated_at": {"$gt": last_pulled_at_dt}}]}
                ]},
                {"$or": [{"deleted_at": {"$exists": False}}, {"deleted_at": None}]}
            ]
        }

        if cursor_note:
            cursor_dt = datetime.fromtimestamp(int(cursor_note) / 1000.0, tz=timezone.utc)
            note_base_query["$and"].append({"created_at": {"$gt": cursor_dt}})

        # Execute queries in parallel for better performance
        patients_task = Patient.find(patient_base_query).sort("+created_at").limit(batch_size + 1).to_list()
        notes_task = ClinicalNote.find(note_base_query).sort("+created_at").limit(batch_size + 1).to_list()

        # Fetch deleted records only on first batch
        is_first_batch = not cursor_patient and not cursor_note and skip_patients == 0 and skip_notes == 0
        if is_first_batch:
            patients, notes, deleted_records = await asyncio.gather(
                patients_task,
                notes_task,
                get_deleted_records(user_id, last_pulled_at_dt)
            )
        else:
            patients, notes = await asyncio.gather(patients_task, notes_task)
            deleted_records = {"patients": [], "clinical_notes": []}

        # Determine if there are more records
        has_more_patients = len(patients) > batch_size
        has_more_notes = len(notes) > batch_size

        if has_more_patients:
            patients = patients[:batch_size]
        if has_more_notes:
            notes = notes[:batch_size]

        # Get cursors for next batch (use the last record's created_at)
        next_cursor_patient = None
        next_cursor_note = None

        if has_more_patients and patients:
            last_patient = patients[-1]
            next_cursor_patient = str(int(ensure_timezone_aware(last_patient.created_at).timestamp() * 1000))

        if has_more_notes and notes:
            last_note = notes[-1]
            next_cursor_note = str(int(ensure_timezone_aware(last_note.created_at).timestamp() * 1000))

        # Separate into created/updated
        created_patients = [p for p in patients if ensure_timezone_aware(p.created_at) > last_pulled_at_dt]
        updated_patients = [p for p in patients if ensure_timezone_aware(p.created_at) <= last_pulled_at_dt]
        created_notes = [n for n in notes if ensure_timezone_aware(n.created_at) > last_pulled_at_dt]
        updated_notes = [n for n in notes if ensure_timezone_aware(n.created_at) <= last_pulled_at_dt]

        return {
            "changes": {
                "patients": {
                    "created": [serialize_document(p, current_time_ms) for p in created_patients],
                    "updated": [serialize_document(p, current_time_ms) for p in updated_patients],
                    "deleted": deleted_records["patients"]
                },
                "clinical_notes": {
                    "created": [serialize_document(n, current_time_ms) for n in created_notes],
                    "updated": [serialize_document(n, current_time_ms) for n in updated_notes],
                    "deleted": deleted_records["clinical_notes"]
                }
            },
            "has_more": has_more_patients or has_more_notes,
            # Cursor-based pagination (preferred)
            "cursor_patient": next_cursor_patient,
            "cursor_note": next_cursor_note,
            # Legacy skip-based pagination (deprecated, kept for backward compatibility)
            "next_skip_patients": skip_patients + len(patients) if has_more_patients else 0,
            "next_skip_notes": skip_notes + len(notes) if has_more_notes else 0,
            "timestamp": current_time_ms
        }
    except Exception as e:
        logging.error(f"[SYNC] Batched pull error: {e}")
        raise e


async def pull_changes(last_pulled_at: int, user_id: str) -> Dict[str, Any]:
    """
    Fetches changes from the database since the last pull time.
    Uses asyncio.gather() for parallel query execution and extracted serialization.
    """
    try:
        # Convert last_pulled_at from milliseconds timestamp to a timezone-aware datetime object
        last_pulled_at_dt = datetime.fromtimestamp(last_pulled_at / 1000.0, tz=timezone.utc) if last_pulled_at else datetime.min.replace(tzinfo=timezone.utc)
        current_time_ms = int(datetime.now(timezone.utc).timestamp() * 1000)

        # Execute all queries in parallel for better performance
        created_patients, updated_patients, created_notes, updated_notes, deleted_records = await asyncio.gather(
            # Fetch created patients (created AFTER last pull, excluding soft-deleted)
            Patient.find(
                Patient.user_id == user_id,
                Patient.created_at > last_pulled_at_dt,
                {"$or": [{"deleted_at": {"$exists": False}}, {"deleted_at": None}]}
            ).limit(MAX_SYNC_RECORDS).to_list(),

            # Fetch updated patients (created BEFORE last pull, but updated AFTER, excluding soft-deleted)
            Patient.find(
                Patient.user_id == user_id,
                Patient.created_at <= last_pulled_at_dt,
                Patient.updated_at > last_pulled_at_dt,
                {"$or": [{"deleted_at": {"$exists": False}}, {"deleted_at": None}]}
            ).limit(MAX_SYNC_RECORDS).to_list(),

            # Fetch created notes
            ClinicalNote.find(
                ClinicalNote.user_id == user_id,
                ClinicalNote.created_at > last_pulled_at_dt,
                {"$or": [{"deleted_at": {"$exists": False}}, {"deleted_at": None}]}
            ).limit(MAX_SYNC_RECORDS).to_list(),

            # Fetch updated notes
            ClinicalNote.find(
                ClinicalNote.user_id == user_id,
                ClinicalNote.created_at <= last_pulled_at_dt,
                ClinicalNote.updated_at > last_pulled_at_dt,
                {"$or": [{"deleted_at": {"$exists": False}}, {"deleted_at": None}]}
            ).limit(MAX_SYNC_RECORDS).to_list(),

            # Fetch deleted records
            get_deleted_records(user_id, last_pulled_at_dt)
        )

        # Log warning if any limits were reached
        if len(created_patients) == MAX_SYNC_RECORDS or len(updated_patients) == MAX_SYNC_RECORDS:
            logging.warning(f"[SYNC] User {user_id} hit sync limit ({MAX_SYNC_RECORDS}) for patients - consider incremental sync")
        if len(created_notes) == MAX_SYNC_RECORDS or len(updated_notes) == MAX_SYNC_RECORDS:
            logging.warning(f"[SYNC] User {user_id} hit sync limit ({MAX_SYNC_RECORDS}) for notes - consider incremental sync")

        await SyncEvent(user_id=user_id, success=True).insert()

        return {
            "patients": {
                "created": [serialize_document(p, current_time_ms) for p in created_patients],
                "updated": [serialize_document(p, current_time_ms) for p in updated_patients],
                "deleted": deleted_records["patients"]
            },
            "clinical_notes": {
                "created": [serialize_document(n, current_time_ms) for n in created_notes],
                "updated": [serialize_document(n, current_time_ms) for n in updated_notes],
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

                # Process updates with ownership validation
                for patient_id, patient_data in patient_updates:
                    patient = patients_by_id.get(patient_id)
                    if patient:
                        # SECURITY: Defense-in-depth ownership validation
                        # The batch query above already filters by user_id, but we verify again
                        if str(patient.user_id) != str(user_id):
                            logging.warning(f"[SYNC] Ownership violation attempt: user {user_id} tried to update patient {patient_id}")
                            continue  # Skip this patient silently

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
                    else:
                        # Patient not found - could be deleted or ownership mismatch
                        logging.debug(f"[SYNC] Patient {patient_id} not found for user {user_id} during sync update")

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

                # Process updates with ownership validation
                for note_id, note_data in note_updates:
                    note = notes_by_id.get(note_id)
                    if note:
                        # SECURITY: Defense-in-depth ownership validation
                        if str(note.user_id) != str(user_id):
                            logging.warning(f"[SYNC] Ownership violation attempt: user {user_id} tried to update note {note_id}")
                            continue  # Skip this note silently

                        note_data['updated_at'] = datetime.now(timezone.utc)
                        await note.update({"$set": note_data})
                    else:
                        # Note not found - could be deleted or ownership mismatch
                        logging.debug(f"[SYNC] Note {note_id} not found for user {user_id} during sync update")

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