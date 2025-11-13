from fastapi import APIRouter
from . import auth, users, sync, payments, telemetry, analytics, feedback, patients, documents, webhooks, debug

api_router = APIRouter()

# --- Authentication Endpoints ---
# Handles user registration, login, token refresh, and password recovery.
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# --- User Management Endpoints ---
# Provides access to user profiles and related data.
api_router.include_router(users.router, prefix="/users", tags=["Users"])

# --- Data Synchronization Endpoints ---
# Facilitates offline data sync for clients.
api_router.include_router(sync.router, prefix="/sync", tags=["Sync"])

# --- Payment Processing Endpoints ---
# Manages subscriptions and payments via a third-party gateway.
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])

# --- Telemetry Endpoints ---
# Collects anonymous usage data to improve the application.
api_router.include_router(telemetry.router, prefix="/telemetry", tags=["Telemetry"])

# --- Analytics Endpoints ---
# Exposes aggregated health and usage metrics.
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])

# --- Feedback Endpoints ---
# Allows users to submit feedback, bug reports, and suggestions.
api_router.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])

# --- Patient Management Endpoints ---
# Handles CRUD operations for patients.
api_router.include_router(patients.router, prefix="/patients", tags=["Patients"])

# --- Document Management Endpoints ---
# Handles CRUD operations for documents.
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])

# --- Webhook Endpoints ---
# Handles webhooks from third-party services.
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])

# --- Debug Endpoints ---
# Provides debug information.
api_router.include_router(debug.router, prefix="/debug", tags=["Debug"])
