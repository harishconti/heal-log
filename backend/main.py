import logging
import time
import uuid

from beanie import init_beanie
from fastapi import FastAPI, Request, Response
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
from app.middleware.logging import LoggingMiddleware

from app import api
from app.core.config import settings
from app.core.exceptions import APIException, api_exception_handler, generic_exception_handler
from app.core.limiter import limiter
from app.core.logging_config import setup_logging
from app.core.monitoring import init_monitoring
from app.db.init_db import init_dummy_data
from app.db.session import close_mongo_connection, connect_to_mongo, get_database
from app.schemas.clinical_note import ClinicalNote
from app.schemas.document import Document
from app.schemas.feedback import Feedback
from app.schemas.patient import Patient
from app.schemas.user import User
from app.schemas.telemetry import Telemetry
from app.schemas.error_event import ErrorEvent
from app.schemas.query_performance_event import QueryPerformanceEvent
from app.schemas.sync_event import SyncEvent
from app.schemas.beta_feedback import BetaFeedback


# --- Lifespan Management ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Actions to perform on application startup and shutdown.
    - Initialize Beanie ODM on startup.
    - Initialize dummy data for development environments on startup.
    - Close database connections gracefully on shutdown.
    """
    setup_logging()
    logging.info("Application starting up...")

    # Initialize Sentry Monitoring
    init_monitoring()

    # Initialize Redis cache if REDIS_URL is set, otherwise use in-memory backend
    if settings.REDIS_URL:
        try:
            redis = aioredis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
            FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")
            logging.info("Redis cache initialized.")
        except Exception as e:
            logging.warning(f"Could not initialize Redis cache: {e}. Falling back to InMemoryBackend.")
            FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")
    else:
        logging.warning("REDIS_URL not set. Using InMemoryBackend for cache.")
        FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")

    await connect_to_mongo()
    db = await get_database()
    await init_beanie(
        database=db,
        document_models=[User, Patient, ClinicalNote, Document, Feedback, Telemetry, ErrorEvent, QueryPerformanceEvent, SyncEvent, BetaFeedback],
        allow_index_dropping=True
    )
    await init_dummy_data()
    logging.info("Dummy data initialization complete.")

    yield

    logging.info("Application shutting down...")
    await close_mongo_connection()
    logging.info("Database connections closed.")

# --- App Initialization ---
app = FastAPI(
    title="Medical Contacts API",
    version="3.0",
    description="Refactored API for managing medical contacts with advanced features.",
    lifespan=lifespan
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_exception_handler(APIException, api_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# --- Security Headers Middleware ---
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        # HSTS header for production (enforce HTTPS)
        if settings.ENV == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


# --- Middleware ---
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(LoggingMiddleware)

# CORS Configuration - restrict methods and headers to only what's needed
ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
ALLOWED_HEADERS = [
    "Authorization",
    "Content-Type",
    "Accept",
    "Origin",
    "X-Requested-With",
    "X-Request-ID",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(',') if ',' in settings.ALLOWED_ORIGINS else [settings.ALLOWED_ORIGINS],
    allow_credentials=True,
    allow_methods=ALLOWED_METHODS,
    allow_headers=ALLOWED_HEADERS,
)


# --- API Routers ---
app.include_router(api.auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(api.users.router, prefix="/api/users", tags=["Users"])
app.include_router(api.patients.router, prefix="/api/patients", tags=["Patients"])
app.include_router(api.documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(api.analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(api.payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(api.webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])
app.include_router(api.sync.router, prefix="/api/sync", tags=["Sync"])
app.include_router(api.debug.router, prefix="/api/debug", tags=["Debug"])
app.include_router(api.feedback.router, prefix="/api/feedback", tags=["Feedback"])
app.include_router(api.telemetry.router, prefix="/api/telemetry", tags=["Telemetry"])
app.include_router(api.beta.router, prefix="/api/beta", tags=["Beta"])
app.include_router(api.export.router, prefix="/api/export", tags=["Export"])
app.include_router(api.health.router, prefix="/api", tags=["Health"])
app.include_router(api.metrics.router, prefix="/api", tags=["Metrics"])
app.include_router(api.version.router, prefix="/api", tags=["Version"])

# --- Health Check Endpoint ---
@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring services.
    """
    return {"status": "healthy"}

# --- Root Endpoint ---
@app.get("/api")
async def root():
    """
    Root endpoint for health checks.
    """
    return {"message": "Welcome to the Medical Contacts API v3.0"}
