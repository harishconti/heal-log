import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.core.exceptions import SyncConflictException
from app.core.security import get_current_user
from app.schemas.sync import PullChangesResponse, SyncRequest
from app.services.sync_service import pull_changes, push_changes
from app.schemas.user import User


router = APIRouter()

@router.post("/pull", response_model=PullChangesResponse)
async def pull_changes_endpoint(
    sync_request: SyncRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Handles the pull part of the synchronization process.
    The client sends the last time it pulled, and the server returns all changes since then.
    """
    try:
        changes = await pull_changes(sync_request.last_pulled_at, current_user.id)
        return {"changes": changes, "timestamp": int(datetime.now(timezone.utc).timestamp() * 1000)}
    except ValueError as e:
        logging.error(f"Pull sync validation error: {e}", exc_info=True)
        raise SyncConflictException(detail=str(e))

@router.post("/push")
async def push_changes_endpoint(
    sync_request: SyncRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Handles the push part of the synchronization process.
    The client sends its local changes, and the server applies them.
    """
    try:
        await push_changes(sync_request.changes, current_user.id)
        return {"status": "ok"}
    except ValueError as e:
        logging.error(f"Push sync validation error: {e}", exc_info=True)
        raise SyncConflictException(detail=str(e))
