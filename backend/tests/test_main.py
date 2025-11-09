from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.api.feedback import router as feedback_router
from app.api.sync import router as sync_router

def create_test_app(limiter):
    app = FastAPI()
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.include_router(feedback_router, prefix="/api/feedback")
    app.include_router(sync_router, prefix="/api/sync")
    return app
