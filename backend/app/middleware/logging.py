import time
import uuid
import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp
import jwt
from app.core.config import settings

class LoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.logger = structlog.get_logger(__name__)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        user_id = await self.get_user_id(request)

        start_time = time.time()

        response = await call_next(request)

        process_time = (time.time() - start_time) * 1000

        self.logger.info(
            "request",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            query_params=str(request.query_params),
            user_id=user_id,
            client_ip=request.client.host,
            user_agent=request.headers.get("user-agent", "unknown"),
        )

        self.logger.info(
            "response",
            request_id=request_id,
            status_code=response.status_code,
            response_time_ms=f"{process_time:.2f}",
        )

        response.headers["X-Request-ID"] = request_id
        return response

    async def get_user_id(self, request: Request) -> str:

        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                return payload.get("sub")
            except jwt.PyJWTError:
                return "invalid_token"
        return "anonymous"
