from fastapi import APIRouter, status, Request, HTTPException
from app.services.patient_service import patient_service
from app.services.analytics_service import analytics_service
from app.services.user_service import user_service
import logging

router = APIRouter()

@router.post("/clear-all-caches", response_model=dict)
async def clear_all_caches(request: Request):
    """
    A debug endpoint to clear all application-level caches.
    Should only be enabled in testing environments.
    """
    logging.info("Received request to clear all application caches...")
    try:
        # Clear patient service caches
        patient_service.get_patients_by_user_id.cache_clear()
        patient_service.get_patient_groups.cache_clear()
        patient_service.get_user_stats.cache_clear()
        logging.info("Cleared patient_service caches.")

        # Clear analytics service caches
        analytics_service.get_patient_growth_analytics.cache_clear()
        logging.info("Cleared analytics_service caches.")

        # There might be other caches, e.g., in user_service.
        # Add them here if they exist.
        # Example: user_service.get_user_by_email.cache_clear()

        logging.info("All application caches cleared successfully.")
        return {"success": True, "message": "All caches cleared"}
    except Exception as e:
        logging.error(f"Error clearing caches: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear caches."
        )

import sentry_sdk
from app.core.exceptions import APIException

@router.get("/sentry-test")
async def sentry_test():
    """
    Raises an exception to test Sentry's automatic error reporting.
    """
    raise Exception("Sentry test exception from debug endpoint.")