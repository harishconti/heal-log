from fastapi import APIRouter, Depends
from app.db.session import get_database
from fastapi_cache import FastAPICache
import logging

router = APIRouter()

@router.get("/health")
async def health_check(db = Depends(get_database)):
    """
    Health check endpoint for monitoring services.
    """

    # Check API status
    api_status = "ok"

    # Check MongoDB connection
    try:
        await db.command("ping")
        mongo_status = "ok"
    except Exception as e:
        logging.error(f"MongoDB connection failed: {e}")
        mongo_status = "error"

    # Check cache status with null safety
    cache_status = "unknown"
    try:
        backend = FastAPICache.get_backend()
        if backend is not None:
            await backend.ping()
            cache_status = "ok"
        else:
            logging.warning("Cache backend is not initialized")
            cache_status = "not_configured"
    except Exception as e:
        logging.error(f"Cache connection failed: {e}")
        cache_status = "error"

    return {
        "status": "ok",
        "details": {
            "api": api_status,
            "mongodb": mongo_status,
            "cache": cache_status,
        },
    }
