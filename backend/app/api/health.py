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

    # Check cache status
    try:
        await FastAPICache.get_backend().ping()
        cache_status = "ok"
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
