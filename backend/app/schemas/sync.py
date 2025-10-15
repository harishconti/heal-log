from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.schemas.patient import PatientResponse
from app.schemas.clinical_note import ClinicalNoteResponse

class SyncRequest(BaseModel):
    last_pulled_at: Optional[int] = None
    changes: Optional[Dict[str, Dict[str, List[Any]]]] = None

class PullChanges(BaseModel):
    patients: Dict[str, List[PatientResponse]]
    clinical_notes: Dict[str, List[ClinicalNoteResponse]]

class PullChangesResponse(BaseModel):
    changes: PullChanges
    timestamp: int

class SyncResponse(BaseModel):
    status: str