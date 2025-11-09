from fastapi import Request
from fastapi.responses import JSONResponse

class APIException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail

async def api_exception_handler(request: Request, exc: APIException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": {"message": exc.detail}},
    )

from app.core.monitoring import capture_exception_with_boundary

async def generic_exception_handler(request: Request, exc: Exception):
    capture_exception_with_boundary(exc)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": {"message": "An unexpected error occurred."}},
    )
