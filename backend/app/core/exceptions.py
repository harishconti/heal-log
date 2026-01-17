import logging
from typing import Optional, Dict, Any
from fastapi import Request
from fastapi.responses import JSONResponse
from app.core.monitoring import capture_exception_with_boundary
from app.schemas.error_event import ErrorEvent


class APIException(Exception):
    """
    Enhanced APIException with error codes, optional field info, and context.

    Provides consistent error response format across all API endpoints.
    """
    def __init__(
        self,
        status_code: int,
        detail: str,
        code: str = "UNKNOWN_ERROR",
        field: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        self.status_code = status_code
        self.detail = detail
        self.code = code
        self.field = field
        self.context = context or {}
        super().__init__(detail)


# Predefined exception classes for common cases
class ValidationException(APIException):
    """Validation error for a specific field."""
    def __init__(self, field: str, message: str, context: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=422,
            detail=message,
            code="VALIDATION_ERROR",
            field=field,
            context=context
        )


class NotFoundException(APIException):
    """Resource not found."""
    def __init__(self, resource: str = "Resource", identifier: Optional[str] = None):
        detail = f"{resource} not found"
        context = {}
        if identifier:
            context["identifier"] = identifier
        super().__init__(
            status_code=404,
            detail=detail,
            code="NOT_FOUND",
            context=context
        )


class ConflictException(APIException):
    """Resource conflict (e.g., duplicate email)."""
    def __init__(self, message: str, code: str = "CONFLICT", context: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=409,
            detail=message,
            code=code,
            context=context
        )


class UnauthorizedException(APIException):
    """Authentication required."""
    def __init__(self, message: str = "Authentication required", code: str = "UNAUTHORIZED"):
        super().__init__(
            status_code=401,
            detail=message,
            code=code
        )


class ForbiddenException(APIException):
    """Insufficient permissions."""
    def __init__(self, message: str = "Access forbidden", code: str = "FORBIDDEN"):
        super().__init__(
            status_code=403,
            detail=message,
            code=code
        )


class BadRequestException(APIException):
    """Invalid request data."""
    def __init__(self, message: str, code: str = "BAD_REQUEST", context: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=400,
            detail=message,
            code=code,
            context=context
        )


class InternalServerException(APIException):
    """Internal server error."""
    def __init__(self, message: str = "An unexpected error occurred", code: str = "INTERNAL_ERROR"):
        super().__init__(
            status_code=500,
            detail=message,
            code=code
        )


# Legacy exception classes for backward compatibility
class BetaUserException(ForbiddenException):
    def __init__(self, detail: str = "This feature is only available to beta users."):
        super().__init__(message=detail, code="BETA_ONLY")


class SyncConflictException(ConflictException):
    def __init__(self, detail: str = "Data conflict during synchronization. Please try again."):
        super().__init__(message=detail, code="SYNC_CONFLICT")


class RateLimitException(APIException):
    def __init__(self, detail: str = "Rate limit exceeded. Please try again later."):
        super().__init__(status_code=429, detail=detail, code="RATE_LIMIT_EXCEEDED")


class DuplicateEmailException(ConflictException):
    def __init__(self, detail: str = "An account with this email already exists. Please sign in instead."):
        super().__init__(message=detail, code="DUPLICATE_EMAIL")

async def api_exception_handler(request: Request, exc: APIException):
    """
    Enhanced API exception handler with consistent error format.

    Returns structured error response with:
    - success: false
    - error: {message, code, field (optional), context (optional)}
    - request_id: for tracking
    """
    error_dict = {
        "message": exc.detail,
        "code": exc.code,
    }

    # Add optional fields if present
    if exc.field:
        error_dict["field"] = exc.field

    if exc.context:
        error_dict["context"] = exc.context

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": error_dict,
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
