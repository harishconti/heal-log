"""
Authentication Context - Request-scoped authentication state.

This module provides a ContextVar-based authentication context that stores
the decoded JWT information for the duration of a request. This eliminates
the need to decode JWTs multiple times per request.

The AuthMiddleware populates this context early in the request lifecycle,
and authentication dependencies simply read from it.
"""
from contextvars import ContextVar
from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class AuthContext:
    """
    Authentication context for a single request.

    Populated by AuthMiddleware after decoding and validating the JWT.
    All fields are None for unauthenticated requests.
    """
    # User information from JWT
    user_id: Optional[str] = None
    email: Optional[str] = None
    plan: Optional[str] = None
    role: Optional[str] = None

    # Token metadata
    token_jti: Optional[str] = None
    token_iat: Optional[datetime] = None
    token_exp: Optional[datetime] = None

    # Authentication status
    authenticated: bool = False

    # Error information (if token validation failed)
    error: Optional[str] = None


# Context variable for storing auth state per request
auth_context_var: ContextVar[AuthContext] = ContextVar(
    'auth_context',
    default=AuthContext()
)


def get_auth_context() -> AuthContext:
    """
    Get the current request's authentication context.

    Returns:
        AuthContext with user information if authenticated, or empty context if not.

    Example:
        ctx = get_auth_context()
        if ctx.authenticated:
            user_id = ctx.user_id
    """
    return auth_context_var.get()


def set_auth_context(context: AuthContext) -> None:
    """
    Set the authentication context for the current request.

    This should only be called by AuthMiddleware.

    Args:
        context: The AuthContext to set for this request
    """
    auth_context_var.set(context)


def clear_auth_context() -> None:
    """
    Clear the authentication context (reset to unauthenticated).

    This is typically not needed as ContextVars are automatically
    cleaned up at the end of request processing.
    """
    auth_context_var.set(AuthContext())
