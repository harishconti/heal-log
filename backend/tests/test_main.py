from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.api import (
    auth, users, patients, documents, analytics, payments,
    webhooks, sync, debug, feedback, telemetry, beta, health, metrics, version
)
from app.core.exceptions import APIException, api_exception_handler
from app.middleware.logging import LoggingMiddleware

def create_test_app(limiter):
    app = FastAPI()
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_exception_handler(APIException, api_exception_handler)

    # Add middleware
    app.add_middleware(LoggingMiddleware)

    # Manual root endpoints to mimic main.py
    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}

    @app.get("/api")
    async def root():
        return {"message": "Welcome to the Medical Contacts API v3.0"}

    app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
    app.include_router(users.router, prefix="/api/users", tags=["Users"])
    app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
    app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
    app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
    app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
    app.include_router(webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])
    app.include_router(sync.router, prefix="/api/sync", tags=["Sync"])
    app.include_router(debug.router, prefix="/api/debug", tags=["Debug"])
    app.include_router(feedback.router, prefix="/api/feedback", tags=["Feedback"])
    app.include_router(telemetry.router, prefix="/api/telemetry", tags=["Telemetry"])
    app.include_router(beta.router, prefix="/api/beta", tags=["Beta"])
    app.include_router(health.router, prefix="/api", tags=["Health"])
    app.include_router(metrics.router, prefix="/api", tags=["Metrics"])
    app.include_router(version.router, prefix="/api", tags=["Version"])

    return app
