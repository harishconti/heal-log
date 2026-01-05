"""
Google Contacts API endpoints.

Provides endpoints for:
- OAuth flow (auth-url, callback, disconnect)
- Sync operations (sync, sync-status, cancel)
- Duplicate management (list, resolve, batch-resolve)
"""

import logging
from typing import List, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, status, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.limiter import limiter
from app.core.security import get_current_user
from app.schemas.user import User
from app.schemas.patient import Patient
from app.schemas.google_contacts import (
    GoogleContactsSyncJob,
    DuplicateRecord,
    SyncJobCreate,
    SyncJobProgress,
    SyncJobStatus,
    SyncJobType,
    DuplicateRecordResponse,
    ResolveDuplicateRequest,
    BatchResolveDuplicatesRequest,
    GoogleContactsConnectionStatus,
    DuplicateStatus,
)
from app.services.google_oauth_service import google_oauth_service
from app.services.contact_sync_service import contact_sync_service

logger = logging.getLogger(__name__)

router = APIRouter()


# --- Connection Status ---

@router.get("/status", response_model=GoogleContactsConnectionStatus)
async def get_connection_status(
    current_user: User = Depends(get_current_user)
):
    """Get the current Google Contacts connection status."""
    is_connected = current_user.google_oauth_tokens is not None
    connected_at = None
    last_sync_at = None
    total_synced = 0

    if is_connected and current_user.google_oauth_tokens:
        connected_at = current_user.google_oauth_tokens.connected_at

        # Get last sync info
        last_job = await contact_sync_service.get_last_sync_job(current_user.id)
        if last_job:
            last_sync_at = last_job.completed_at

        # Count synced patients
        total_synced = await Patient.find({
            "user_id": current_user.id,
            "source": "google_contacts"
        }).count()

    return GoogleContactsConnectionStatus(
        is_connected=is_connected,
        connected_at=connected_at,
        last_sync_at=last_sync_at,
        total_synced_patients=total_synced
    )


# --- OAuth Flow ---

@router.get("/auth-url")
async def get_auth_url(
    current_user: User = Depends(get_current_user)
):
    """
    Generate the Google OAuth authorization URL.

    Returns the URL to redirect the user to for Google consent.
    """
    try:
        if not google_oauth_service.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Google OAuth is not configured on the server"
            )

        auth_url, state = google_oauth_service.get_authorization_url(current_user.id)

        return {
            "auth_url": auth_url,
            "state": state
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/callback")
async def oauth_callback(
    code: str,
    state: str,
    current_user: User = Depends(get_current_user)
):
    """
    Handle the OAuth callback from Google.

    Exchanges the authorization code for tokens and stores them.
    """
    try:
        tokens, user_id = await google_oauth_service.exchange_code_for_tokens(code, state)

        if not tokens:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange authorization code for tokens"
            )

        # Verify the user ID matches
        if user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User ID mismatch in OAuth state"
            )

        # Save tokens to user
        success = await google_oauth_service.save_tokens_to_user(current_user.id, tokens)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save OAuth tokens"
            )

        return {
            "success": True,
            "message": "Google account connected successfully"
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/disconnect")
async def disconnect_google(
    current_user: User = Depends(get_current_user)
):
    """
    Disconnect the Google account.

    Revokes tokens and removes the connection.
    """
    if not current_user.google_oauth_tokens:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account is not connected"
        )

    success = await google_oauth_service.disconnect(current_user)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disconnect Google account"
        )

    return {
        "success": True,
        "message": "Google account disconnected successfully"
    }


# --- Sync Operations ---

