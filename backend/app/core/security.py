from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
import uuid
import logging

from app.core.config import settings
from app.schemas.user import UserPlan, User  # ✅ Import User from schemas (Beanie Document)
from app.schemas.role import UserRole
from app.core.hashing import verify_password
from app.services import user_service
from app.services.token_blacklist_service import token_blacklist

logger = logging.getLogger(__name__)

# --- JWT Bearer Scheme ---
# We instantiate it once and reuse it in our dependency
reusable_oauth2 = HTTPBearer()
optional_oauth2 = HTTPBearer(auto_error=False)


async def authenticate_user(email: str, password: str) -> User | None:
    user = await user_service.get_user_by_email(email=email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

# --- JWT Token Creation ---
def create_access_token(subject: str, plan: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a new access token with plan and role."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "plan": plan,
        "role": role,
        "iat": now,
        "jti": str(uuid.uuid4())  # Unique token ID for revocation support
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a new refresh token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "iat": now,
        "type": "refresh",
        "jti": str(uuid.uuid4())
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodes and validates an access token.
    Returns the payload if valid, None otherwise.
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.debug("Token has expired")
        return None
    except jwt.PyJWTError as e:
        logger.debug(f"Token decode error: {e}")
        return None

# --- Dependency to Get Current User ---
async def get_current_user() -> User:
    """
    Dependency to get the current authenticated user.

    Uses the AuthContext populated by AuthMiddleware (which has already
    decoded and validated the JWT). This eliminates redundant JWT decoding.

    Raises HTTPException for unauthenticated or invalid requests.

    Returns:
        The authenticated User object from the database.
    """
    from app.core.auth_context import get_auth_context

    context = get_auth_context()

    # Check if authenticated
    if not context.authenticated:
        error_detail = context.error or "Authentication required"
        logger.warning("auth_required", error=error_detail)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch user from database
    user = await user_service.get_user_by_id(context.user_id)

    if not user:
        logger.error("user_not_found_in_db", user_id=context.user_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    logger.debug("user_authenticated", user_id=context.user_id, email=context.email)
    return user


async def revoke_token(token: str) -> bool:
    """
    Revoke a specific token by adding it to the blacklist.
    Call this on logout or when a token should be invalidated.
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        jti = payload.get("jti")
        exp_timestamp = payload.get("exp")

        if not jti:
            logger.warning("[AUTH] Cannot revoke token without jti")
            return False

        exp = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc) if exp_timestamp else None
        await token_blacklist.blacklist_token(jti, exp)
        return True
    except jwt.PyJWTError as e:
        logger.error(f"[AUTH] Failed to revoke token: {e}")
        return False


async def revoke_all_user_tokens(user_id: str) -> None:
    """
    Revoke all tokens for a user. Call this on password change.
    """
    await token_blacklist.blacklist_user_tokens(user_id, datetime.now(timezone.utc))

# --- Dependency to Require "Pro" User ---
async def require_pro_user() -> User:
    """
    Dependency to ensure the current user has a "PRO" subscription plan.

    Uses the AuthContext populated by AuthMiddleware.
    Raises HTTPException if the user is not authenticated or not a PRO user.

    Returns:
        The authenticated PRO User object from the database.
    """
    from app.core.auth_context import get_auth_context

    context = get_auth_context()

    # Check if authenticated
    if not context.authenticated:
        error_detail = context.error or "Authentication required"
        logger.warning("pro_auth_required", error=error_detail)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if PRO user
    if context.plan != UserPlan.PRO:
        logger.warning("pro_plan_required", user_id=context.user_id, plan=context.plan)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature requires a PRO subscription.",
        )

    # Fetch user from database
    user = await user_service.get_user_by_id(context.user_id)

    if not user:
        logger.error("pro_user_not_found_in_db", user_id=context.user_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    logger.debug("pro_user_authenticated", user_id=context.user_id)
    return user

# --- Dependency Factory for Role-Based Access ---
async def get_optional_current_user() -> Optional[User]:
    """
    Dependency to get the current user if authenticated.

    Uses the AuthContext populated by AuthMiddleware.
    Returns None for unauthenticated requests instead of raising HTTPException.

    Returns:
        The authenticated User object from the database, or None if not authenticated.
    """
    from app.core.auth_context import get_auth_context

    context = get_auth_context()

    # Return None if not authenticated
    if not context.authenticated:
        logger.debug("optional_auth_not_present")
        return None

    # Fetch user from database
    user = await user_service.get_user_by_id(context.user_id)

    if not user:
        logger.warning("optional_user_not_found_in_db", user_id=context.user_id)
        return None

    logger.debug("optional_user_authenticated", user_id=context.user_id)
    return user


def require_role(required_role: UserRole):
    """
    Dependency factory to ensure the user has a specific role.

    Uses the AuthContext populated by AuthMiddleware.
    Returns a dependency function that can be used with FastAPI's Depends().

    Args:
        required_role: The UserRole required to access the endpoint.

    Returns:
        A dependency function that validates the user's role.

    Example:
        @router.get("/admin")
        async def admin_only(user: User = Depends(require_role(UserRole.ADMIN))):
            ...
    """
    async def role_checker() -> User:
        """
        Checks if the user has the required role.
        """
        from app.core.auth_context import get_auth_context

        context = get_auth_context()

        # Check if authenticated
        if not context.authenticated:
            error_detail = context.error or "Authentication required"
            logger.warning("role_auth_required", required_role=required_role.value, error=error_detail)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_detail,
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check if user has required role
        if context.role != required_role:
            logger.warning(
                "role_insufficient_permissions",
                user_id=context.user_id,
                user_role=context.role,
                required_role=required_role.value
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. {required_role.value.capitalize()} role required.",
            )

        # Fetch user from database
        user = await user_service.get_user_by_id(context.user_id)

        if not user:
            logger.error("role_user_not_found_in_db", user_id=context.user_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        logger.debug("role_user_authenticated", user_id=context.user_id, role=context.role)
        return user

    return role_checker
