from fastapi import APIRouter, status, Request, HTTPException, Depends
from app.services.patient_service import patient_service
from app.services.analytics_service import analytics_service
from app.services.user_service import user_service
from app.core.security import require_role
from app.core.config import settings
from app.schemas.role import UserRole
import logging

router = APIRouter()


def check_debug_enabled():
    """
    Dependency to ensure debug endpoints are only available in non-production environments.
    """
    if settings.ENV == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Debug endpoints are disabled in production"
        )


@router.post("/clear-all-caches", response_model=dict, dependencies=[Depends(check_debug_enabled)])
async def clear_all_caches(
    request: Request,
    current_user=Depends(require_role(UserRole.ADMIN))
):
    """
    A debug endpoint to clear all application-level caches.
    Requires admin role and is disabled in production.
    """
    logging.info(f"Admin user {current_user.email} requested cache clear")
    try:
        # Clear patient service caches
        patient_service.get_patients_by_user_id.cache_clear()
        patient_service.get_patient_groups.cache_clear()
        patient_service.get_user_stats.cache_clear()
        logging.info("Cleared patient_service caches.")

        # Clear analytics service caches
        analytics_service.get_patient_growth_analytics.cache_clear()
        logging.info("Cleared analytics_service caches.")

        logging.info("All application caches cleared successfully.")
        return {"success": True, "message": "All caches cleared"}
    except Exception as e:
        logging.error(f"Error clearing caches: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear caches."
        )


@router.get("/sentry-test", dependencies=[Depends(check_debug_enabled)])
async def sentry_test(current_user=Depends(require_role(UserRole.ADMIN))):
    """
    Raises an exception to test Sentry's automatic error reporting.
    Requires admin role and is disabled in production.
    """
    logging.info(f"Admin user {current_user.email} triggered Sentry test")
    raise Exception("Sentry test exception from debug endpoint.")