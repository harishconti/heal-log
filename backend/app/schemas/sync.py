from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class SyncRequest(BaseModel):
    last_pulled_at: Optional[int] = None
    changes: Optional[Dict[str, Dict[str, List[Any]]]] = None

class PullChanges(BaseModel):
    """
    Using Dict[str, List[Any]] instead of specific response models to prevent 
    Pydantic from re-serializing integer timestamps (milliseconds) back to datetime strings.
    WatermelonDB expects timestamps as milliseconds integers, not ISO date strings.
    """
    patients: Dict[str, List[Any]]
    clinical_notes: Dict[str, List[Any]]

class PullChangesResponse(BaseModel):
    changes: PullChanges
    timestamp: int

class SyncResponse(BaseModel):
    status: str