@router.post("/sync", response_model=SyncJobProgress)
@limiter.limit("10/hour")
async def start_sync(
    request: Request,
    background_tasks: BackgroundTasks,
    sync_request: Optional[SyncJobCreate] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Start a Google Contacts sync job.

    Returns immediately with job ID for polling progress.
    Limited to 10 requests per hour.
    """
    # Check if Google is connected
    if not current_user.google_oauth_tokens:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account is not connected. Please connect first."
        )

    # Check for existing active job
    active_job = await contact_sync_service.get_active_sync_job(current_user.id)
    if active_job:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A sync job is already in progress",
            headers={"X-Active-Job-Id": active_job.id}
        )

    # Determine job type
    job_type = SyncJobType.INITIAL
    if sync_request and sync_request.job_type:
        job_type = sync_request.job_type
    else:
        # Auto-detect: if we have a previous sync, do incremental
        last_job = await contact_sync_service.get_last_sync_job(current_user.id)
        if last_job and last_job.google_sync_token:
            job_type = SyncJobType.INCREMENTAL

    # Create sync job
    job = await contact_sync_service.create_sync_job(current_user.id, job_type)

    # Run sync in background
    async def run_sync_background():
        try:
            # Refresh user to get latest tokens
            user = await User.find_one({"_id": current_user.id})
            if user:
                await contact_sync_service.run_sync(user, job)
        except Exception as e:
            logger.error(f"Background sync failed: {e}", exc_info=True)
            job.status = SyncJobStatus.FAILED
            job.error_message = str(e)
            job.completed_at = datetime.now(timezone.utc)
            await job.save()

    background_tasks.add_task(run_sync_background)

    return SyncJobProgress.from_job(job)


@router.get("/sync-status/{job_id}", response_model=SyncJobProgress)
async def get_sync_status(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get the status of a sync job."""
    job = await contact_sync_service.get_sync_job(job_id, current_user.id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sync job not found"
        )

    return SyncJobProgress.from_job(job)


@router.post("/sync/cancel/{job_id}")
async def cancel_sync(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """Cancel a running sync job."""
    success = await contact_sync_service.cancel_sync_job(job_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not cancel sync job. It may have already completed or not exist."
        )

    return {
        "success": True,
        "message": "Cancellation requested"
    }


@router.get("/sync/history")
async def get_sync_history(
    limit: int = Query(default=10, le=50),
    current_user: User = Depends(get_current_user)
):
    """Get sync job history for the user."""
    jobs = await GoogleContactsSyncJob.find(
        {"user_id": current_user.id}
    ).sort([("created_at", -1)]).limit(limit).to_list()

    return [SyncJobProgress.from_job(job) for job in jobs]


# --- Duplicate Management ---

@router.get("/duplicates", response_model=List[DuplicateRecordResponse])
async def get_pending_duplicates(
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user)
):
    """Get pending duplicate records for review."""
    duplicates = await contact_sync_service.get_pending_duplicates(
        current_user.id, limit, offset
    )
    return duplicates


@router.get("/duplicates/count")
async def get_duplicates_count(
    current_user: User = Depends(get_current_user)
):
    """Get count of pending duplicates."""
    count = await contact_sync_service.get_pending_duplicates_count(current_user.id)
    return {"count": count}


@router.post("/duplicates/{duplicate_id}/resolve")
async def resolve_duplicate(
    duplicate_id: str,
    resolution_request: ResolveDuplicateRequest,
    current_user: User = Depends(get_current_user)
):
    """Resolve a single duplicate record."""
    patient_id = await contact_sync_service.resolve_duplicate(
        duplicate_id,
        current_user.id,
        resolution_request.resolution,
        resolution_request.merge_fields
    )

    if patient_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to resolve duplicate"
        )

    return {
        "success": True,
        "patient_id": patient_id,
        "resolution": resolution_request.resolution
    }


@router.post("/duplicates/{duplicate_id}/skip")
async def skip_duplicate(
    duplicate_id: str,
    current_user: User = Depends(get_current_user)
):
    """Skip/dismiss a duplicate without resolving."""
    success = await contact_sync_service.skip_duplicate(duplicate_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Duplicate record not found"
        )

    return {"success": True}


@router.post("/duplicates/batch-resolve")
async def batch_resolve_duplicates(
    request: BatchResolveDuplicatesRequest,
    current_user: User = Depends(get_current_user)
):
    """Resolve multiple duplicates at once."""
    results = await contact_sync_service.batch_resolve_duplicates(
        current_user.id,
        request.resolutions
    )
    return results


@router.post("/duplicates/skip-all")
async def skip_all_duplicates(
    current_user: User = Depends(get_current_user)
):
    """Skip all pending duplicates."""
    duplicates = await DuplicateRecord.find({
        "user_id": current_user.id,
        "status": DuplicateStatus.PENDING
    }).to_list()

    count = 0
    for dup in duplicates:
        success = await contact_sync_service.skip_duplicate(dup.id, current_user.id)
        if success:
            count += 1

    return {
        "success": True,
        "skipped_count": count
    }
