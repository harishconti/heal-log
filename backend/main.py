from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import logging
from beanie import init_beanie

from app import api
from app.core.config import settings
from app.db.session import client, shutdown_db_client
from app.db.init_db import init_dummy_data
from app.schemas.user import User
from app.schemas.patient import Patient
from app.schemas.clinical_note import ClinicalNote
from app.schemas.document import Document
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request
from app.core.limiter import limiter

# --- App Initialization ---
app = FastAPI(
    title="Medical Contacts API",
    version="3.0",
    description="Refactored API for managing medical contacts with advanced features."
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- Middleware ---
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

# --- Event Handlers ---
@app.on_event("startup")
async def on_startup():
    """
    Actions to perform on application startup.
    - Initialize Beanie ODM.
    - Initialize dummy data for development environments.
    """
    logging.info("Application starting up...")
    await init_beanie(
        database=client[settings.DB_NAME],
        document_models=[User, Patient, ClinicalNote, Document],
        allow_index_dropping=True
    )
    await init_dummy_data()
    logging.info("Dummy data initialization complete.")

@app.on_event("shutdown")
async def on_shutdown():
    """
    Actions to perform on application shutdown.
    - Close database connections gracefully.
    """
    logging.info("Application shutting down...")
    await shutdown_db_client()
    logging.info("Database connections closed.")

# --- Root Endpoint ---
@app.get("/api")
async def root():
    """
    Root endpoint for health checks.
    """
    return {"message": "Welcome to the Medical Contacts API v3.0"}

# --- Logging Configuration ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)