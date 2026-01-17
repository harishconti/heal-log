import os
import logging
from pydantic import validator, Field, model_validator
from pydantic_settings import BaseSettings
from pathlib import Path
from typing import Optional
from enum import Enum

logger = logging.getLogger(__name__)

# --- Environment Loading ---
# Determine the root directory and load the appropriate .env file
# This allows for different configurations for production and development
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
ENV = os.getenv("ENV", "development")

if ENV == "development":
    env_file = ROOT_DIR / ".env"
    if env_file.exists():
        from dotenv import load_dotenv
        logger.info(f"Loading environment variables from {env_file}")
        load_dotenv(env_file)
    else:
        logger.warning("Running in development, but .env file not found.")

class Environment(str, Enum):
    """Valid environment values"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"

class Settings(BaseSettings):
    # --- Core Settings ---
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ENV: str = "development"

    # --- Database Settings ---
    MONGO_URL: str = "mongomock://localhost"
    DB_NAME: str

    # --- Cache Settings ---
    REDIS_URL: Optional[str] = "redis://localhost:6379"

    @validator("MONGO_URL", "DB_NAME", "SECRET_KEY")
    def not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Environment variable cannot be empty")
        return v

    @validator("SECRET_KEY")
    def validate_secret_key_strength(cls, v, values):
        """Validate SECRET_KEY meets security requirements in production"""
        env = values.get('ENV', 'development')
        if env == "production":
            if len(v) < 32:
                raise ValueError(
                    "SECRET_KEY must be at least 32 characters in production. "
                    "Generate one using: openssl rand -hex 32"
                )
            # Check for common insecure defaults
            insecure_defaults = [
                "your-secret-key",
                "secret",
                "changeme",
                "your_production_secret_key_here",
                "your-secret-key-here"
            ]
            if any(default in v.lower() for default in insecure_defaults):
                raise ValueError(
                    "SECRET_KEY appears to be a default/placeholder value. "
                    "Generate a secure key using: openssl rand -hex 32"
                )
        return v

    # --- CORS Settings ---
    # SECURITY: Default to restrictive CORS for development only.
    # In production, set ALLOWED_ORIGINS to your specific frontend domain(s).
    # Example: ALLOWED_ORIGINS=https://your-app.com,https://www.your-app.com
    # NEVER use "*" in production!
    ALLOWED_ORIGINS: str = "http://localhost:8081,http://localhost:3000"

    # --- Sentry Configuration (Optional) ---
    SENTRY_DSN: Optional[str] = Field(default=None)
    SENTRY_ENVIRONMENT: Optional[str] = Field(default=None)

    # --- Static Files ---
    STATIC_DIR: str = str(ROOT_DIR / "static")
    BASE_URL: str = "http://localhost:8000"

    # --- Email Settings ---
    EMAIL_HOST: Optional[str] = None
    EMAIL_PORT: Optional[int] = None
    EMAIL_USER: Optional[str] = None
    EMAIL_PASSWORD: Optional[str] = None
    EMAIL_TO: Optional[str] = None
    EMAIL_FROM: Optional[str] = "HealLog <support@heallog.com>"

    @model_validator(mode='after')
    def validate_email_configuration(self):
        """Ensure email settings are complete if any are provided"""
        email_fields = {
            'EMAIL_HOST': self.EMAIL_HOST,
            'EMAIL_PORT': self.EMAIL_PORT,
            'EMAIL_USER': self.EMAIL_USER,
            'EMAIL_PASSWORD': self.EMAIL_PASSWORD,
        }

        # Check if any email field is configured
        configured_fields = {k: v for k, v in email_fields.items() if v is not None}

        # If some but not all email fields are set, that's a configuration error
        if configured_fields and len(configured_fields) != len(email_fields):
            missing = [k for k, v in email_fields.items() if v is None]
            logger.warning(
                f"Incomplete email configuration. Missing: {', '.join(missing)}. "
                f"Email functionality may not work properly."
            )

        return self

    # OTP Settings
    OTP_EXPIRE_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 3
    OTP_RESEND_COOLDOWN_SECONDS: int = 60
    
    # Password Reset Settings
    PASSWORD_RESET_EXPIRE_MINUTES: int = 60

    # Google OAuth Settings for Contacts Sync
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: Optional[str] = None
    MOBILE_DEEP_LINK_SCHEME: str = "heallog"
    MOBILE_CALLBACK_PATH: str = "google-contacts/callback"

    class Config:
        case_sensitive = True


settings = Settings()

# --- Environment-Specific CORS Validation ---
# SECURITY: Validate CORS settings in production to prevent security misconfigurations
if settings.ENV == "production":
    # Check for insecure wildcard CORS
    if settings.ALLOWED_ORIGINS == "*" or "*" in settings.ALLOWED_ORIGINS:
        raise ValueError(
            "SECURITY ERROR: Wildcard CORS ('*') is not allowed in production. "
            "Set ALLOWED_ORIGINS to your specific frontend domain(s). "
            "Example: ALLOWED_ORIGINS=https://your-app.com,https://www.your-app.com"
        )

    # Check for empty CORS (which would block all requests)
    if not settings.ALLOWED_ORIGINS or settings.ALLOWED_ORIGINS.strip() == "":
        raise ValueError(
            "SECURITY ERROR: ALLOWED_ORIGINS must be set in production. "
            "Example: ALLOWED_ORIGINS=https://your-app.com"
        )

    # Warn if localhost is in production CORS
    if "localhost" in settings.ALLOWED_ORIGINS.lower():
        logger.warning(
            "SECURITY WARNING: localhost found in ALLOWED_ORIGINS in production. "
            "This may be a security risk. Remove localhost origins for production."
        )