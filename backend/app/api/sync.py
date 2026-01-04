import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Request, Query

from app.core.exceptions import SyncConflictException
from app.core.limiter import limiter
from app.core.security import get_current_user
from app.schemas.sync import PullChangesResponse, SyncRequest
from app.services.sync_service import pull_changes, push_changes, pull_changes_batched, get_sync_stats
from app.schemas.user import User


router = APIRouter()

@router.post("/pull", response_model=PullChangesResponse)
@limiter.limit("30/minute")
async def pull_changes_endpoint(
    request: Request,
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
@limiter.limit("30/minute")
async def push_changes_endpoint(
    request: Request,
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


@router.post("/pull/batched")
@limiter.limit("60/minute")
async def pull_changes_batched_endpoint(
    request: Request,
    sync_request: SyncRequest,
    batch_size: int = Query(default=500, ge=50, le=5000, description="Number of records per batch"),
    skip_patients: int = Query(default=0, ge=0, description="Number of patient records to skip"),
    skip_notes: int = Query(default=0, ge=0, description="Number of note records to skip"),
    current_user: User = Depends(get_current_user)
):
    """
    Batched pull for incremental sync of large datasets.
    Returns has_more flag and skip values for pagination.
    Use this endpoint for first-time sync or when syncing >1000 records.
    """
    try:
        result = await pull_changes_batched(
            sync_request.last_pulled_at,
            current_user.id,
            batch_size=batch_size,
            skip_patients=skip_patients,
            skip_notes=skip_notes
        )
        return result
    except ValueError as e:
        logging.error(f"Batched pull sync validation error: {e}", exc_info=True)
        raise SyncConflictException(detail=str(e))


@router.get("/stats")
@limiter.limit("60/minute")
async def get_sync_stats_endpoint(
    request: Request,
    last_pulled_at: Optional[int] = Query(default=None, description="Last pull timestamp in milliseconds"),
    current_user: User = Depends(get_current_user)
):
    """
    Get sync statistics - count of records that need syncing.
    Useful for showing progress indication during large syncs.
    """
    try:
        stats = await get_sync_stats(current_user.id, last_pulled_at)
        return stats
    except Exception as e:
        logging.error(f"Sync stats error: {e}", exc_info=True)
        return {"patients_created": 0, "patients_updated": 0, "notes_created": 0, "notes_updated": 0, "total": 0}
