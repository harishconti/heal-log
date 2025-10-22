import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
ROOT_DIR = Path(__file__).resolve().parent.parent.parent  # This should be the backend directory
load_dotenv(ROOT_DIR / '.env')

# --- Core Settings ---
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("No SECRET_KEY set for the application")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

# --- Database Settings ---
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

# --- CORS Settings ---
# In a production environment, you should restrict this to your frontend's domain
ALLOWED_ORIGINS = ["*"]

class Settings:
    SECRET_KEY: str = SECRET_KEY
    ALGORITHM: str = ALGORITHM
    ACCESS_TOKEN_EXPIRE_MINUTES: int = ACCESS_TOKEN_EXPIRE_MINUTES
    REFRESH_TOKEN_EXPIRE_DAYS: int = REFRESH_TOKEN_EXPIRE_DAYS
    MONGO_URL: str = MONGO_URL
    DB_NAME: str = DB_NAME
    ALLOWED_ORIGINS: list[str] = ALLOWED_ORIGINS

settings = Settings()