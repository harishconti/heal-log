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
