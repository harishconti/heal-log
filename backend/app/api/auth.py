from fastapi import APIRouter, Depends, status, Request, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.user import User, UserCreate, UserResponse
from app.schemas.otp import OTPVerifyRequest, OTPResendRequest, PasswordResetRequest, PasswordResetConfirm
from app.core.exceptions import APIException
from app.core.limiter import limiter
from app.core.logger import get_logger
from app.schemas.token import Token, RefreshToken
from app.services.user_service import user_service
from app.services.otp_service import otp_service
from app.services.password_reset_service import password_reset_service
from app.services.account_lockout_service import account_lockout
from app.core.security import create_access_token, create_refresh_token, get_current_user, revoke_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from app.core.config import settings

# Bearer token dependency for logout
bearer_scheme = HTTPBearer()

logger = get_logger(__name__)

# Rate limiting constants
REGISTER_RATE_LIMIT = "5/minute"
VERIFY_OTP_RATE_LIMIT = "10/minute"
RESEND_OTP_RATE_LIMIT = "3/minute"
LOGIN_RATE_LIMIT = "5/minute"
FORGOT_PASSWORD_RATE_LIMIT = "5/10minutes"
FORGOT_PASSWORD_DAILY_LIMIT = "10/day"
RESET_PASSWORD_RATE_LIMIT = "5/10minutes"
RESET_PASSWORD_DAILY_LIMIT = "15/day"
REFRESH_TOKEN_RATE_LIMIT = "20/minute"

# Per-email rate limiting constants
MAX_OTP_VERIFICATION_ATTEMPTS = 5
OTP_VERIFICATION_CACHE_TTL = 900  # 15 minutes in seconds
MAX_FORGOT_PASSWORD_EMAILS_PER_DAY = 5
FORGOT_PASSWORD_CACHE_TTL = 86400  # 24 hours in seconds

router = APIRouter()

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
@limiter.limit(REGISTER_RATE_LIMIT)
async def register_user(request: Request, user_data: UserCreate):
    """
    Register a new user. Sends OTP for email verification.
    User must verify email before logging in.
    """
    try:
        existing_user = await user_service.get_user_by_email(user_data.email)
        if existing_user:
            raise APIException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists. Please sign in instead."
            )

        user = await user_service.create(user_data)
        
        # Send OTP for verification
        otp_sent, otp_message = await otp_service.create_and_send_otp(user)
        
        return {
            "success": True,
            "message": "Registration successful. Please verify your email with the OTP sent.",
            "requires_verification": True,
            "email": user.email
        }
    except APIException:
        raise
    except Exception as e:
        logger.error("registration_error", error=str(e), exc_info=True)
        raise APIException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during registration."
        )

@router.post("/verify-otp", response_model=dict)
@limiter.limit(VERIFY_OTP_RATE_LIMIT)
async def verify_otp(request: Request, otp_data: OTPVerifyRequest):
    """
    Verify email using OTP. Returns tokens on success.
    Rate limited to 10/minute globally and 5 attempts per email per 15 minutes.
    """
    email_lower = otp_data.email.lower().strip()

    # Per-email rate limiting to prevent brute force attacks on specific emails
    email_key = f"otp_verify_email:{email_lower}"
    try:
        from fastapi_cache import FastAPICache
        backend = FastAPICache.get_backend()
        if backend:
            count_str = await backend.get(email_key)
            email_count = int(count_str) if count_str else 0

            # Check per-email rate limit
            if email_count >= MAX_OTP_VERIFICATION_ATTEMPTS:
                logger.warning("otp_verify_rate_limit", email=email_lower)
                raise APIException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many verification attempts for this email. Please wait {OTP_VERIFICATION_CACHE_TTL // 60} minutes."
                )

            # Increment count with TTL
            await backend.set(email_key, str(email_count + 1), expire=OTP_VERIFICATION_CACHE_TTL)
    except APIException:
        raise
    except Exception as e:
        logger.debug("otp_verify_cache_unavailable", error=str(e))

    user = await user_service.get_user_by_email(otp_data.email)
    if not user:
        raise APIException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email."
        )

    if user.is_verified:
        raise APIException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified."
        )

    success, message = await otp_service.verify_otp(user, otp_data.otp_code)

    if not success:
        raise APIException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Generate tokens
    access_token = create_access_token(subject=user.id, plan=user.plan, role=user.role)
    refresh_token = create_refresh_token(subject=user.id)
    
    return {
        "success": True,
        "message": message,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse(**user.model_dump())
    }

