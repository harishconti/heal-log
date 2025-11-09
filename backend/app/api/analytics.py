from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Dict, Any
from app.core.security import require_pro_user, require_role
from app.services import analytics_service
from app.core.limiter import limiter
from app.schemas.role import UserRole

router = APIRouter()

@router.get("/patient-growth", response_model=List[Dict])
@limiter.limit("15/minute")
async def get_patient_growth(
    request: Request,
    current_user_id: str = Depends(require_pro_user)
):
    """
    Get patient growth analytics data. This is a PRO feature.
    """
    try:
        growth_data = await analytics_service.get_patient_growth_analytics(current_user_id)
        return growth_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching analytics data."
        )

@router.get("/health", response_model=Dict[str, Any])
@limiter.limit("10/minute")
async def get_health_analytics(
    request: Request,
    current_user_id: str = Depends(require_role(UserRole.ADMIN))
):
    """
    Get health analytics data for the application. This is an ADMIN feature.
    """
    try:
        health_data = await analytics_service.get_health_analytics()
        return health_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching health analytics data."
        )