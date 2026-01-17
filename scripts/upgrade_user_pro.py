import pymongo
from pymongo import MongoClient
import os
import sys

# Provided Credentials
MONGO_URL = "mongodb+srv://ngharishdevelop_db_user:59et3NpooEsXuP9E@cluster0.48dsoqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
DB_NAME = "clinic_os_lite"
TARGET_EMAIL = "ngharishjobs@gmail.com"

def upgrade_user():
    try:
        print(f"Connecting to MongoDB...")
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        users_collection = db["users"]

        print(f"Searching for user: {TARGET_EMAIL}")
        user = users_collection.find_one({"email": TARGET_EMAIL})

        if not user:
            print(f"Error: User with email {TARGET_EMAIL} not found.")
            return

        print(f"User found: {user.get('full_name', 'Unknown')}")
        print(f"Current Plan: {user.get('plan')}")
        print(f"Current Status: {user.get('subscription_status')}")

        # Update fields
        # plan: "pro" (UserPlan.PRO)
        # subscription_status: "active" (SubscriptionStatus.ACTIVE)
        
        result = users_collection.update_one(
            {"email": TARGET_EMAIL},
            {"$set": {
                "plan": "pro",
                "subscription_status": "active"
            }}
        )

        if result.modified_count > 0:
            print("Successfully upgraded user to PRO plan and ACTIVE status.")
        else:
            print("User was already on the target plan/status (no changes made).")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    upgrade_user()
