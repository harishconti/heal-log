from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.core.security import get_current_user
from app.services.telemetry_service import telemetry_service
from app.schemas.telemetry import TelemetryEvent
from app.schemas.user import User
from app.core.limiter import limiter

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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the telemetry event."
        )
