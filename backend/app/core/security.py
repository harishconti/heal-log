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
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(reusable_oauth2)) -> User:
    """
    Dependency to get the current user from a JWT token.
    Raises HTTPException for invalid credentials.
    """
    try:
        # Step 1: Decode JWT
        logger.info("[AUTH] Decoding JWT token...")
        payload = jwt.decode(
            credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        jti: str = payload.get("jti")
        iat_timestamp = payload.get("iat")

        if user_id is None:
            logger.error("[AUTH] Token payload missing 'sub' (user_id)")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials: user ID not in token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Step 2: Check if token is blacklisted (revoked)
        if jti:
            iat = datetime.fromtimestamp(iat_timestamp, tz=timezone.utc) if iat_timestamp else None
            if token_blacklist.is_token_blacklisted(jti, user_id, iat):
                logger.warning(f"[AUTH] Token has been revoked. User ID: {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has been revoked",
                    headers={"WWW-Authenticate": "Bearer"},
                )

        logger.info(f"[AUTH] Token decoded successfully. User ID: {user_id}")

        # Step 3: Fetch user from database
        logger.info(f"[AUTH] Fetching user from database...")
        user = await user_service.get_user_by_id(user_id)

        if not user:
            logger.error(f"[AUTH] User not found in database. User ID: {user_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        logger.info(f"[AUTH] User authenticated successfully: {user.email}")
        return user

    except jwt.ExpiredSignatureError:
        logger.warning("[AUTH] Token has expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as e:
        logger.error(f"[AUTH] JWT validation error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the actual error for debugging
        logger.error(f"[AUTH] Unexpected authentication error: {str(e)}", exc_info=True)
        logger.error(f"[AUTH] Error type: {type(e).__name__}")
        logger.error(f"[AUTH] User ID attempted: {payload.get('sub') if 'payload' in locals() else 'N/A'}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during authentication: {str(e)}"
        )


def revoke_token(token: str) -> bool:
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
        token_blacklist.blacklist_token(jti, exp)
        return True
    except jwt.PyJWTError as e:
        logger.error(f"[AUTH] Failed to revoke token: {e}")
        return False


def revoke_all_user_tokens(user_id: str) -> None:
    """
    Revoke all tokens for a user. Call this on password change.
    """
    token_blacklist.blacklist_user_tokens(user_id, datetime.now(timezone.utc))

# --- Dependency to Require "Pro" User ---
async def require_pro_user(credentials: HTTPAuthorizationCredentials = Depends(reusable_oauth2)) -> User:
    """
    Dependency to ensure the current user has a "PRO" subscription plan.
    Raises HTTPException if the user is not a pro user.
    """
    try:
        payload = jwt.decode(
            credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        user_plan: str = payload.get("plan")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials: user ID not in token",
            )

        if user_plan != UserPlan.PRO:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This feature requires a PRO subscription.",
            )

        user = await user_service.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired"
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials"
        )

# --- Dependency Factory for Role-Based Access ---
async def get_optional_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_oauth2)) -> Optional[User]:
    """
    Dependency to get the current user from a JWT token if present.
    Returns the user ID if the token is valid, otherwise returns None.
    Does not raise HTTPException for missing or invalid tokens.
    """
    if credentials is None:
        return None
    try:
        payload = jwt.decode(
            credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            return None

        user = await user_service.get_user_by_id(user_id)
        if not user:
            return None

        return user
    except (jwt.PyJWTError, HTTPException):
        # Broadly catch JWT errors or HTTPExceptions from nested dependencies
        # and return None, effectively making authentication optional.
        return None


def require_role(required_role: UserRole):
    """
    Dependency factory to ensure the user has a specific role.
    """
    async def role_checker(credentials: HTTPAuthorizationCredentials = Depends(reusable_oauth2)) -> User:
        """
        Checks if the user has the required role.
        """
        try:
            payload = jwt.decode(
                credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            user_id: str = payload.get("sub")
            user_role: str = payload.get("role")

            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication credentials: user ID not in token",
                )

            if user_role != required_role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions. {required_role.value.capitalize()} role required.",
                )

            user = await user_service.get_user_by_id(user_id)
            if not user:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

            return user
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired"
            )
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials"
            )
    return role_checker
