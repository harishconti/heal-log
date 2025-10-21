import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from app.models.patient import Patient
from app.models.clinical_note import ClinicalNote
from app.schemas.sync import SyncRequest, SyncResponse, PullChangesResponse
from app.services.sync_service import pull_changes, push_changes
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/pull", response_model=PullChangesResponse)
async def pull_changes_endpoint(
    sync_request: SyncRequest,
    current_user_id: str = Depends(get_current_user)
):
    """
    Handles the pull part of the synchronization process.
    The client sends the last time it pulled, and the server returns all changes since then.
    """
    try:
        changes = await pull_changes(sync_request.last_pulled_at, current_user_id)
        return {"changes": changes, "timestamp": int(datetime.now(timezone.utc).timestamp() * 1000)}
    except Exception as e:
        logging.error(f"Error during pull sync: {e}")
        raise HTTPException(status_code=500, detail="Error processing pull sync")

@router.post("/push")
async def push_changes_endpoint(
    sync_request: SyncRequest,
    current_user_id: str = Depends(get_current_user)
):
    """
    Handles the push part of the synchronization process.
    The client sends its local changes, and the server applies them.
    """
    try:
        await push_changes(sync_request.changes, current_user_id)
        return {"status": "ok"}
    except Exception as e:
        logging.error(f"Error during push sync: {e}")
        raise HTTPException(status_code=500, detail="Error processing push sync")