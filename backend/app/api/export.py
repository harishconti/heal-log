from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from app.core.security import get_current_user
from app.schemas.user import User
from app.schemas.patient import Patient
from app.schemas.clinical_note import ClinicalNote
from app.core.limiter import limiter
from datetime import datetime
import csv
import io
import logging

router = APIRouter()


def generate_patients_csv(patients: list) -> str:
    """Generate CSV content from patient data."""
    output = io.StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow([
        "Patient ID", "Name", "Phone", "Email", "Address", "Location",
        "Initial Complaint", "Initial Diagnosis", "Group", "Is Favorite",
        "Created At", "Updated At"
    ])

    # Write data rows
    for patient in patients:
        writer.writerow([
            patient.patient_id,
            patient.name,
            patient.phone or "",
            patient.email or "",
            patient.address or "",
            patient.location or "",
            patient.initial_complaint or "",
            patient.initial_diagnosis or "",
            patient.group or "",
            "Yes" if patient.is_favorite else "No",
            patient.created_at.isoformat() if patient.created_at else "",
            patient.updated_at.isoformat() if patient.updated_at else ""
        ])

    return output.getvalue()


def generate_notes_csv(notes: list, patients_by_id: dict) -> str:
    """Generate CSV content from clinical notes data."""
    output = io.StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow([
        "Note ID", "Patient ID", "Patient Name", "Content", "Visit Type",
        "Created At", "Updated At"
    ])

    # Write data rows
    for note in notes:
        patient = patients_by_id.get(note.patient_id)
        patient_name = patient.name if patient else "Unknown"
        writer.writerow([
            note.id,
            note.patient_id,
            patient_name,
            note.content,
            note.visit_type,
            note.created_at.isoformat() if note.created_at else "",
            note.updated_at.isoformat() if note.updated_at else ""
        ])

    return output.getvalue()


@router.get("/patients", response_class=StreamingResponse)
@limiter.limit("5/minute")
async def export_patients(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Export all patient records as CSV.
    This endpoint supports GDPR data portability requirements.
    """
    try:
        patients = await Patient.find(Patient.user_id == current_user.id).to_list()

        csv_content = generate_patients_csv(patients)

        filename = f"patients_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "text/csv; charset=utf-8"
            }
        )
    except Exception as e:
        logging.error(f"Error exporting patients for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while exporting patient data."
        )


@router.get("/notes", response_class=StreamingResponse)
@limiter.limit("5/minute")
async def export_notes(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Export all clinical notes as CSV.
    This endpoint supports GDPR data portability requirements.
    """
    try:
        # Fetch all notes and patients for the user
        notes = await ClinicalNote.find(ClinicalNote.user_id == current_user.id).to_list()
        patients = await Patient.find(Patient.user_id == current_user.id).to_list()

        # Create a lookup dict for patient names
        patients_by_id = {p.id: p for p in patients}

        csv_content = generate_notes_csv(notes, patients_by_id)

        filename = f"clinical_notes_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "text/csv; charset=utf-8"
            }
        )
    except Exception as e:
        logging.error(f"Error exporting notes for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while exporting clinical notes."
        )


@router.get("/all", response_class=StreamingResponse)
@limiter.limit("2/minute")
async def export_all_data(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Export all user data as a combined CSV (GDPR "Download my data").
    Returns a single CSV with patients followed by notes.
    """
    try:
        # Fetch all data
        patients = await Patient.find(Patient.user_id == current_user.id).to_list()
        notes = await ClinicalNote.find(ClinicalNote.user_id == current_user.id).to_list()

        patients_by_id = {p.id: p for p in patients}

        # Generate combined output
        output = io.StringIO()

        # Add patients section
        output.write("=== PATIENTS ===\n")
        output.write(generate_patients_csv(patients))
        output.write("\n\n")

        # Add notes section
        output.write("=== CLINICAL NOTES ===\n")
        output.write(generate_notes_csv(notes, patients_by_id))

        # Add export metadata
        output.write("\n\n=== EXPORT METADATA ===\n")
        output.write(f"Export Date: {datetime.now().isoformat()}\n")
        output.write(f"User ID: {current_user.id}\n")
        output.write(f"Total Patients: {len(patients)}\n")
        output.write(f"Total Clinical Notes: {len(notes)}\n")

        filename = f"full_data_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "text/csv; charset=utf-8"
            }
        )
    except Exception as e:
        logging.error(f"Error exporting all data for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while exporting data."
        )
