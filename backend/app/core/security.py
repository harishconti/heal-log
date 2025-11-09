from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import jwt
import uuid

from app.core.config import settings
from app.schemas.user import UserPlan
from app.schemas.role import UserRole
from app.core.hashing import verify_password
from app.services import user_service
from app.models.user import User

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
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {"exp": expire, "sub": str(subject), "plan": plan, "role": role}
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

# --- Dependency to Get Current User ---
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(reusable_oauth2)) -> str:
    """
    Dependency to get the current user from a JWT token.
    Raises HTTPException for invalid credentials.
    """
    try:
        payload = jwt.decode(
            credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials: user ID not in token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = await user_service.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        return user.id
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during authentication"
        )

# --- Dependency to Require "Pro" User ---
async def require_pro_user(credentials: HTTPAuthorizationCredentials = Depends(reusable_oauth2)) -> str:
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

        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired"
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials"
        )

# --- Dependency Factory for Role-Based Access ---
async def get_optional_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_oauth2)) -> Optional[str]:
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

        return user.id
    except (jwt.PyJWTError, HTTPException):
        # Broadly catch JWT errors or HTTPExceptions from nested dependencies
        # and return None, effectively making authentication optional.
        return None


def require_role(required_role: UserRole):
    """
    Dependency factory to ensure the user has a specific role.
    """
    async def role_checker(credentials: HTTPAuthorizationCredentials = Depends(reusable_oauth2)) -> str:
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

            return user_id
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired"
            )
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials"
            )
    return role_checker