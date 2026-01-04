import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from app.core.monitoring import capture_exception_with_boundary
from app.schemas.error_event import ErrorEvent


class APIException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail

class BetaUserException(APIException):
    def __init__(self, detail: str = "This feature is only available to beta users."):
        super().__init__(status_code=403, detail=detail)

class SyncConflictException(APIException):
    def __init__(self, detail: str = "Data conflict during synchronization. Please try again."):
        super().__init__(status_code=409, detail=detail)

class RateLimitException(APIException):
    def __init__(self, detail: str = "Rate limit exceeded. Please try again later."):
        super().__init__(status_code=429, detail=detail)

class DuplicateEmailException(APIException):
    def __init__(self, detail: str = "An account with this email already exists. Please sign in instead."):
        super().__init__(status_code=409, detail=detail)

class NotFoundException(APIException):
    def __init__(self, detail: str = "Resource not found."):
        super().__init__(status_code=404, detail=detail)

async def api_exception_handler(request: Request, exc: APIException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {"message": exc.detail},
            "request_id": request.state.request_id if hasattr(request.state, 'request_id') else None,
        },
    )

async def generic_exception_handler(request: Request, exc: Exception):
    capture_exception_with_boundary(exc)

    # Extract user_id from authorization header if present
    user_id = None
    try:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            from app.core.security import decode_access_token
            token = auth_header.split(" ")[1]
            payload = decode_access_token(token)
            if payload:
                user_id = payload.get("sub")
    except Exception as auth_error:
        # Log but don't fail - user extraction is optional for error logging
        logging.debug(f"Could not extract user_id for error logging: {auth_error}")

    error_event = ErrorEvent(
        user_id=user_id,
        request_id=request.state.request_id if hasattr(request.state, 'request_id') else None,
        path=request.url.path,
        method=request.method,
        status_code=500,
        error=str(exc),
    )
    await error_event.insert()

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {"message": "An unexpected error occurred."},
            "request_id": request.state.request_id if hasattr(request.state, 'request_id') else None,
        },
    )
