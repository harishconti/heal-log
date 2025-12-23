from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Dict, Any
from app.core.security import require_pro_user, require_role
from app.services.analytics_service import analytics_service
from app.core.limiter import limiter
from app.schemas.role import UserRole
from app.schemas.user import User
from datetime import datetime
import logging

router = APIRouter()

@router.get("/patient-growth", response_model=List[Dict])
@limiter.limit("15/minute")
async def get_patient_growth(
    request: Request,
    current_user: User = Depends(require_pro_user)
):
    """
    Get patient growth analytics data. This is a PRO feature.
    """
    try:
        growth_data = await analytics_service.get_patient_growth_analytics(current_user.id)
        return growth_data
    except Exception as e:
        logging.error(f"Error fetching patient growth: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching analytics data."
        )

@router.get("/notes-activity", response_model=List[Dict])
@limiter.limit("15/minute")
async def get_notes_activity(
    request: Request,
    current_user: User = Depends(require_pro_user)
):
    """
    Get notes creation analytics. This is a PRO feature.
    """
    try:
        notes_data = await analytics_service.get_notes_analytics(current_user.id)
        return notes_data
    except Exception as e:
        logging.error(f"Error fetching notes activity: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching notes analytics."
        )

@router.get("/weekly-activity", response_model=List[Dict])
@limiter.limit("15/minute")
async def get_weekly_activity(
    request: Request,
    current_user: User = Depends(require_pro_user)
):
    """
    Get weekly activity analytics. This is a PRO feature.
    """
    try:
        activity_data = await analytics_service.get_activity_analytics(current_user.id)
        return activity_data
    except Exception as e:
        logging.error(f"Error fetching weekly activity: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching activity analytics."
        )

@router.get("/demographics", response_model=List[Dict])
@limiter.limit("15/minute")
async def get_demographics(
    request: Request,
    current_user: User = Depends(require_pro_user)
):
    """
    Get patient demographics. This is a PRO feature.
    """
    try:
        demographics_data = await analytics_service.get_demographics_analytics(current_user.id)
        return demographics_data
    except Exception as e:
        logging.error(f"Error fetching demographics: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching demographics."
        )

@router.get("/export", response_model=Dict[str, Any])
@limiter.limit("5/minute")
async def export_analytics(
    request: Request,
    current_user: User = Depends(require_pro_user)
):
    """
    Export all analytics data. This is a PRO feature.
    """
    try:
        growth = await analytics_service.get_patient_growth_analytics(current_user.id)
        notes = await analytics_service.get_notes_analytics(current_user.id)
        activity = await analytics_service.get_activity_analytics(current_user.id)
        demographics = await analytics_service.get_demographics_analytics(current_user.id)
        
        return {
            "growth": growth,
            "notes": notes,
            "activity": activity,
            "demographics": demographics,
            "exported_at": datetime.now().isoformat()
        }
    except Exception as e:
        logging.error(f"Error exporting analytics: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while exporting analytics."
        )

@router.get("/health", response_model=Dict[str, Any])
@limiter.limit("10/minute")
async def get_health_analytics(
    request: Request,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """
    Get health analytics data for the application. This is an ADMIN feature.
    """
    try:
        health_data = await analytics_service.get_health_analytics()
        return health_data
    except Exception as e:
        logging.error(f"Error fetching health analytics: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching health analytics data."
        )