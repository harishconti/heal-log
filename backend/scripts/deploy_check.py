import os
import sys
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import redis
import requests
from dotenv import load_dotenv
import sentry_sdk
from sentry_sdk.utils import Dsn

# Add backend to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def check_env_vars():
    """Checks for required environment variables."""
    print("--- Checking Environment Variables ---")
    required_vars = [
        "MONGO_URL",
        "DB_NAME",
        "SECRET_KEY",
        "ALGORITHM",
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "REDIS_URL",
        "SENTRY_DSN",
    ]
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)

    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        return False
    else:
        print("✅ All required environment variables are set.")
        return True

def check_mongo_connection():
    """Checks the connection to MongoDB."""
    print("\n--- Checking MongoDB Connection ---")
    mongo_url = os.getenv("MONGO_URL")
    if not mongo_url:
        print("❌ MONGO_URL not set.")
        return False
    try:
        client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        print("✅ MongoDB connection successful.")
        return True
    except ConnectionFailure as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False

def check_redis_connection():
    """Checks the connection to Redis."""
    print("\n--- Checking Redis Connection ---")
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        print("❌ REDIS_URL not set.")
        return False
    try:
        r = redis.from_url(redis_url)
        r.ping()
        print("✅ Redis connection successful.")
        return True
    except redis.exceptions.ConnectionError as e:
        print(f"❌ Redis connection failed: {e}")
        return False

def check_auth_endpoints():
    """Checks the authentication endpoints."""
    print("\n--- Checking Authentication Endpoints ---")
    base_url = "http://localhost:8000"  # Assuming the app is running locally for this check
    try:
        # Check a public endpoint to see if the server is running
        response = requests.get(f"{base_url}/api")
        if response.status_code == 200:
            print("✅ API root endpoint is accessible.")
        else:
            print(f"❌ API root endpoint returned status code {response.status_code}.")
            return False

        # This is a basic check. A more comprehensive check would involve
        # creating a temporary user and logging in. For now, we just check
        # that the endpoint exists and returns a 422 for missing data.
        response = requests.post(f"{base_url}/api/auth/login", data={})
        if response.status_code == 422:
            print("✅ /api/auth/login endpoint is responding correctly (checked for missing data).")
            return True
        else:
            print(f"❌ /api/auth/login endpoint returned status code {response.status_code}.")
            return False
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Could not connect to the application at {base_url}. Is it running?")
        print(f"   Error: {e}")
        return False

def check_sentry_dsn():
    """Checks if the Sentry DSN is valid."""
    print("\n--- Checking Sentry DSN ---")
    sentry_dsn = os.getenv("SENTRY_DSN")
    if not sentry_dsn:
        print("⚠️ SENTRY_DSN not set. Monitoring will be disabled.")
        return True # Not a critical failure

    try:
        Dsn(sentry_dsn)
        print("✅ Sentry DSN is valid.")
        return True
    except Exception as e:
        print(f"❌ Invalid Sentry DSN: {e}")
        return False

def main():
    """Runs all deployment checks."""
    print("🚀 Starting Deployment Readiness Check...")
    # Load .env file from the project root if it exists
    dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
    if os.path.exists(dotenv_path):
        print(f"📄 Loading environment variables from: {dotenv_path}")
        load_dotenv(dotenv_path=dotenv_path)
    else:
        print("⚠️ No .env file found in project root. Relying on system environment variables.")


    results = {
        "env_vars": check_env_vars(),
        "mongo": check_mongo_connection(),
        "redis": check_redis_connection(),
        "sentry": check_sentry_dsn(),
        "auth": check_auth_endpoints(),
    }

    print("\n--- Deployment Readiness Report ---")
    all_ok = True
    for check, result in results.items():
        status = "✅" if result else "❌"
        print(f"{status} {check.replace('_', ' ').title()}")
        if not result:
            all_ok = False

    print("\n------------------------------------")
    if all_ok:
        print("✅✅✅ All checks passed! Deployment is ready. ✅✅✅")
        sys.exit(0)
    else:
        print("❌❌❌ Some checks failed. Please review the output above. ❌❌❌")
        sys.exit(1)


if __name__ == "__main__":
    main()
