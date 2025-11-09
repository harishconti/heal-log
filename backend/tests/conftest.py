import pytest_asyncio
import asyncio
from mongomock_motor import AsyncMongoMockClient
from beanie import init_beanie
from app.schemas.user import User
from app.schemas.patient import Patient
from app.schemas.clinical_note import ClinicalNote
from app.schemas.document import Document
from app.schemas.feedback import Feedback

@pytest_asyncio.fixture(scope="session")
def event_loop():
    """Overrides pytest-asyncio's event_loop fixture to be session-scoped."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session", autouse=True)
async def db_client():
    """
    Initializes the in-memory database connection for the test session.
    """
    from fastapi_cache import FastAPICache
    from fastapi_cache.backends.inmemory import InMemoryBackend

    FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")
    client = AsyncMongoMockClient()
    database = client["test_medical_contacts"]

    # Initialize Beanie with all the document models
    await init_beanie(
        database=database,
        document_models=[User, Patient, ClinicalNote, Document, Feedback]
    )

    yield client

    client.close()

@pytest_asyncio.fixture(autouse=True)
async def db(db_client):
    """
    This fixture ensures that the database is initialized for every test
    and clears all collections before each test run to ensure isolation.
    """
    collections = [User, Patient, ClinicalNote, Document, Feedback]
    for collection in collections:
        await collection.delete_all()
    yield
    for collection in collections:
        await collection.delete_all()