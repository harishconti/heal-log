import requests
import json
import os
import time
import subprocess
from datetime import datetime
from pymongo import MongoClient

# --- Configuration ---
BASE_URL = "http://127.0.0.1:8000"  # Local test server
API_DOCS_URL = "https://doctor-log-production.up.railway.app" # Production URL for report formatting

# --- Test User ---
TEST_USER = {
    "email": "testuser@example.com",
    "password": "testpassword",
    "full_name": "Test User"
}

# --- Test Data ---
PATIENT_DATA = {
    "name": "John Doe",
    "date_of_birth": "1990-01-01",
    "gender": "Male",
    "phone": "1234567890",
    "email": "johndoe@example.com",
    "address": "123 Main St",
    "group": "A",
    "is_favorite": False
}

UPDATED_PATIENT_DATA = {
    "phone": "0987654321",
    "email": "johndoe.updated@example.com",
    "is_favorite": True
}

def print_header(title):
    print("\n" + "="*50)
    print(f" {title}")
    print("="*50)

def format_request_for_report(method, url, headers, data):
    report = f"**Request:**\n"
    report += f"```http\n"
    report += f"{method} {url}\n"
    for key, value in headers.items():
        report += f"{key}: {value}\n"
    if data:
        report += f"\n{json.dumps(data, indent=2)}\n"
    report += f"```\n"
    return report

def format_response_for_report(response):
    report = f"**Response:**\n"
    report += f"```json\n"
    report += f"Status Code: {response.status_code}\n\n"
    try:
        report += f"{json.dumps(response.json(), indent=2)}\n"
    except json.JSONDecodeError:
        report += f"{response.text}\n"
    report += f"```\n"
    return report


class APITestRunner:
    def __init__(self):
        self.token = None
        self.patient_id = None
        self.report = []

    def run_tests(self):
        self.test_register()
        self.test_login()
        self.test_create_patient()
        self.test_get_all_patients()
        self.test_get_patient_by_id()
        self.test_update_patient()
        self.test_delete_patient()
        self.generate_report()

    def test_register(self):
        print_header("Testing User Registration")
        url = f"{BASE_URL}/api/auth/register"
        response = requests.post(url, json=TEST_USER)
        # It's okay if the user already exists, we just need a user to test with.
        assert response.status_code in [201, 400]

    def test_login(self):
        print_header("Testing User Login")
        url = f"{BASE_URL}/api/auth/login"
        data = {"username": TEST_USER["email"], "password": TEST_USER["password"]}
        response = requests.post(url, data=data)
        assert response.status_code == 200
        self.token = response.json()["access_token"]
        print("Login successful.")

    def _make_authenticated_request(self, method, endpoint, **kwargs):
        headers = {"Authorization": f"Bearer {self.token}"}
        url = f"{BASE_URL}{endpoint}"
        response = requests.request(method, url, headers=headers, **kwargs)

        # For the report, use the production URL
        report_url = f"{API_DOCS_URL}{endpoint}"

        report_entry = {}
        report_entry["title"] = f"### {method.upper()} {endpoint}"
        report_entry["request"] = format_request_for_report(method, report_url, headers, kwargs.get('json'))
        report_entry["response"] = format_response_for_report(response)
        self.report.append(report_entry)

        return response

    def test_create_patient(self):
        print_header("Testing Create Patient")
        response = self._make_authenticated_request("POST", "/api/patients/", json=PATIENT_DATA)
        assert response.status_code == 201
        self.patient_id = response.json()["id"]
        print(f"Patient created with ID: {self.patient_id}")

    def test_get_all_patients(self):
        print_header("Testing Get All Patients")
        response = self._make_authenticated_request("GET", "/api/patients/")
        assert response.status_code == 200
        assert len(response.json()) > 0
        print("Successfully retrieved all patients.")

    def test_get_patient_by_id(self):
        print_header("Testing Get Patient by ID")
        response = self._make_authenticated_request("GET", f"/api/patients/{self.patient_id}")
        assert response.status_code == 200
        assert response.json()["id"] == self.patient_id
        print("Successfully retrieved patient by ID.")

    def test_update_patient(self):
        print_header("Testing Update Patient")
        response = self._make_authenticated_request("PUT", f"/api/patients/{self.patient_id}", json=UPDATED_PATIENT_DATA)
        assert response.status_code == 200
        assert response.json()["email"] == UPDATED_PATIENT_DATA["email"]
        print("Patient updated successfully.")

    def test_delete_patient(self):
        print_header("Testing Delete Patient")
        response = self._make_authenticated_request("DELETE", f"/api/patients/{self.patient_id}")
        assert response.status_code == 200

        # Verify deletion
        response = self._make_authenticated_request("GET", f"/api/patients/{self.patient_id}")
        assert response.status_code == 404
        print("Patient deleted successfully.")

    def generate_report(self):
        print_header("Generating API Testing Report")
        report_content = f"# API Testing Report\n\n"
        report_content += f"**Date:** {datetime.utcnow().isoformat()}Z\n"
        report_content += f"**Base URL (for testing):** `{BASE_URL}`\n"
        report_content += f"**Note:** URLs in the report use the production format for clarity, but tests were run locally against a test database.\n\n"

        for entry in self.report:
            report_content += entry["title"] + "\n"
            report_content += entry["request"] + "\n"
            report_content += entry["response"] + "\n"
            report_content += "---\n\n"

        with open("api_testing_report.md", "w") as f:
            f.write(report_content)
        print("Report generated: api_testing_report.md")

