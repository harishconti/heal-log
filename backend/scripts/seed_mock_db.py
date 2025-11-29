import asyncio
import os
from app.db.session import connect_to_mongo, get_database
from app.schemas.user import User, UserCreate
from app.core.hashing import get_password_hash
from app.core.config import settings
from beanie import init_beanie
from app.schemas.patient import Patient
from app.schemas.clinical_note import ClinicalNote
from app.schemas.document import Document
from app.schemas.feedback import Feedback
from app.schemas.telemetry import Telemetry
from app.schemas.error_event import ErrorEvent
from app.schemas.query_performance_event import QueryPerformanceEvent
from app.schemas.sync_event import SyncEvent
from app.schemas.beta_feedback import BetaFeedback

async def seed_db():
    print(f"Connecting to {settings.MONGO_URL}...")
    await connect_to_mongo()
    db = await get_database()
    
    await init_beanie(
        database=db,
        document_models=[User, Patient, ClinicalNote, Document, Feedback, Telemetry, ErrorEvent, QueryPerformanceEvent, SyncEvent, BetaFeedback],
        allow_index_dropping=True
    )

    print("Seeding test user...")
    
    # Create a test user with a known password
    test_user_email = "test@example.com"
    test_password = "password123"
    
    existing_user = await User.find_one({"email": test_user_email})
    if existing_user:
        print(f"User {test_user_email} already exists.")
    else:
        user_create = UserCreate(
            email=test_user_email,
            password=test_password,
            full_name="Test Doctor",
            medical_specialty="General Practice"
        )
        
        # Manually create user to ensure password hash is set correctly
        password_hash = get_password_hash(test_password)
        user = User(
            email=user_create.email,
            full_name=user_create.full_name,
            medical_specialty=user_create.medical_specialty,
            password_hash=password_hash,
            role="doctor",
            plan="basic"
        )
        await user.insert()
        print(f"Created user: {test_user_email} / {test_password}")

    # Create a legacy user (missing password hash) to verify the fix
    legacy_user_email = "legacy@example.com"
    existing_legacy = await User.find_one({"email": legacy_user_email})
    if not existing_legacy:
        legacy_user = User(
            email=legacy_user_email,
            full_name="Legacy Doctor",
            medical_specialty="Old School",
            password_hash=None, # Explicitly None
            role="doctor",
            plan="basic"
        )
        await legacy_user.insert()
        print(f"Created legacy user: {legacy_user_email} (no password hash)")

if __name__ == "__main__":
    asyncio.run(seed_db())
