from fastapi import APIRouter, Depends, status, Request, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.user import User, UserCreate, UserResponse
from app.schemas.otp import OTPVerifyRequest, OTPResendRequest, PasswordResetRequest, PasswordResetConfirm
from app.core.exceptions import APIException
from app.core.limiter import limiter
from app.schemas.token import Token, RefreshToken
from app.services.user_service import user_service
from app.services.otp_service import otp_service
from app.services.password_reset_service import password_reset_service
from app.core.security import create_access_token, create_refresh_token, get_current_user
import jwt
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
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
        logging.error(f"Unhandled exception during user registration: {e}", exc_info=True)
        raise APIException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during registration."
        )

@router.post("/verify-otp", response_model=dict)
@limiter.limit("10/minute")
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

            # Max 5 attempts per email per 15 minutes
            if email_count >= 5:
                logger.warning(f"[VERIFY_OTP] Per-email rate limit exceeded for {email_lower[:3]}***")
                raise APIException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many verification attempts for this email. Please wait 15 minutes."
                )

            # Increment count (expires in 15 minutes)
            await backend.set(email_key, str(email_count + 1), expire=900)
    except APIException:
        raise
    except Exception as e:
        logger.debug(f"[VERIFY_OTP] Cache not available for per-email rate limit: {e}")

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
@limiter.limit("3/minute")
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
@limiter.limit("5/minute")
async def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticate a user and return tokens and user info.
    User must be verified to login.
    """
    user = await user_service.authenticate(form_data.username, form_data.password)
    if not user:
        raise APIException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
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
@limiter.limit("5/10minutes")
@limiter.limit("10/day")
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
    logger.info(f"[FORGOT_PASSWORD] Request from IP: {client_ip} for email: {email_lower[:3]}***")
    
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
            
            # Max 5 requests per day per email
            if email_count >= 5:
                logger.warning(f"[FORGOT_PASSWORD] Email rate limit exceeded for {email_lower[:3]}*** (IP: {client_ip})")
                return {
                    "success": True,
                    "message": "If an account exists with this email, a password reset link has been sent."
                }
            
            # Increment count (expires in 24 hours)
            await backend.set(email_key, str(email_count + 1), expire=86400)
    except Exception as e:
        logger.debug(f"[FORGOT_PASSWORD] Cache not available for email rate limit: {e}")
    
    user = await user_service.get_user_by_email(reset_data.email)
    
    # Always return success to prevent email enumeration
    if not user:
        logger.info(f"[FORGOT_PASSWORD] No user found for email (IP: {client_ip})")
        return {
            "success": True,
            "message": "If an account exists with this email, a password reset link has been sent."
        }
    
    success, message = await password_reset_service.create_and_send_reset_token(user)
    
    if success:
        logger.info(f"[FORGOT_PASSWORD] Reset token sent successfully for user (IP: {client_ip})")
    else:
        logger.warning(f"[FORGOT_PASSWORD] Failed to send reset token (IP: {client_ip}): {message}")
    
    return {
        "success": True,
        "message": "If an account exists with this email, a password reset link has been sent."
    }

@router.post("/reset-password", response_model=dict)
@limiter.limit("5/10minutes")
@limiter.limit("15/day")
async def reset_password(request: Request, reset_data: PasswordResetConfirm):
    """
    Reset password using the token from email.
    Rate limited to 5 attempts per 10 minutes, max 15 per day per IP.
    """
    # Log for abuse tracking
    client_ip = request.client.host if request.client else "unknown"
    token_preview = reset_data.token[:8] + "..." if len(reset_data.token) > 8 else reset_data.token
    logger.info(f"[RESET_PASSWORD] Attempt from IP: {client_ip}, token: {token_preview}")
    
    user, message = await password_reset_service.verify_reset_token(reset_data.token)
    
    if not user:
        logger.warning(f"[RESET_PASSWORD] Invalid token attempt from IP: {client_ip}")
        raise APIException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    success, result_message = await password_reset_service.reset_password(user, reset_data.new_password)
    
    if not success:
        logger.error(f"[RESET_PASSWORD] Password reset failed for user (IP: {client_ip}): {result_message}")
        raise APIException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result_message
        )
    
    logger.info(f"[RESET_PASSWORD] Password reset successful (IP: {client_ip})")
    return {
        "success": True,
        "message": "Password reset successfully. You can now login with your new password."
    }

@router.post("/refresh", response_model=Token)
@limiter.limit("20/minute")
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
