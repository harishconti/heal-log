"""
Authentication Middleware - Single JWT processing point.

This middleware handles JWT decoding and validation once per request,
storing the result in a request-scoped context. This eliminates redundant
JWT decoding and ensures consistent token validation across all endpoints.

Security benefits:
- JWT decoded exactly once per request (performance + security)
- Token blacklist checked consistently for all requests
- Token expiration validated in one place
- Eliminates possibility of inconsistent validation logic
"""
import jwt
from datetime import datetime, timezone
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.core.auth_context import AuthContext, set_auth_context
from app.core.config import settings
from app.core.logger import get_logger
from app.services.token_blacklist_service import token_blacklist

logger = get_logger(__name__)


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware that processes authentication for all requests.

    For requests with a Bearer token:
    1. Decodes and validates the JWT
    2. Checks if token is blacklisted
    3. Populates AuthContext with user information

    For requests without a token:
    - Sets empty AuthContext (authenticated=False)

    The AuthContext is then available to all route handlers and dependencies
    via get_auth_context().
    """

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint
    ) -> Response:
        """Process request authentication and call the next middleware/handler."""

        # Initialize with unauthenticated context
        context = AuthContext(authenticated=False)

        # Extract Authorization header
        auth_header = request.headers.get("Authorization")

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]  # Remove "Bearer " prefix

            try:
                # Step 1: Decode JWT
                payload = jwt.decode(
                    token,
                    settings.SECRET_KEY,
                    algorithms=[settings.ALGORITHM]
                )

                # Extract token claims
                user_id = payload.get("sub")
                jti = payload.get("jti")
                iat_timestamp = payload.get("iat")
                exp_timestamp = payload.get("exp")

                if not user_id:
                    logger.warning("jwt_missing_subject")
                    context.error = "Invalid token: missing user ID"
                else:
                    # Convert timestamps
                    iat = datetime.fromtimestamp(iat_timestamp, tz=timezone.utc) if iat_timestamp else None
                    exp = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc) if exp_timestamp else None

                    # Step 2: Check if token is blacklisted
                    if jti and await token_blacklist.is_token_blacklisted(jti, user_id, iat):
                        logger.warning("jwt_blacklisted", user_id=user_id, jti=jti)
                        context.error = "Token has been revoked"
                    else:
                        # Token is valid - populate context
                        context = AuthContext(
                            user_id=user_id,
                            email=payload.get("email"),
                            plan=payload.get("plan"),
                            role=payload.get("role"),
                            token_jti=jti,
                            token_iat=iat,
                            token_exp=exp,
                            authenticated=True,
                            error=None
                        )
                        logger.debug("jwt_validated", user_id=user_id)

            except jwt.ExpiredSignatureError:
                logger.debug("jwt_expired")
                context.error = "Token has expired"

            except jwt.PyJWTError as e:
                logger.warning("jwt_validation_failed", error=str(e))
                context.error = f"Invalid token: {str(e)}"

            except Exception as e:
                logger.error("jwt_processing_error", error=str(e))
                context.error = "Authentication error"

        # Set the auth context for this request
        set_auth_context(context)

        # Continue with request processing
        response = await call_next(request)

        return response
