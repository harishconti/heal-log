import pytest_asyncio
import asyncio
from mongomock_motor import AsyncMongoMockClient
from beanie import init_beanie
from app.schemas.user import User
from app.schemas.patient import Patient
from app.schemas.clinical_note import ClinicalNote
from app.schemas.document import Document

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
        document_models=[User, Patient, ClinicalNote, Document]
    )

    yield client

    client.close()

@pytest_asyncio.fixture(autouse=True)
async def db(db_client):
    """
    This fixture ensures that the database is initialized for every test.
    It depends on db_client, so it will run after the db connection is set up.
    """
    pass