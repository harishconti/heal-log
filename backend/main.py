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
from app.schemas.google_contacts import GoogleContactsSyncJob, DuplicateRecord


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
        document_models=[User, Patient, ClinicalNote, Document, Feedback, Telemetry, ErrorEvent, QueryPerformanceEvent, SyncEvent, BetaFeedback, GoogleContactsSyncJob, DuplicateRecord],
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


# --- CSRF Protection Middleware ---
class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """
    CSRF protection via Origin/Referer header validation.

    For state-changing requests (POST, PUT, DELETE, PATCH), validates that
    the Origin or Referer header matches allowed origins.

    This is defense-in-depth for token-based auth, as Bearer tokens
    are inherently CSRF-safe (they can't be sent automatically by browsers).
    """

    SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

    async def dispatch(self, request: Request, call_next):
        # Skip validation for safe methods
        if request.method in self.SAFE_METHODS:
            return await call_next(request)

        # Skip for health check endpoints
        if request.url.path in ["/health", "/api", "/api/health"]:
            return await call_next(request)

        # Skip for authentication endpoints (public endpoints that mobile apps need without auth)
        # These are rate-limited separately and don't require CSRF protection since:
        # 1. They're public endpoints users access before having a token
        # 2. Mobile apps don't use browser cookies, so no CSRF attack vector
        auth_endpoints = [
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/verify-otp",
            "/api/auth/resend-otp",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/refresh",
        ]
        if request.url.path in auth_endpoints:
            return await call_next(request)

        # Get allowed origins from settings
        allowed_origins = (
            settings.ALLOWED_ORIGINS.split(',')
            if ',' in settings.ALLOWED_ORIGINS
            else [settings.ALLOWED_ORIGINS]
        )
        # Add common localhost variations for development
        if settings.ENV != "production":
            allowed_origins.extend([
                "http://localhost:3000",
                "http://localhost:8000",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:8000",
            ])

        # Check Origin header first (preferred)
        origin = request.headers.get("origin")
        if origin:
            origin_allowed = any(
                origin == allowed or allowed == "*"
                for allowed in allowed_origins
            )
            if not origin_allowed:
                logging.warning(f"[CSRF] Blocked request from origin: {origin}")
                return Response(
                    content='{"detail": "CSRF validation failed: Origin not allowed"}',
                    status_code=403,
                    media_type="application/json"
                )
            return await call_next(request)

        # Fall back to Referer header for same-origin requests
        referer = request.headers.get("referer")
        if referer:
            from urllib.parse import urlparse
            referer_origin = f"{urlparse(referer).scheme}://{urlparse(referer).netloc}"
            referer_allowed = any(
                referer_origin == allowed or allowed == "*"
                for allowed in allowed_origins
            )
            if not referer_allowed:
                logging.warning(f"[CSRF] Blocked request from referer: {referer}")
                return Response(
                    content='{"detail": "CSRF validation failed: Referer not allowed"}',
                    status_code=403,
                    media_type="application/json"
                )
            return await call_next(request)

        # For mobile apps and API clients without Origin/Referer,
        # require Authorization header (which can't be set by CSRF attacks)
        auth_header = request.headers.get("authorization")
        if auth_header:
            return await call_next(request)

        # No Origin, Referer, or Authorization - block in production
        if settings.ENV == "production":
            logging.warning(f"[CSRF] Blocked request without origin validation: {request.url.path}")
            return Response(
                content='{"detail": "CSRF validation failed: No origin information"}',
                status_code=403,
                media_type="application/json"
            )

        # Allow in development for testing
        return await call_next(request)


# --- Request Size Limit Middleware ---
class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """
    Limits request body size to prevent DoS attacks.

    Default limit: 10MB for most requests
    Higher limit: 50MB for specific upload endpoints (photos, documents)
    """

    # Default max size: 10MB
    DEFAULT_MAX_SIZE = 10 * 1024 * 1024

    # Higher limit for upload endpoints: 50MB
    UPLOAD_MAX_SIZE = 50 * 1024 * 1024

    # Endpoints that allow larger uploads
    UPLOAD_ENDPOINTS = [
        "/api/patients",  # Patient photos
        "/api/documents",  # Document uploads
        "/api/users/me",  # Profile photos
    ]

    async def dispatch(self, request: Request, call_next):
        # Skip size check for safe methods
        if request.method in {"GET", "HEAD", "OPTIONS", "DELETE"}:
            return await call_next(request)

        # Determine max size based on endpoint
        max_size = self.DEFAULT_MAX_SIZE
        for endpoint in self.UPLOAD_ENDPOINTS:
            if request.url.path.startswith(endpoint):
                max_size = self.UPLOAD_MAX_SIZE
                break

        # Check Content-Length header
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)
                if size > max_size:
                    max_mb = max_size / (1024 * 1024)
                    logging.warning(
                        f"[REQUEST_SIZE] Rejected request to {request.url.path}: "
                        f"size {size} exceeds limit {max_size}"
                    )
                    return Response(
                        content=f'{{"detail": "Request body too large. Maximum size is {max_mb:.0f}MB"}}',
                        status_code=413,
                        media_type="application/json"
                    )
            except ValueError:
                pass  # Invalid content-length, let the request proceed

        return await call_next(request)


# --- Middleware ---
# Order matters: Request size first (reject early), then security headers, CSRF, logging
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(CSRFProtectionMiddleware)
app.add_middleware(RequestSizeLimitMiddleware)
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
app.include_router(api.google_contacts.router, prefix="/api/integrations/google-contacts", tags=["Google Contacts"])
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