@router.post("/resend-otp", response_model=dict)
@limiter.limit(RESEND_OTP_RATE_LIMIT)
async def resend_otp(request: Request, otp_data: OTPResendRequest):
    """
    Resend OTP for email verification. Has a 60-second cooldown.
    """
    user = await user_service.get_user_by_email(otp_data.email)
    if not user:
        raise APIException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email."
        )
    
    if user.is_verified:
        raise APIException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified."
        )
    
    # Check cooldown
    can_resend, seconds_remaining = otp_service.can_resend_otp(user)
    if not can_resend:
        raise APIException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {seconds_remaining} seconds before requesting a new OTP."
        )
    
    success, message = await otp_service.create_and_send_otp(user)
    
    if not success:
        raise APIException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=message
        )
    
    return {
        "success": True,
        "message": "New OTP sent successfully."
    }

@router.post("/login", response_model=dict)
@limiter.limit(LOGIN_RATE_LIMIT)
async def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticate a user and return tokens and user info.
    User must be verified to login.
    Implements account lockout after 5 failed attempts.
    """
    email = form_data.username.lower().strip()

    # Check if account is locked
    is_locked, lock_info = account_lockout.is_locked(email)
    if is_locked:
        minutes_remaining = (lock_info or 0) // 60 + 1
        logger.warning("login_blocked_locked_account", email=email)
        raise APIException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account temporarily locked due to too many failed attempts. Try again in {minutes_remaining} minutes."
        )

    user = await user_service.authenticate(form_data.username, form_data.password)
    if not user:
        # Record failed attempt and check if now locked
        is_now_locked, info = account_lockout.record_failed_attempt(email)
        if is_now_locked:
            minutes_remaining = (info or 0) // 60 + 1
            raise APIException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account locked due to too many failed attempts. Try again in {minutes_remaining} minutes."
            )
        raise APIException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Clear lockout on successful authentication
    account_lockout.clear_attempts(email)

    # Check if user is verified
    if not user.is_verified:
        # Send new OTP
        await otp_service.create_and_send_otp(user)
        raise APIException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. A new verification code has been sent to your email."
        )

    access_token = create_access_token(subject=user.id, plan=user.plan, role=user.role)
    refresh_token = create_refresh_token(subject=user.id)

    return {
        "success": True,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse(**user.model_dump())
    }

@router.post("/forgot-password", response_model=dict)
@limiter.limit(FORGOT_PASSWORD_RATE_LIMIT)
@limiter.limit(FORGOT_PASSWORD_DAILY_LIMIT)
async def forgot_password(request: Request, reset_data: PasswordResetRequest):
    """
    Initiate password reset. Sends reset token via email.
    Rate limited to 5 requests per 10 minutes, max 10 per day per IP.
    Also limits per email: max 3 per hour, 5 per day.
    After daily limit, user must wait 24 hours.
    """
    # Log the request for abuse tracking
    client_ip = request.client.host if request.client else "unknown"
    email_lower = reset_data.email.lower().strip()
    logger.info("forgot_password_request", client_ip=client_ip, email=email_lower)

    # Per-email rate limiting using Redis/cache (if available)
    # Check if this email has exceeded limits
    email_key = f"forgot_password_email:{email_lower}"
    try:
        from fastapi_cache import FastAPICache
        backend = FastAPICache.get_backend()
        if backend:
            # Get current count for this email
            count_str = await backend.get(email_key)
            email_count = int(count_str) if count_str else 0

            # Check per-email rate limit
            if email_count >= MAX_FORGOT_PASSWORD_EMAILS_PER_DAY:
                logger.warning("forgot_password_rate_limit", email=email_lower, client_ip=client_ip)
                return {
                    "success": True,
                    "message": "If an account exists with this email, a password reset link has been sent."
                }

            # Increment count with TTL
            await backend.set(email_key, str(email_count + 1), expire=FORGOT_PASSWORD_CACHE_TTL)
    except Exception as e:
        logger.debug("forgot_password_cache_unavailable", error=str(e))

    user = await user_service.get_user_by_email(reset_data.email)

    # Always return success to prevent email enumeration
    if not user:
        logger.info("forgot_password_user_not_found", client_ip=client_ip)
        return {
            "success": True,
            "message": "If an account exists with this email, a password reset link has been sent."
        }

    success, message = await password_reset_service.create_and_send_reset_token(user)

    if success:
        logger.info("forgot_password_token_sent", client_ip=client_ip)
    else:
        logger.warning("forgot_password_send_failed", client_ip=client_ip, message=message)
    
    return {
        "success": True,
        "message": "If an account exists with this email, a password reset link has been sent."
    }

@router.post("/reset-password", response_model=dict)
@limiter.limit(RESET_PASSWORD_RATE_LIMIT)
@limiter.limit(RESET_PASSWORD_DAILY_LIMIT)
async def reset_password(request: Request, reset_data: PasswordResetConfirm):
    """
    Reset password using the token from email.
    Rate limited to 5 attempts per 10 minutes, max 15 per day per IP.
    """
    # Log for abuse tracking
    client_ip = request.client.host if request.client else "unknown"
    logger.info("reset_password_attempt", client_ip=client_ip, token=reset_data.token)

    user, message = await password_reset_service.verify_reset_token(reset_data.token)

    if not user:
        logger.warning("reset_password_invalid_token", client_ip=client_ip)
        raise APIException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    success, result_message = await password_reset_service.reset_password(user, reset_data.new_password)

    if not success:
        logger.error("reset_password_failed", client_ip=client_ip, message=result_message)
        raise APIException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result_message
        )

    logger.info("reset_password_success", client_ip=client_ip)
    return {
        "success": True,
        "message": "Password reset successfully. You can now login with your new password."
    }

@router.post("/refresh", response_model=Token)
@limiter.limit(REFRESH_TOKEN_RATE_LIMIT)
async def refresh_access_token(request: Request, refresh_token_data: RefreshToken):
    """
    Refresh an access token using a valid refresh token.
    """
    try:
        payload = jwt.decode(
            refresh_token_data.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != "refresh":
            raise APIException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        user_id = payload.get("sub")
        if not user_id:
            raise APIException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        user = await user_service.get_user_by_id(user_id)
        if not user:
            raise APIException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        access_token = create_access_token(subject=user.id, plan=user.plan, role=user.role)
        new_refresh_token = create_refresh_token(subject=user.id)

        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }
    except jwt.ExpiredSignatureError:
        raise APIException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )
    except jwt.PyJWTError:
        raise APIException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

@router.get("/me", response_model=dict)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get the current authenticated user's information.

    Note: The get_current_user dependency already raises HTTPException if user is not authenticated,
    so current_user is guaranteed to be valid at this point.
    """
    return {"success": True, "user": UserResponse(**current_user.model_dump())}


@router.post("/logout", response_model=dict)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    """
    Logout the current user by revoking their access token.

    This endpoint blacklists the current access token to prevent further use.
    The client should also clear local token storage after calling this endpoint.

    Note: The refresh token should also be discarded by the client.
    For enhanced security, both tokens could be revoked, but the access token
    is the primary concern as it's used for API access.
    """
    token = credentials.credentials

    try:
        # Revoke the access token
        success = revoke_token(token)

        if success:
            logger.info("logout_success")
            return {
                "success": True,
                "message": "Successfully logged out. Token has been revoked."
            }
        else:
            # Token couldn't be revoked (likely missing jti), but still log out client-side
            logger.warning("logout_revocation_failed")
            return {
                "success": True,
                "message": "Logged out. Please clear your local tokens."
            }
    except Exception as e:
        logger.error("logout_error", error=str(e))
        # Even on error, we should allow the client to clear tokens
        return {
            "success": True,
            "message": "Logged out. Please clear your local tokens."
        }
