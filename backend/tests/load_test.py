from locust import HttpUser, task, between
import os

class APIUser(HttpUser):
    wait_time = between(1, 5)
    host = "http://localhost:8000"

    def on_start(self):
        """
        Simulate user login.
        """
        self.client.headers = {
            "Content-Type": "application/x-www-form-urlencoded",
        }
        response = self.client.post(
            "/api/auth/login",
            data={
                "username": "test@example.com",
                "password": "password",
            },
        )
        self.token = response.json()["access_token"]
        self.client.headers = {
            "Authorization": f"Bearer {self.token}",
        }

    @task
    def get_patients(self):
        """
        Simulate a user getting a list of patients.
        """
        self.client.get("/api/patients/")

    @task
    def create_patient(self):
        """
        Simulate a user creating a patient.
        """
        self.client.post(
            "/api/patients/",
            json={
                "name": "Load Test Patient",
            },
        )

    @task
    def sync_data(self):
        """
        Simulate a user syncing data with the server.
        """
        self.client.post("/api/sync/pull", json={"last_pulled_at": 0})
