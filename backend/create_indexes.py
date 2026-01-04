#!/usr/bin/env python3
"""
Database Indexing Script
Creates indexes on MongoDB collections for improved query performance.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection settings
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "heallog")

async def create_indexes():
    """Create database indexes for performance optimization"""
    
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        
        logger.info(f"Connected to MongoDB: {DATABASE_NAME}")
        
        # ================================================================
        # PATIENTS COLLECTION INDEXES
        # ================================================================
        logger.info("Creating indexes on 'patients' collection...")
        
        patients = db.patients
        
        # Index on user_id (most critical - used in all patient queries)
        await patients.create_index([("user_id", ASCENDING)], name="idx_user_id")
        logger.info("✅ Created index: patients.user_id")
        
        # Compound index on user_id + is_favorite (for favorites queries)
        await patients.create_index(
            [("user_id", ASCENDING), ("is_favorite", DESCENDING)],
            name="idx_user_favorites"
        )
        logger.info("✅ Created index: patients.user_id + is_favorite")
        
        # Compound index on user_id + group (for group filtering)
        await patients.create_index(
            [("user_id", ASCENDING), ("group", ASCENDING)],
            name="idx_user_group"
        )
        logger.info("✅ Created index: patients.user_id + group")
        
        # Index on patient_id for lookup
        await patients.create_index([("patient_id", ASCENDING)], name="idx_patient_id")
        logger.info("✅ Created index: patients.patient_id")

        # UNIQUE compound index on user_id + name (prevents duplicate patient names per user)
        # This enforces atomicity for patient creation race condition prevention
        await patients.create_index(
            [("user_id", ASCENDING), ("name", ASCENDING)],
            unique=True,
            name="idx_user_name_unique"
        )
        logger.info("✅ Created UNIQUE index: patients.user_id + name")
        
        # Index on created_at for sorting
        await patients.create_index([("created_at", DESCENDING)], name="idx_created_at")
        logger.info("✅ Created index: patients.created_at")
        
        # Compound index for sync queries (user_id + updated_at)
        await patients.create_index(
            [("user_id", ASCENDING), ("updated_at", DESCENDING)],
            name="idx_sync_patients"
        )
        logger.info("✅ Created index: patients.user_id + updated_at (for sync)")
        
        # ================================================================
        # CLINICAL NOTES COLLECTION INDEXES
        # ================================================================
        logger.info("\nCreating indexes on 'clinical_notes' collection...")
        
        notes = db.clinical_notes
        
        # Index on patient_id (most critical for fetching patient notes)
        await notes.create_index([("patient_id", ASCENDING)], name="idx_patient_id")
        logger.info("✅ Created index: clinical_notes.patient_id")
        
        # Index on user_id
        await notes.create_index([("user_id", ASCENDING)], name="idx_user_id")
        logger.info("✅ Created index: clinical_notes.user_id")
        
        # Compound index on patient_id + created_at (for sorted note retrieval)
        await notes.create_index(
            [("patient_id", ASCENDING), ("created_at", DESCENDING)],
            name="idx_patient_notes_sorted"
        )
        logger.info("✅ Created index: clinical_notes.patient_id + created_at")
        
        # Compound index for sync queries (user_id + updated_at)
        await notes.create_index(
            [("user_id", ASCENDING), ("updated_at", DESCENDING)],
            name="idx_sync_notes"
        )
        logger.info("✅ Created index: clinical_notes.user_id + updated_at (for sync)")
        
        # ================================================================
        # USERS COLLECTION INDEXES
        # ================================================================
        logger.info("\nVerifying indexes on 'users' collection...")
        
        users = db.users
        
        # Verify email index exists (should be created by Beanie)
        existing_indexes = await users.list_indexes().to_list(length=100)
        has_email_index = any(idx.get('name') == 'email_1' for idx in existing_indexes)
        
        if has_email_index:
            logger.info("✅ Email index already exists: users.email")
        else:
            # Create email unique index if it doesn't exist
            await users.create_index([("email", ASCENDING)], unique=True, name="idx_email")
            logger.info("✅ Created index: users.email (unique)")
        
        # ================================================================
        # SUMMARY
        # ================================================================
        logger.info("\n" + "="*60)
        logger.info("Index Creation Summary")
        logger.info("="*60)
        
        # List all indexes for each collection
        for collection_name in ["patients", "clinical_notes", "users"]:
            collection = db[collection_name]
            indexes = await collection.list_indexes().to_list(length=100)
            logger.info(f"\n{collection_name.upper()} Collection Indexes ({len(indexes)}):")
            for idx in indexes:
                logger.info(f"  - {idx['name']}: {idx.get('key', 'N/A')}")
        
        logger.info("\n✅ All indexes created successfully!")
        logger.info("="*60)
        
    except Exception as e:
        logger.error(f"❌ Error creating indexes: {str(e)}", exc_info=True)
        raise
    finally:
        client.close()
        logger.info("\nDatabase connection closed")

if __name__ == "__main__":
    print("Database Indexing Script")
    print("=" * 60)
    print(f"MongoDB URL: {MONGODB_URL}")
    print(f"Database: {DATABASE_NAME}")
    print("=" * 60)
    print("\nStarting index creation...\n")
    
    asyncio.run(create_indexes())
