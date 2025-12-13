#!/usr/bin/env python3
"""
Comprehensive API Endpoint Validation Script
Tests all API endpoints to ensure frontend-backend connectivity works correctly.
"""

import requests
import json
from typing import Dict, Any, Optional
from datetime import datetime

# Configuration
BACKEND_URL = "https://doctor-log-production.up.railway.app"
TEST_USER = {
    "email": "test_api@example.com",
    "password": "TestPassword123!",
    "full_name": "API Test User",
    "phone": "+1234567890",
    "medical_specialty": "General Practice"
}

class APITester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.user_id: Optional[str] = None
        self.test_results = []
        
    def log_result(self, endpoint: str, method: str, success: bool, status_code: int, message: str = ""):
        """Log test result"""
        result = {
            "timestamp": datetime.now().isoformat(),
            "endpoint": endpoint,
            "method": method,
            "success": success,
            "status_code": status_code,
            "message": message
        }
        self.test_results.append(result)
        status = "✅" if success else "❌"
        print(f"{status} [{method}] {endpoint} - Status: {status_code} - {message}")
        
    def test_health_check(self) -> bool:
        """Test health check endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            success = response.status_code == 200
            self.log_result("/health", "GET", success, response.status_code, 
                          "Health check passed" if success else "Health check failed")
            return success
        except Exception as e:
            self.log_result("/health", "GET", False, 0, f"Error: {str(e)}")
            return False
            
    def test_register(self) -> bool:
        """Test user registration"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/register",
                json=TEST_USER
            )
            
            if response.status_code == 201:
                data = response.json()
                self.access_token = data.get("access_token")
                self.refresh_token = data.get("refresh_token")
                self.user_id = data.get("user", {}).get("id")
                self.log_result("/api/auth/register", "POST", True, 201, "Registration successful")
                return True
            elif response.status_code == 400 and "already exists" in response.text.lower():
                self.log_result("/api/auth/register", "POST", True, 400, "User already exists (expected)")
                return self.test_login()  # Try login instead
            else:
                self.log_result("/api/auth/register", "POST", False, response.status_code, response.text)
                return False
        except Exception as e:
            self.log_result("/api/auth/register", "POST", False, 0, f"Error: {str(e)}")
            return False
            
    def test_login(self) -> bool:
        """Test user login"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                data={
                    "username": TEST_USER["email"],
                    "password": TEST_USER["password"]
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.refresh_token = data.get("refresh_token")
                self.user_id = data.get("user", {}).get("id")
                self.log_result("/api/auth/login", "POST", True, 200, "Login successful")
                return True
            else:
                self.log_result("/api/auth/login", "POST", False, response.status_code, response.text)
                return False
        except Exception as e:
            self.log_result("/api/auth/login", "POST", False, 0, f"Error: {str(e)}")
            return False
            
    def test_get_current_user(self) -> bool:
        """Test getting current user info"""
        if not self.access_token:
            self.log_result("/api/auth/me", "GET", False, 0, "No access token available")
            return False
            
        try:
            response = self.session.get(
                f"{self.base_url}/api/auth/me",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            success = response.status_code == 200
            self.log_result("/api/auth/me", "GET", success, response.status_code,
                          "Retrieved user info" if success else response.text)
            return success
        except Exception as e:
            self.log_result("/api/auth/me", "GET", False, 0, f"Error: {str(e)}")
            return False
            
    def test_sync_pull(self) -> bool:
        """Test sync pull endpoint"""
        if not self.access_token:
            self.log_result("/api/sync/pull", "POST", False, 0, "No access token available")
            return False
            
        try:
            response = self.session.post(
                f"{self.base_url}/api/sync/pull",
                json={"last_pulled_at": None, "changes": {}},
                headers={"Authorization": f"Bearer {self.access_token}"} 
            )
            
            success = response.status_code == 200
            self.log_result("/api/sync/pull", "POST", success, response.status_code,
                          "Sync pull successful" if success else response.text)
            return success
        except Exception as e:
            self.log_result("/api/sync/pull", "POST", False, 0, f"Error: {str(e)}")
            return False
            
    def test_get_patients(self) -> bool:
        """Test getting all patients"""
        if not self.access_token:
            self.log_result("/api/patients/", "GET", False, 0, "No access token available")
            return False
            
        try:
            response = self.session.get(
                f"{self.base_url}/api/patients/",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            success = response.status_code == 200
            count = len(response.json()) if success else 0
            self.log_result("/api/patients/", "GET", success, response.status_code,
                          f"Retrieved {count} patients" if success else response.text)
            return success
        except Exception as e:
            self.log_result("/api/patients/", "GET", False, 0, f"Error: {str(e)}")
            return False
            
    def test_update_profile(self) -> bool:
        """Test updating user profile"""
        if not self.access_token:
            self.log_result("/api/users/me", "PUT", False, 0, "No access token available")
            return False
            
        try:
            update_data = {"medical_specialty": "Cardiology"}
            response = self.session.put(
                f"{self.base_url}/api/users/me",
                json=update_data,
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            success = response.status_code == 200
            self.log_result("/api/users/me", "PUT", success, response.status_code,
                          "Profile updated" if success else response.text)
            return success
        except Exception as e:
            self.log_result("/api/users/me", "PUT", False, 0, f"Error: {str(e)}")
            return False
            
    def test_get_known_issues(self) -> bool:
        """Test getting known issues (beta endpoint)"""
        if not self.access_token:
            self.log_result("/api/beta/known-issues", "GET", False, 0, "No access token available")
            return False
            
        try:
            response = self.session.get(
                f"{self.base_url}/api/beta/known-issues",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            success = response.status_code == 200
            count = len(response.json()) if success else 0
            self.log_result("/api/beta/known-issues", "GET", success, response.status_code,
                          f"Retrieved {count} known issues" if success else response.text)
            return success
        except Exception as e:
            self.log_result("/api/beta/known-issues", "GET", False, 0, f"Error: {str(e)}")
            return False
            
    def run_all_tests(self):
        """Run all API tests"""
        print("\n" + "="*80)
        print("Starting Comprehensive API Validation Tests")
        print(f"Backend URL: {self.base_url}")
        print("="*80 + "\n")
        
        # Test 1: Health Check
        print("\n[1] Testing Health Check...")
        self.test_health_check()
        
        # Test 2: Authentication
        print("\n[2] Testing Authentication...")
        if not self.test_register():
            print("❌ Registration/Login failed - cannot proceed with authenticated tests")
            self.print_summary()
            return
            
        # Test 3: Get Current User
        print("\n[3] Testing Get Current User...")
        self.test_get_current_user()
        
        # Test 4: Sync Pull
        print("\n[4] Testing Sync Pull...")
        self.test_sync_pull()
        
        # Test 5: Get Patients
        print("\n[5] Testing Get Patients...")
        self.test_get_patients()
        
        # Test 6: Update Profile
        print("\n[6] Testing Update Profile...")
        self.test_update_profile()
        
        # Test 7: Get Known Issues
        print("\n[7] Testing Get Known Issues...")
        self.test_get_known_issues()
        
        # Print summary
        self.print_summary()
        
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*80)
        print("Test Summary")
        print("="*80)
        
        total = len(self.test_results)
        passed = sum(1 for r in self.test_results if r["success"])
        failed = total - passed
        
        print(f"\nTotal Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        if failed > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - [{result['method']}] {result['endpoint']}: {result['message']}")
        
        # Save results to file
        with open("api_test_results.json", "w") as f:
            json.dump(self.test_results, f, indent=2)
        print(f"\n📄 Detailed results saved to: api_test_results.json")
        print("="*80 + "\n")


if __name__ == "__main__":
    tester = APITester(BACKEND_URL)
    tester.run_all_tests()
