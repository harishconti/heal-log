from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from typing import List, Optional
from app.core.security import get_current_user, require_pro_user, require_role
from app.schemas.role import UserRole
from app.services.patient_service import patient_service
from app.core.limiter import limiter
from app.schemas.patient import (
    PatientCreate, PatientUpdate, PatientResponse
)
from app.schemas.clinical_note import NoteCreate, ClinicalNoteResponse
from app.schemas.user import User

router = APIRouter()

import logging

@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def create_patient(
    request: Request,
    patient_data: PatientCreate,
    current_user: User = Depends(require_role(UserRole.DOCTOR))
):
    """
    Create a new patient record. (Doctor-only)
    """
    try:
        patient = await patient_service.create(patient_data, current_user.id)
        return patient
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        logging.error(f"Error creating patient for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the patient."
        )

@router.get("/", response_model=List[PatientResponse])
@limiter.limit("60/minute")
async def get_all_patients(
    request: Request,
    search: Optional[str] = None,
    group: Optional[str] = None,
    favorites_only: bool = False,
    skip: int = Query(0, ge=0, description="Number of patients to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum patients to return"),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all patients for the current user, with optional filters.
    Supports pagination with skip and limit parameters.
    """
    try:
        patients = await patient_service.get_patients_by_user_id(
            user_id=current_user.id,
            search=search,
            group=group,
            favorites_only=favorites_only,
            skip=skip,
            limit=limit
        )
        return patients
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logging.error(f"Error fetching patients for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching patients."
        )

# --- Utility Routes (MUST be defined BEFORE /{id} routes to avoid path conflicts) ---

@router.get("/groups/", response_model=dict)
@limiter.limit("60/minute")
async def get_patient_groups(request: Request, current_user: User = Depends(get_current_user)):
    """
    Get a list of unique patient groups for the user.
    """
    try:
        groups = await patient_service.get_patient_groups(current_user.id)
        return {"success": True, "groups": groups}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logging.error(f"Error fetching groups for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching groups."
        )

@router.get("/stats/", response_model=dict)
@limiter.limit("30/minute")
async def get_statistics(request: Request, current_user: User = Depends(get_current_user)):
    """
    Get user-specific statistics (total patients, favorites, etc.).
    """
    try:
        stats = await patient_service.get_user_stats(current_user.id)
        return {"success": True, "stats": stats}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logging.error(f"Error fetching stats for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching statistics."
        )

@router.get("/pro-feature/", response_model=dict)
@limiter.limit("30/minute")
async def pro_feature_endpoint(request: Request, current_user: User = Depends(require_pro_user)):
    """
    An example endpoint that is only accessible to PRO users.
    """
    return {"success": True, "message": f"Welcome, PRO user {current_user.id}! You have access to this exclusive feature."}

# --- Single Patient Routes (/{id} patterns MUST come after static paths) ---

@router.get("/{id}", response_model=PatientResponse)
@limiter.limit("120/minute")
async def get_patient_by_id(
    request: Request,
    id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve a single patient by their unique ID.
    """
    patient = await patient_service.get(id, user_id=current_user.id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient

@router.put("/{id}", response_model=PatientResponse)
@limiter.limit("30/minute")
async def update_patient(
    request: Request,
    id: str,
    patient_data: PatientUpdate,
    current_user: User = Depends(require_role(UserRole.DOCTOR))
):
    """
    Update a patient's details. (Doctor-only)
    """
    patient = await patient_service.update(id, patient_data, current_user.id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient

@router.delete("/{id}", response_model=dict)
@limiter.limit("10/minute")
async def delete_patient(
    request: Request,
    id: str,
    current_user: User = Depends(require_role(UserRole.DOCTOR))
):
    """
    Delete a patient record. (Doctor-only)
    """
    success = await patient_service.delete(id, current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return {"success": True, "message": "Patient deleted successfully"}

# --- Notes Routes ---

@router.post("/{id}/notes", response_model=ClinicalNoteResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("45/minute")
async def add_patient_note(
    request: Request,
    id: str,
    note_data: NoteCreate,
    current_user: User = Depends(require_role(UserRole.DOCTOR))
):
    """
    Add a new note to a patient's record. (Doctor-only)
    """
    note = await patient_service.add_note_to_patient(id, note_data, current_user.id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return note

@router.get("/{id}/notes", response_model=List[ClinicalNoteResponse])
@limiter.limit("120/minute")
async def get_patient_notes(
    request: Request,
    id: str,
    skip: int = Query(0, ge=0, description="Number of notes to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum notes to return"),
    current_user: User = Depends(get_current_user)
):
    """
    Get notes for a specific patient with pagination support.
    """
    notes = await patient_service.get_patient_notes(id, current_user.id, skip=skip, limit=limit)
    if notes is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return notes
