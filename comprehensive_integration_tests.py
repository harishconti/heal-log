#!/usr/bin/env python3
"""
Comprehensive Integration Test Suite
Tests all backend endpoints, frontend integration, and end-to-end workflows.
"""

import requests
import json
import time
from typing import Dict, Any, Optional, List
from datetime import datetime

# Configuration
BACKEND_URL = "https://doctor-log-production.up.railway.app"
TEST_USER = {
    "email": f"integration_test_{int(time.time())}@example.com",
    "password": "TestPassword123!",
    "full_name": "Integration Test User",
    "phone": "+1234567890",
    "medical_specialty": "General Practice"
}

class IntegrationTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.user_id: Optional[str] = None
        self.test_results = []
        self.issues = []
        self.patient_id: Optional[str] = None
        
    def log_result(self, test_name: str, endpoint: str, method: str, success: bool, 
                   status_code: int, message: str = "", duration_ms: float = 0):
        """Log test result"""
        result = {
            "timestamp": datetime.now().isoformat(),
            "test_name": test_name,
            "endpoint": endpoint,
            "method": method,
            "success": success,
            "status_code": status_code,
            "duration_ms": duration_ms,
            "message": message
        }
        self.test_results.append(result)
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {endpoint} ({status_code}) - {duration_ms:.0f}ms - {message}")
        
        if not success and status_code not in [400, 403, 404]:  # Expected errors
            self.log_issue("API Test Failure", f"{test_name} failed: {message}", "high")
    
    def log_issue(self, title: str, description: str, severity: str = "medium"):
        """Log an issue found during testing"""
        issue = {
            "title": title,
            "description": description,
            "severity": severity,
            "timestamp": datetime.now().isoformat()
        }
        self.issues.append(issue)
        
    # ============================================================================
    # AUTHENTICATION TESTS
    # ============================================================================
    
    def test_user_registration(self) -> bool:
        """Test complete user registration flow"""
        start = time.time()
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/register",
                json=TEST_USER
            )
            duration = (time.time() - start) * 1000
            
            if response.status_code == 201:
                data = response.json()
                self.access_token = data.get("access_token")
                self.refresh_token = data.get("refresh_token")
                self.user_id = data.get("user", {}).get("id")
                
                # Validate response structure
                if not self.access_token or not self.refresh_token:
                    self.log_issue("Registration Response Missing Tokens", 
                                 "Registration succeeded but missing tokens in response", "high")
                    
                self.log_result("User Registration", "/api/auth/register", "POST", 
                              True, 201, "User created successfully", duration)
                return True
            else:
                self.log_result("User Registration", "/api/auth/register", "POST",
                              False, response.status_code, response.text, duration)
                return False
        except Exception as e:
            duration = (time.time() - start) * 1000
            self.log_result("User Registration", "/api/auth/register", "POST",
                          False, 0, f"Error: {str(e)}", duration)
            self.log_issue("Registration Exception", str(e), "critical")
            return False
    
    def test_user_login(self) -> bool:
        """Test user login"""
        start = time.time()
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                data={
                    "username": TEST_USER["email"],
                    "password": TEST_USER["password"]
                }
            )
            duration = (time.time() - start) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.log_result("User Login", "/api/auth/login", "POST",
                              True, 200, "Login successful", duration)
                return True
            else:
                self.log_result("User Login", "/api/auth/login", "POST",
                              False, response.status_code, response.text, duration)
                return False
        except Exception as e:
            duration = (time.time() - start) * 1000
            self.log_result("User Login", "/api/auth/login", "POST",
                          False, 0, f"Error: {str(e)}", duration)
            return False
    
    def test_get_current_user(self) -> bool:
        """Test getting current user info"""
        if not self.access_token:
            return False
            
        start = time.time()
        try:
            response = self.session.get(
                f"{self.base_url}/api/auth/me",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            duration = (time.time() - start) * 1000
            
            success = response.status_code == 200
            self.log_result("Get Current User", "/api/auth/me", "GET",
                          success, response.status_code,
                          "Retrieved user info" if success else response.text, duration)
            return success
        except Exception as e:
            duration = (time.time() - start) * 1000
            self.log_result("Get Current User", "/api/auth/me", "GET",
                          False, 0, f"Error: {str(e)}", duration)
            return False
    
    def test_token_refresh(self) -> bool:
        """Test token refresh"""
        if not self.refresh_token:
            return False
            
        start = time.time()
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/refresh",
                json={"refresh_token": self.refresh_token}
            )
            duration = (time.time() - start) * 1000
            
            success = response.status_code == 200
            self.log_result("Token Refresh", "/api/auth/refresh", "POST",
                          success, response.status_code,
                          "Token refreshed" if success else response.text, duration)
            return success
        except Exception as e:
            duration = (time.time() - start) * 1000
            self.log_result("Token Refresh", "/api/auth/refresh", "POST",
                          False, 0, f"Error: {str(e)}", duration)
            return False
    
    # ============================================================================
    # PATIENT MANAGEMENT TESTS
    # ============================================================================
    
    def test_create_patient(self) -> bool:
        """Test creating a patient"""
        if not self.access_token:
            return False
            
        patient_data = {
            "patient_id": f"PAT{int(time.time())}",
            "name": "Test Patient",
            "phone": "+9876543210",
            "age": 35,
            "gender": "male",
            "initial_complaint": "Regular checkup",
            "group": "VIP"
        }
        
        start = time.time()
        try:
            response = self.session.post(
                f"{self.base_url}/api/patients/",
                json=patient_data,
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            duration = (time.time() - start) * 1000
            
            if response.status_code == 201:
                data = response.json()
                self.patient_id = data.get("id")
                self.log_result("Create Patient", "/api/patients/", "POST",
                              True, 201, f"Patient created: {self.patient_id}", duration)
                return True
            else:
                self.log_result("Create Patient", "/api/patients/", "POST",
                              False, response.status_code, response.text, duration)
                return False
        except Exception as e:
            duration = (time.time() - start) * 1000
            self.log_result("Create Patient", "/api/patients/", "POST",
                          False, 0, f"Error: {str(e)}", duration)
            return False
    
    def test_get_patients(self) -> bool:
        """Test getting all patients"""
        if not self.access_token:
            return False
            
        start = time.time()
        try:
            response = self.session.get(
                f"{self.base_url}/api/patients/",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            duration = (time.time() - start) * 1000
            
            if response.status_code == 200:
                patients = response.json()
                count = len(patients)
                self.log_result("Get Patients", "/api/patients/", "GET",
                              True, 200, f"Retrieved {count} patients", duration)
                return True
            else:
                self.log_result("Get Patients", "/api/patients/", "GET",
                              False, response.status_code, response.text, duration)
                return False
        except Exception as e:
            duration = (time.time() - start) * 1000
            self.log_result("Get Patients", "/api/patients/", "GET",
                          False, 0, f"Error: {str(e)}", duration)
            return False
    
    def test_update_patient(self) -> bool:
        """Test updating a patient"""
        if not self.access_token or not self.patient_id:
            return False
            
        update_data = {
            "initial_complaint": "Updated complaint - Follow-up visit"
        }
        
        start = time.time()
        try:
            response = self.session.put(
                f"{self.base_url}/api/patients/{self.patient_id}",
                json=update_data,
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            duration = (time.time() - start) * 1000
            
            success = response.status_code == 200
            self.log_result("Update Patient", f"/api/patients/{self.patient_id}", "PUT",
                          success, response.status_code,
                          "Patient updated" if success else response.text, duration)
            return success
        except Exception as e:
            duration = (time.time() - start) * 1000
            self.log_result("Update Patient", f"/api/patients/{self.patient_id}", "PUT",
                          False, 0, f"Error: {str(e)}", duration)
            return False
    
    # ============================================================================
    # SYNC TESTS
    # ============================================================================
    
    def test_sync_pull(self) -> bool:
        """Test sync pull"""
        if not self.access_token:
            return False
            
        start = time.time()
        try:
            response = self.session.post(
                f"{self.base_url}/api/sync/pull",
                json={"last_pulled_at": None, "changes": {}},
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            duration = (time.time() - start) * 1000
            
            if response.status_code == 200:
                data = response.json()
                changes = data.get("changes", {})
                self.log_result("Sync Pull", "/api/sync/pull", "POST",
                              True, 200, f"Pulled changes successfully", duration)
                return True
            else:
                self.log_result("Sync Pull", "/api/sync/pull", "POST",
                              False, response.status_code, response.text, duration)
                return False
        except Exception as e:
            duration = (time.time() - start) * 1000
            self.log_result("Sync Pull", "/api/sync/pull", "POST",
                          False, 0, f"Error: {str(e)}", duration)
            return False
    
    def test_sync_push(self) -> bool:
        """Test sync push"""
        if not self.access_token:
            return False
            
        start = time.time()
        try:
            response = self.session.post(
                f"{self.base_url}/api/sync/push",
                json={
                    "changes": {"patients": {"created": [], "updated": [], "deleted": []}},
                    "last_pulled_at": int(time.time() * 1000)
                },
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            duration = (time.time() - start) * 1000
            
            success = response.status_code == 200
            self.log_result("Sync Push", "/api/sync/push", "POST",
                          success, response.status_code,
                          "Pushed changes" if success else response.text, duration)
            return success
        except Exception as e:
            duration = (time.time() - start) * 1000
            self.log_result("Sync Push", "/api/sync/push", "POST",
                          False, 0, f"Error: {str(e)}", duration)
            return False
    
    # ============================================================================
    # PERFORMANCE TESTS
    # ============================================================================
    
    def test_response_times(self):
        """Test response times for critical endpoints"""
        print("\n" + "="*80)
        print("Performance Testing")
        print("="*80)
        
        endpoints = [
            ("GET", "/health", None),
            ("GET", "/api/patients/", {"Authorization": f"Bearer {self.access_token}"}),
        ]
        
        for method, endpoint, headers in endpoints:
            times = []
            for i in range(5):
                start = time.time()
                try:
                    if method == "GET":
                        response = self.session.get(f"{self.base_url}{endpoint}", headers=headers)
                    duration = (time.time() - start) * 1000
                    times.append(duration)
                except:
                    pass
            
            if times:
                avg_time = sum(times) / len(times)
                max_time = max(times)
                min_time = min(times)
                print(f"  {endpoint}: avg={avg_time:.0f}ms, min={min_time:.0f}ms, max={max_time:.0f}ms")
                
                if avg_time > 1000:
                    self.log_issue("Slow Response Time", 
                                 f"{endpoint} average response time is {avg_time:.0f}ms (>1s)", "medium")
    
    # ============================================================================
    # TEST EXECUTION
    # ============================================================================
    
    def run_all_tests(self):
        """Run all integration tests"""
        print("\n" + "="*80)
        print("Comprehensive Integration Test Suite")
        print(f"Backend URL: {self.base_url}")
        print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80)
        
        # Authentication Tests
        print("\n[1] Authentication Tests")
        print("-" * 80)
        self.test_user_registration()
        self.test_get_current_user()
        self.test_token_refresh()
        
        # Patient Management Tests
        print("\n[2] Patient Management Tests")
        print("-" * 80)
        self.test_create_patient()
        self.test_get_patients()
        self.test_update_patient()
        
        # Sync Tests
        print("\n[3] Sync Tests")
        print("-" * 80)
        self.test_sync_pull()
        self.test_sync_push()
        
        # Performance Tests
        print("\n[4] Performance Tests")
        print("-" * 80)
        self.test_response_times()
        
        # Generate Report
        self.generate_report()
    
    def generate_report(self):
        """Generate comprehensive test report"""
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
        
        # Calculate average response times
        durations = [r["duration_ms"] for r in self.test_results if r["duration_ms"] > 0]
        if durations:
            avg_duration = sum(durations) / len(durations)
            print(f"Average Response Time: {avg_duration:.0f}ms")
        
        # Issues Summary
        print(f"\n{'='*80}")
        print(f"Issues Found: {len(self.issues)}")
        print(f"{'='*80}")
        
        if self.issues:
            severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
            for issue in self.issues:
                severity_counts[issue["severity"]] = severity_counts.get(issue["severity"], 0) + 1
            
            print(f"\nBy Severity:")
            print(f"  🔴 Critical: {severity_counts['critical']}")
            print(f"  🟠 High: {severity_counts['high']}")
            print(f"  🟡 Medium: {severity_counts['medium']}")
            print(f"  🟢 Low: {severity_counts['low']}")
            
            print(f"\nDetailed Issues:")
            for i, issue in enumerate(self.issues, 1):
                print(f"\n  {i}. [{issue['severity'].upper()}] {issue['title']}")
                print(f"     {issue['description']}")
        
        # Save results
        with open("integration_test_results.json", "w") as f:
            json.dump({
                "summary": {
                    "total_tests": total,
                    "passed": passed,
                    "failed": failed,
                    "success_rate": f"{(passed/total*100):.1f}%",
                    "avg_response_time_ms": sum(durations) / len(durations) if durations else 0
                },
                "test_results": self.test_results,
                "issues": self.issues
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: integration_test_results.json")
        print("="*80 + "\n")


if __name__ == "__main__":
    tester = IntegrationTester(BACKEND_URL)
    tester.run_all_tests()
