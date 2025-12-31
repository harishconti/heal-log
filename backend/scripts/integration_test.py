import os
import requests
import pymongo
import time
import json
from faker import Faker
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration
API_URL = "http://localhost:8000/api"

# Initialize Faker
fake = Faker()

# Report Data
report_lines = ["# Integration Test Report", "", "## Summary", ""]

def log_report(line):
    report_lines.append(line)
    logger.info(line)


def get_db_connection():
    """Get database connection. Only called when running the test."""
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME", "clinic_os_lite")

    if not mongo_url:
        raise ValueError("MONGO_URL environment variable is not set")

    client = pymongo.MongoClient(mongo_url)
    db = client[db_name]
    return db["users"]

def run_test():
    # Get database connection (validates MONGO_URL is set)
    users_collection = get_db_connection()

    session = requests.Session()

    # --- Step 1: Create New User ---
    log_report("### Step 1: User Creation")
    email = fake.email()
    password = "Password123!"
    full_name = fake.name()

    user_data = {
        "email": email,
        "password": password,
        "full_name": full_name,
        "phone": fake.phone_number()[:15], # limit length
        "medical_specialty": "General Practice"
    }

    log_report(f"Registering user: {email}")
    resp = session.post(f"{API_URL}/auth/register", json=user_data)
    if resp.status_code != 201:
        log_report(f"Registration failed: {resp.text}")
        return
    log_report("Registration successful. Response: " + json.dumps(resp.json(), indent=2))

    # --- Step 2: Verify OTP ---
    log_report("### Step 2: OTP Verification")
    # Fetch OTP from DB
    time.sleep(1) # Wait for DB update
    user_doc = users_collection.find_one({"email": email})
    if not user_doc:
        log_report("User not found in database!")
        return

    otp_code = user_doc.get("otp_code")
    log_report(f"Fetched OTP from DB: {otp_code}")

    verify_data = {
        "email": email,
        "otp_code": otp_code
    }

    resp = session.post(f"{API_URL}/auth/verify-otp", json=verify_data)
    if resp.status_code != 200:
        log_report(f"OTP Verification failed: {resp.text}")
        return
    log_report("OTP Verified. Tokens received.")

    # Store tokens
    data = resp.json()
    access_token = data["access_token"]
    refresh_token = data["refresh_token"]
    user_id = data["user"]["id"]

    headers = {"Authorization": f"Bearer {access_token}"}
    session.headers.update(headers)

    # --- Step 3: Login (Simulated by using the token) ---
    log_report("### Step 3: Login / Me")
    resp = session.get(f"{API_URL}/auth/me")
    if resp.status_code != 200:
        log_report(f"Me endpoint failed: {resp.text}")
        return
    log_report("Logged in as: " + json.dumps(resp.json(), indent=2))

    # --- Step 4: Create 2 Patients ---
    log_report("### Step 4: Create 2 Patients")
    patients = []
    for i in range(2):
        patient_data = {
            "name": fake.name(),
            "phone": fake.phone_number()[:15],
            "email": fake.email(),
            "address": fake.address(),
            "location": fake.city(),
            "initial_complaint": fake.sentence(),
            "group": "General"
        }
        resp = session.post(f"{API_URL}/patients/", json=patient_data)
        if resp.status_code != 201:
            log_report(f"Patient creation failed: {resp.text}")
            return
        patient = resp.json()
        patients.append(patient)
        log_report(f"Created patient: {patient['name']} (ID: {patient['id']}, PID: {patient['patient_id']})")

    # --- Step 5: Create Notes for Each Patient ---
    log_report("### Step 5: Create Notes")
    for patient in patients:
        note_data = {
            "content": fake.text(),
            "visit_type": "regular"
        }
        resp = session.post(f"{API_URL}/patients/{patient['id']}/notes", json=note_data)
        if resp.status_code != 201:
            log_report(f"Note creation failed: {resp.text}")
            return
        note = resp.json()
        log_report(f"Created note for {patient['name']}: {note['id']}")

    # --- Step 6: Sync Check 1 (Logout/Login simulated) ---
    log_report("### Step 6: Sync Check 1 (Full Sync)")
    # Simulate logout/login by clearing token? No, we need token to sync.
    # Just assume we are a fresh client.
    sync_req = {
        "last_pulled_at": None
    }
    resp = session.post(f"{API_URL}/sync/pull", json=sync_req)
    if resp.status_code != 200:
        log_report(f"Sync failed: {resp.text}")
        return

    sync_data = resp.json()
    log_report("Sync Response (Summary):")
    created_patients = sync_data["changes"]["patients"]["created"]
    created_notes = sync_data["changes"]["clinical_notes"]["created"]
    log_report(f"Fetched Patients: {len(created_patients)}")
    log_report(f"Fetched Notes: {len(created_notes)}")

    if len(created_patients) < 2:
        log_report("TEST FAILED: Expected at least 2 patients.")

    # Store timestamp for next sync
    last_pulled_at = sync_data["timestamp"]

    # --- Step 7: Create 2 More Patients + Notes ---
    log_report("### Step 7: Create 2 More Patients")
    new_patients = []
    for i in range(2):
        patient_data = {
            "name": fake.name(),
            "phone": fake.phone_number()[:15],
            "email": fake.email(),
            "address": fake.address(),
            "location": fake.city(),
            "initial_complaint": fake.sentence(),
            "group": "General"
        }
        resp = session.post(f"{API_URL}/patients/", json=patient_data)
        if resp.status_code != 201:
            log_report(f"Patient creation failed: {resp.text}")
            return
        patient = resp.json()
        new_patients.append(patient)
        log_report(f"Created patient: {patient['name']} (ID: {patient['id']}, PID: {patient['patient_id']})")

    for patient in new_patients:
        note_data = {
            "content": fake.text(),
            "visit_type": "follow-up"
        }
        resp = session.post(f"{API_URL}/patients/{patient['id']}/notes", json=note_data)
        if resp.status_code != 201:
            log_report(f"Note creation failed: {resp.text}")
            return
        note = resp.json()
        log_report(f"Created note for {patient['name']}: {note['id']}")

    # --- Step 8: Sync Check 2 (Incremental or Full) ---
    # The user asked: "logout and login to check if all data returned."
    # This implies a full sync again.
    log_report("### Step 8: Sync Check 2 (Full Sync Check)")
    sync_req = {
        "last_pulled_at": None
    }
    resp = session.post(f"{API_URL}/sync/pull", json=sync_req)
    if resp.status_code != 200:
        log_report(f"Sync failed: {resp.text}")
        return

    sync_data = resp.json()
    created_patients = sync_data["changes"]["patients"]["created"]
    created_notes = sync_data["changes"]["clinical_notes"]["created"]

    log_report(f"Total Fetched Patients: {len(created_patients)}")
    log_report(f"Total Fetched Notes: {len(created_notes)}")

    if len(created_patients) == 4 and len(created_notes) == 4:
        log_report("SUCCESS: All 4 patients and 4 notes returned.")
    else:
        log_report(f"WARNING: Expected 4 patients and 4 notes. Got {len(created_patients)} and {len(created_notes)}.")
        log_report("Patients IDs: " + ", ".join([p["id"] for p in created_patients]))

    # --- Step 9: Verify Standard REST Endpoints ---
    log_report("### Step 9: Verify Standard REST Endpoints")

    # List Patients
    resp = session.get(f"{API_URL}/patients/")
    if resp.status_code != 200:
        log_report(f"List Patients failed: {resp.text}")
    else:
        patients_list = resp.json()
        log_report(f"GET /patients returned {len(patients_list)} patients.")
        if len(patients_list) >= 4:
            log_report("SUCCESS: Standard API returns all patients.")
        else:
            log_report("WARNING: Standard API missing patients.")

    # Check details for one patient
    if created_patients:
        pid = created_patients[0]["id"]
        resp = session.get(f"{API_URL}/patients/{pid}")
        if resp.status_code == 200:
            log_report(f"GET /patients/{pid} returned: " + json.dumps(resp.json(), indent=2))
        else:
            log_report(f"GET /patients/{pid} failed: {resp.text}")

        # Check notes for one patient
        resp = session.get(f"{API_URL}/patients/{pid}/notes")
        if resp.status_code == 200:
            notes_list = resp.json()
            log_report(f"GET /patients/{pid}/notes returned {len(notes_list)} notes.")
        else:
            log_report(f"GET /patients/{pid}/notes failed: {resp.text}")

    # Write Report
    with open("integration_test_report.md", "w") as f:
        f.write("\n".join(report_lines))
    print("Report written to integration_test_report.md")

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        logger.exception("Test script failed")
