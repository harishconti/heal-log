#!/usr/bin/env python3
"""
Script to create a test user in the MongoDB database.
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymongo import MongoClient
from datetime import datetime, timedelta, timezone
import uuid
from app.core.hashing import get_password_hash

# Configuration
MONGO_URL = "mongodb+srv://ngharishdevelop_db_user:59et3NpooEsXuP9E@cluster0.48dsoqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
DB_NAME = "clinic_os_lite"

# Test user credentials
TEST_EMAIL = "testuser@heallog.com"
TEST_PASSWORD = "TestUser123!"
TEST_FULL_NAME = "Test User"
TEST_SPECIALTY = "general"

def create_test_user():
    """Create a test user in the database."""
    print(f"Connecting to MongoDB...")
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    users_collection = db["users"]
    
    # Check if user already exists
    existing_user = users_collection.find_one({"email": TEST_EMAIL})
    if existing_user:
        print(f"User with email {TEST_EMAIL} already exists!")
        print(f"User ID: {existing_user.get('id', existing_user.get('_id'))}")
        client.close()
        return
    
    # Create password hash
    password_hash = get_password_hash(TEST_PASSWORD)
    
    # Create user document
    now = datetime.now(timezone.utc)
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": TEST_EMAIL,
        "phone": "+1234567890",
        "full_name": TEST_FULL_NAME,
        "medical_specialty": TEST_SPECIALTY,
        "password_hash": password_hash,
        "plan": "basic",
        "role": "doctor",
        "subscription_status": "active",
        "subscription_end_date": now + timedelta(days=365),
        "created_at": now,
        "updated_at": now,
        "email_verified": True  # Set to verified so they can login immediately
    }
    
    # Insert user
    result = users_collection.insert_one(user_doc)
    print(f"✅ Test user created successfully!")
    print(f"\n{'='*50}")
    print(f"TEST USER CREDENTIALS")
    print(f"{'='*50}")
    print(f"Email:    {TEST_EMAIL}")
    print(f"Password: {TEST_PASSWORD}")
    print(f"Name:     {TEST_FULL_NAME}")
    print(f"User ID:  {user_doc['id']}")
    print(f"{'='*50}")
    
    client.close()

if __name__ == "__main__":
    create_test_user()
