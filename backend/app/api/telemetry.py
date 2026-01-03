import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.core.security import get_current_user
from app.services.telemetry_service import telemetry_service
from app.schemas.telemetry import TelemetryEvent
from app.schemas.user import User
from app.core.limiter import limiter

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", status_code=status.HTTP_201_CREATED)
@limiter.limit("60/minute")
async def create_telemetry_event(
    request: Request,
    event: TelemetryEvent,
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new telemetry event.
    """
    try:
        await telemetry_service.create_event(current_user.id, event)
        return {"status": "ok"}
    except ValueError as e:
        # Handle validation errors
        logger.warning(f"Telemetry validation error for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Log the actual error for debugging while returning generic message to user
        logger.error(f"Telemetry creation failed for user {current_user.id}: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the telemetry event."
        )
