from fastapi import Request
from fastapi.responses import JSONResponse

from app.core.monitoring import capture_exception_with_boundary


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
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {"message": "An unexpected error occurred."},
            "request_id": request.state.request_id if hasattr(request.state, 'request_id') else None,
        },
    )
