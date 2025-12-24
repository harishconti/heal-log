from app.schemas.clinical_note import ClinicalNote, NoteCreate
from typing import List
import uuid

async def create_note(patient_id: str, note_data: NoteCreate, user_id: str) -> ClinicalNote:
    """
    Creates a new clinical note for a patient.
    """
    note = ClinicalNote(
        id=str(uuid.uuid4()),
        patient_id=patient_id,
        user_id=user_id,
        content=note_data.content,
        visit_type=note_data.visit_type
    )
    await note.insert()
    return note

async def get_notes_for_patient(
    patient_id: str,
    user_id: str,
    skip: int = 0,
    limit: int = 100
) -> List[ClinicalNote]:
    """
    Retrieves clinical notes for a specific patient that belong to the user.
    Supports pagination with skip and limit parameters.
    """
    return await ClinicalNote.find(
        ClinicalNote.patient_id == patient_id,
        ClinicalNote.user_id == user_id
    ).sort(-ClinicalNote.created_at).skip(skip).limit(limit).to_list()