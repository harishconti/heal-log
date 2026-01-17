"""
Application-wide constants for configuration and defaults.
These constants are used across the backend to maintain consistency
and make configuration changes easier.
"""

# Pagination defaults and limits
DEFAULT_PAGE_SIZE = 100
MAX_PAGE_SIZE = 500
MIN_PAGE_SIZE = 1
DEFAULT_SKIP = 0

# Export limits
MAX_EXPORT_RECORDS = 10000

# Retry configuration
DEFAULT_MAX_RETRIES = 5

# Cache expiration times (in seconds)
CACHE_SHORT = 60  # 1 minute
CACHE_MEDIUM = 300  # 5 minutes
CACHE_LONG = 3600  # 1 hour

# ==========================================
# Rate Limits - Authentication & Security
# ==========================================

# Account Lockout Settings
MAX_FAILED_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15
LOCKOUT_ATTEMPT_WINDOW_MINUTES = 15  # Track attempts within this window

# OTP Settings
OTP_MAX_ATTEMPTS = 3
OTP_EXPIRE_MINUTES = 5
OTP_RESEND_COOLDOWN_SECONDS = 60

# Password Reset Settings
PASSWORD_RESET_EXPIRE_MINUTES = 60
PASSWORD_RESET_MAX_REQUESTS = 10  # Per day

# API Rate Limits (format: "requests/period")
# Authentication Endpoints
RATE_LIMIT_REGISTER = "5/minute"
RATE_LIMIT_LOGIN = "5/minute"
RATE_LIMIT_VERIFY_OTP = "10/minute"
RATE_LIMIT_RESEND_OTP = "3/minute"
RATE_LIMIT_REFRESH_TOKEN = "20/minute"

# Password Management
RATE_LIMIT_FORGOT_PASSWORD = "5/10minutes"
RATE_LIMIT_FORGOT_PASSWORD_DAILY = "10/day"
RATE_LIMIT_RESET_PASSWORD = "5/10minutes"
RATE_LIMIT_RESET_PASSWORD_DAILY = "15/day"
RATE_LIMIT_PASSWORD_CHANGE = "3/hour"

# General API Endpoints
RATE_LIMIT_API_DEFAULT = "100/minute"
RATE_LIMIT_EXPORT = "10/hour"
RATE_LIMIT_WEBHOOK = "50/minute"

# HTTP Status code messages
HTTP_ERROR_MESSAGES = {
    400: "Bad request",
    401: "Authentication required",
    403: "Access forbidden",
    404: "Resource not found",
    422: "Validation error",
    429: "Too many requests",
    500: "Internal server error",
}

# Auth response messages
AUTH_MESSAGES = {
    "registration_success": "Registration successful. Please verify your email with the OTP sent.",
    "otp_sent": "New OTP sent successfully.",
    "password_reset_sent": "If an account exists with this email, a password reset link has been sent.",
    "password_reset_success": "Password reset successfully. You can now login with your new password.",
}

# File upload limits
MAX_SCREENSHOT_SIZE_MB = 5
MAX_SCREENSHOT_SIZE_BYTES = MAX_SCREENSHOT_SIZE_MB * 1024 * 1024
MAX_WEBHOOK_PAYLOAD_SIZE_MB = 1
MAX_WEBHOOK_PAYLOAD_SIZE_BYTES = MAX_WEBHOOK_PAYLOAD_SIZE_MB * 1024 * 1024

# Timeouts
PASSWORD_RESET_TOKEN_EXPIRE_SECONDS = 86400  # 24 hours
