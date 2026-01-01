from fastapi import APIRouter, status, Request, HTTPException, Depends
from app.core.security import require_role, get_current_user
from app.core.config import settings
from app.schemas.role import UserRole
from app.schemas.clinical_note import ClinicalNote
from app.schemas.patient import Patient
from datetime import datetime, timezone
import logging

router = APIRouter()


def check_debug_enabled():
    """
    Dependency to ensure debug endpoints are only available in non-production environments.
    """
    if settings.ENV == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Debug endpoints are disabled in production"
        )


@router.post("/clear-all-caches", response_model=dict, dependencies=[Depends(check_debug_enabled)])
async def clear_all_caches(
    request: Request,
    current_user=Depends(require_role(UserRole.ADMIN))
):
    """
    A debug endpoint to clear all application-level caches.
    Requires admin role and is disabled in production.
    """
    logging.info(f"Admin user {current_user.email} requested cache clear")
    try:
        from fastapi_cache import FastAPICache

        if FastAPICache.get_backend():
            # Clear patient service caches
            await FastAPICache.clear(namespace="get_patients_by_user_id")
            await FastAPICache.clear(namespace="get_patient_groups")
            await FastAPICache.clear(namespace="get_user_stats")

            # Clear analytics service caches
            await FastAPICache.clear(namespace="get_patient_growth_analytics")

            logging.info("Cleared application caches via FastAPICache.")
        else:
            logging.warning("No FastAPICache backend configured.")

        logging.info("All application caches cleared successfully.")
        return {"success": True, "message": "All caches cleared"}
    except Exception as e:
        logging.error(f"Error clearing caches: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear caches."
        )


@router.get("/sentry-test", dependencies=[Depends(check_debug_enabled)])
async def sentry_test(current_user=Depends(require_role(UserRole.ADMIN))):
    """
    Raises an exception to test Sentry's automatic error reporting.
    Requires admin role and is disabled in production.
    """
    logging.info(f"Admin user {current_user.email} triggered Sentry test")
    raise Exception("Sentry test exception from debug endpoint.")


@router.post("/repair-timestamps")
async def repair_timestamps(current_user=Depends(get_current_user)):
    """
    Repairs corrupted timestamps in clinical_notes and patients collections.
    Finds records where timestamps are stored as numbers (incorrect) instead of datetime.
    This fixes the "Jan 1, 1970" display issue caused by corrupt timestamp data.
    """
    logging.info(f"User {current_user.email} requested timestamp repair")

    repaired_notes = 0
    repaired_patients = 0
    current_time = datetime.now(timezone.utc)

    try:
        # Find and repair clinical notes for this user
        notes = await ClinicalNote.find(ClinicalNote.user_id == str(current_user.id)).to_list()
        for note in notes:
            needs_update = False
            update_fields = {}

            # Check created_at
            if note.created_at is None:
                update_fields['created_at'] = current_time
                needs_update = True
            elif isinstance(note.created_at, (int, float)):
                # Stored as number - needs conversion
                if note.created_at < 1000000000:  # Very small, likely corrupt
                    update_fields['created_at'] = current_time
                else:
                    # Convert from milliseconds or seconds
                    ts = note.created_at / 1000 if note.created_at > 1000000000000 else note.created_at
                    update_fields['created_at'] = datetime.fromtimestamp(ts, tz=timezone.utc)
                needs_update = True
            elif isinstance(note.created_at, datetime) and note.created_at.year < 2000:
                # Datetime but invalid (epoch or close to it)
                update_fields['created_at'] = current_time
                needs_update = True

            # Check updated_at
            if note.updated_at is None:
                update_fields['updated_at'] = current_time
                needs_update = True
            elif isinstance(note.updated_at, (int, float)):
                if note.updated_at < 1000000000:
                    update_fields['updated_at'] = current_time
                else:
                    ts = note.updated_at / 1000 if note.updated_at > 1000000000000 else note.updated_at
                    update_fields['updated_at'] = datetime.fromtimestamp(ts, tz=timezone.utc)
                needs_update = True
            elif isinstance(note.updated_at, datetime) and note.updated_at.year < 2000:
                update_fields['updated_at'] = current_time
                needs_update = True

            if needs_update:
                await note.update({"$set": update_fields})
                repaired_notes += 1
                logging.info(f"Repaired note {note.id}: {update_fields}")

        # Find and repair patients for this user
        patients = await Patient.find(Patient.user_id == str(current_user.id)).to_list()
        for patient in patients:
            needs_update = False
            update_fields = {}

            # Check created_at
            if patient.created_at is None:
                update_fields['created_at'] = current_time
                needs_update = True
            elif isinstance(patient.created_at, (int, float)):
                if patient.created_at < 1000000000:
                    update_fields['created_at'] = current_time
                else:
                    ts = patient.created_at / 1000 if patient.created_at > 1000000000000 else patient.created_at
                    update_fields['created_at'] = datetime.fromtimestamp(ts, tz=timezone.utc)
                needs_update = True
            elif isinstance(patient.created_at, datetime) and patient.created_at.year < 2000:
                update_fields['created_at'] = current_time
                needs_update = True

            # Check updated_at
            if patient.updated_at is None:
                update_fields['updated_at'] = current_time
                needs_update = True
            elif isinstance(patient.updated_at, (int, float)):
                if patient.updated_at < 1000000000:
                    update_fields['updated_at'] = current_time
                else:
                    ts = patient.updated_at / 1000 if patient.updated_at > 1000000000000 else patient.updated_at
                    update_fields['updated_at'] = datetime.fromtimestamp(ts, tz=timezone.utc)
                needs_update = True
            elif isinstance(patient.updated_at, datetime) and patient.updated_at.year < 2000:
                update_fields['updated_at'] = current_time
                needs_update = True

            if needs_update:
                await patient.update({"$set": update_fields})
                repaired_patients += 1
                logging.info(f"Repaired patient {patient.id}: {update_fields}")

        logging.info(f"Timestamp repair complete: {repaired_notes} notes, {repaired_patients} patients")
        return {
            "success": True,
            "repaired_notes": repaired_notes,
            "repaired_patients": repaired_patients,
            "message": f"Repaired {repaired_notes} notes and {repaired_patients} patients"
        }

    except Exception as e:
        logging.error(f"Error repairing timestamps: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to repair timestamps: {str(e)}"
        )


@router.get("/sync-preview")
async def sync_preview(current_user=Depends(get_current_user)):
    """
    Debug endpoint to preview what the sync pull would return.
    This helps diagnose timestamp format issues.
    """
    logging.info(f"User {current_user.email} requested sync preview")
    
    try:
        from app.services.sync_service import pull_changes
        
        # Get all changes (last_pulled_at = 0 means get everything)
        changes = await pull_changes(0, str(current_user.id))
        
        # Extract sample data for debugging
        sample_note = None
        sample_patient = None
        
        if changes.get('clinical_notes', {}).get('created'):
            sample_note = changes['clinical_notes']['created'][0]
        
        if changes.get('patients', {}).get('created'):
            sample_patient = changes['patients']['created'][0]
        
        return {
            "success": True,
            "notes_count": len(changes.get('clinical_notes', {}).get('created', [])),
            "patients_count": len(changes.get('patients', {}).get('created', [])),
            "sample_note": sample_note,
            "sample_patient": sample_patient,
            "message": "Check sample_note.created_at - should be milliseconds timestamp like 1767288299392"
        }
        
    except Exception as e:
        logging.error(f"Error in sync preview: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to preview sync: {str(e)}"
        )