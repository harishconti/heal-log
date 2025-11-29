import os
import logging
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
try:
    from mongomock_motor import AsyncMongoMockClient
except ImportError:
    AsyncMongoMockClient = None
from pymongo.errors import ConnectionFailure
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings

# --- Connection Pool Settings ---
MAX_CONNECTIONS_COUNT = int(os.getenv("MAX_CONNECTIONS_COUNT", 100))
MIN_CONNECTIONS_COUNT = int(os.getenv("MIN_CONNECTIONS_COUNT", 10))

# --- Database Client ---
# We initialize the client as None and connect in a separate function.
client = None

# --- Retry Logic for Connection ---
# This decorator will retry the connection 5 times over a period of ~2 minutes
# in case of a ConnectionFailure, with exponential backoff.
@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=4, max=60),
    retry=retry_if_exception_type(ConnectionFailure)
)
async def connect_to_mongo():
    """
    Connects to the MongoDB database with retry logic.
    """
    global client
    logging.info(f"Attempting to connect to MongoDB at {settings.MONGO_URL}...")
    try:
        if settings.MONGO_URL.startswith("mongomock://"):
            if AsyncMongoMockClient is None:
                raise ImportError("mongomock_motor is not installed")
            client = AsyncMongoMockClient()
            logging.info("Using AsyncMongoMockClient for testing.")
        else:
            client = AsyncIOMotorClient(
                settings.MONGO_URL,
                maxPoolSize=MAX_CONNECTIONS_COUNT,
                minPoolSize=MIN_CONNECTIONS_COUNT,
                serverSelectionTimeoutMS=5000  # Timeout for server selection
            )
            # The ismaster command is cheap and does not require auth.
            await client.admin.command('ismaster')
            
        logging.info("Successfully connected to MongoDB.")
    except ConnectionFailure as e:
        logging.error(f"Failed to connect to MongoDB: {e}")
        raise  # Reraise the exception to trigger tenacity's retry mechanism

async def get_database():
    """
    Returns the database instance. This is now an async function to
    ensure the connection is established before returning the database.
    """
    if client is None:
        await connect_to_mongo()
    return client[settings.DB_NAME]

async def close_mongo_connection():
    """
    Closes the MongoDB connection.
    """
    if client:
        client.close()
        logging.info("MongoDB connection closed.")

# To be used as a dependency in FastAPI routes
async def get_db():
    """
    FastAPI dependency to get the database instance.
    """
    db = await get_database()
    return db

# --- Collections ---
# It's better to get the database instance and then define collections.
# This ensures that we don't try to access the database before the connection is established.
async def get_user_collection():
    db = await get_database()
    return db.get_collection("users")

async def get_patient_collection():
    db = await get_database()
    return db.get_collection("patients")

async def get_counter_collection():
    db = await get_database()
    return db.get_collection("counters")

async def get_clinical_note_collection():
    db = await get_database()
    return db.get_collection("clinical_notes")

async def get_document_collection():
    db = await get_database()
    return db.get_collection("documents")