def kill_process_on_port(port):
    try:
        # Find the process ID (PID) using the port
        result = subprocess.run(
            ["lsof", "-t", f"-i:{port}"],
            capture_output=True,
            text=True
        )
        pids = result.stdout.strip().split("\n")
        for pid in pids:
            if pid:
                print(f"Found process {pid} on port {port}. Terminating.")
                subprocess.run(["kill", "-9", pid])
    except FileNotFoundError:
        print("'lsof' command not found. Skipping process cleanup.")


def clear_test_database():
    """Connects to the test MongoDB and drops collections."""
    print_header("Clearing Test Database")
    try:
        client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=5000)
        db = client["test_db"]
        # Drop all collections to ensure a clean state
        for collection_name in db.list_collection_names():
            db.drop_collection(collection_name)
        print("Database 'test_db' collections cleared.")
    except Exception as e:
        print(f"Could not clear test database: {e}")
        # It's okay if this fails (e.g., DB not running yet),
        # as the first run should be clean anyway.


def wait_for_server(url, timeout=30):
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            # Use a health check endpoint for a more reliable check
            response = requests.get(url, timeout=2)
            if response.status_code == 200:
                print("Server is up!")
                return True
        except requests.ConnectionError:
            time.sleep(1)
        except requests.Timeout:
            print("Request timed out, retrying...")

    print("Server did not start in time.")
    return False

if __name__ == "__main__":
    # --- Pre-test Cleanup ---
    kill_process_on_port(8000)
    clear_test_database()

    # --- Server Management ---
    server_env = os.environ.copy()

    # Critical: Unset MONGO_URL to prevent connecting to production DB.
    # This forces the app to use the default 'mongodb://localhost:27017'
    if 'MONGO_URL' in server_env:
        del server_env['MONGO_URL']

    # Explicitly set a test database name
    server_env['DB_NAME'] = 'test_db'
    server_env['PYTHONPATH'] = 'backend'

    log_file = open("backend.log", "w")
    server_process = subprocess.Popen(
        ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd="backend",
        env=server_env,
        stdout=log_file,
        stderr=subprocess.STDOUT
    )

    # --- Test Execution ---
    try:
        if wait_for_server(f"{BASE_URL}/health"):
            runner = APITestRunner()
            runner.run_tests()
    finally:
        # --- Shutdown ---
        print("Shutting down server...")
        server_process.terminate()
        server_process.wait()
        log_file.close()
        print("Server shut down.")
