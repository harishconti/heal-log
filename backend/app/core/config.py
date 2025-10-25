import os
from pydantic import validator
from pydantic_settings import BaseSettings
from pathlib import Path

# --- Environment Loading ---
# Determine the root directory and load the appropriate .env file
# This allows for different configurations for production and development
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
ENV = os.getenv("ENV", "development")

if ENV == "development":
    env_file = ROOT_DIR / ".env"
    if env_file.exists():
        from dotenv import load_dotenv
        print(f"Loading environment variables from {env_file}")
        load_dotenv(env_file)
    else:
        print("Running in development, but .env file not found.")

class Settings(BaseSettings):
    # --- Core Settings ---
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ENV: str = "development"

    # --- Database Settings ---
    MONGO_URL: str
    DB_NAME: str

    # --- Cache Settings ---
    REDIS_URL: str = "redis://localhost:6379"

    @validator("MONGO_URL", "DB_NAME", "SECRET_KEY", "REDIS_URL")
    def not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Environment variable cannot be empty")
        return v

    # --- CORS Settings ---
    ALLOWED_ORIGINS: list[str] = ["http://localhost:8081", "http://localhost:3000"]

    @validator("ALLOWED_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v, values):
        if isinstance(v, str) and not v.startswith("["):
            # If the value is a string and does not start with '[',
            # assume it's a comma-separated list and parse it.
            return [i.strip() for i in v.split(",")]
        if isinstance(v, (list, str)):
            # If it's already a list or a string that looks like a list, return as is.
            return v
        raise ValueError("Invalid format for ALLOWED_ORIGINS")

    class Config:
        case_sensitive = True


settings = Settings()

# --- Environment-Specific Overrides ---
# In a production environment, you would override the ALLOWED_ORIGINS
# with a more restrictive list. For example, by setting the
# an environment variable:
# export ALLOWED_ORIGINS="https://your-frontend.com,https://another-domain.com"
#
# If the ENV is 'production', we enforce a stricter CORS policy.
if settings.ENV == "production":
    # In a real production scenario, this should be a specific, trusted domain.
    # The default "*" is replaced with a more secure, empty list,
    # forcing the developer to explicitly set origins via environment variables.
    settings.ALLOWED_ORIGINS = []

# --- Security Note on CORS ---
# In a production environment, the wildcard ("*") for ALLOWED_ORIGINS is insecure.
# It is strongly recommended to restrict it to your frontend's specific domain.
# For example:
# ALLOWED_ORIGINS=["https://your-frontend-domain.com"]