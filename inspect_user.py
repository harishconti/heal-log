import pymongo
import json
from bson import json_util
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

# --- Configuration ---
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')
COLLECTION_NAME = "users"
USER_EMAIL = "dr.sarah@clinic.com"

print(f"SCRIPT_NAME: inspect_user.py")
print(f"MONGO_URL: {MONGO_URL}")
print(f"DB_NAME: {DB_NAME}")

# --- Main Script ---
if __name__ == "__main__":
    try:
        print(f"Connecting to MongoDB at {MONGO_URL}...")
        client = pymongo.MongoClient(MONGO_URL)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]

        for i in range(30):
            print(f"Finding user with email '{USER_EMAIL}' (attempt {i+1}/30)...")
            user = collection.find_one({"email": USER_EMAIL})

            if user:
                print("User found:")
                # Use json_util to handle ObjectId and other BSON types
                print(json.dumps(json.loads(json_util.dumps(user)), indent=4))
                break
            else:
                print(f"User with email '{USER_EMAIL}' not found.")
                time.sleep(1)

    except pymongo.errors.ConnectionFailure as e:
        print(f"Error: Could not connect to MongoDB. Is it running? Details: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        if 'client' in locals() and client:
            client.close()
            print("Connection closed.")