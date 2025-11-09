import logging
import time
import uuid

from beanie import init_beanie
from fastapi import FastAPI, Request, Response
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

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

    # Initialize Redis cache
    redis = aioredis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
    FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")
    logging.info("Redis cache initialized.")

    await connect_to_mongo()
    db = await get_database()
    await init_beanie(
        database=db,
        document_models=[User, Patient, ClinicalNote, Document, Feedback, Telemetry, ErrorEvent, QueryPerformanceEvent, SyncEvent],
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

# --- Middleware ---
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """
    Adds a unique request_id to each incoming request.
    """
    request.state.request_id = str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    return response

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Logs incoming requests and their response times.
    """
    start_time = time.time()
    logging.info(f"Request: {request.method} {request.url.path} from {request.client.host}")
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    logging.info(f"Response status: {response.status_code} in {process_time:.2f}ms")
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

# --- Root Endpoint ---
@app.get("/api")
async def root():
    """
    Root endpoint for health checks.
    """
    return {"message": "Welcome to the Medical Contacts API v3.0"}
