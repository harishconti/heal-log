import pymongo
import os

# --- Configuration ---
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = "medical_contacts"
COLLECTION_NAME = "users"
INDEX_NAME_TO_DROP = "email_1" # The conflicting index name from the logs

# --- Main Script ---
if __name__ == "__main__":
    try:
        print(f"Connecting to MongoDB at {MONGO_URL}...")
        client = pymongo.MongoClient(MONGO_URL)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]

        print(f"Checking for index '{INDEX_NAME_TO_DROP}' in collection '{COLLECTION_NAME}'...")

        index_info = collection.index_information()

        if INDEX_NAME_TO_DROP in index_info:
            print(f"Found index '{INDEX_NAME_TO_DROP}'. Dropping it...")
            collection.drop_index(INDEX_NAME_TO_DROP)
            print("Index dropped successfully.")
        else:
            print(f"Index '{INDEX_NAME_TO_DROP}' not found. No action needed.")

    except pymongo.errors.ConnectionFailure as e:
        print(f"Error: Could not connect to MongoDB. Is it running? Details: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        if 'client' in locals() and client:
            client.close()
            print("Connection closed.")