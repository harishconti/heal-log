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
    await init_beanie(
        database=db_client.test_medical_contacts,
        document_models=[User, Patient, ClinicalNote, Document, Feedback],
        allow_index_dropping=True
    )
    collections = [User, Patient, ClinicalNote, Document, Feedback]
    for collection in collections:
        await collection.delete_all()
    yield
    for collection in collections:
        await collection.delete_all()

import time
import pytest
from app.schemas.user import UserCreate

@pytest_asyncio.fixture
def limiter():
    """
    Returns a fresh Limiter instance for each test.
    """
    from slowapi import Limiter
    from slowapi.util import get_remote_address

    return Limiter(key_func=get_remote_address)

@pytest.fixture
def beta_user() -> UserCreate:
    return UserCreate(
        email="beta@example.com",
        full_name="Beta User",
        password="password",
        plan="beta"
    )

@pytest.fixture(autouse=True)
def mock_sentry(mocker):
    mocker.patch("sentry_sdk.capture_exception")

@pytest.fixture(autouse=True)
def time_test(request):
    start_time = time.time()
    yield
    end_time = time.time()
    print(f"Test {request.node.name} took {end_time - start_time:.2f}s")