#!/usr/bin/env python3
import requests
import sys
import os
import json
from datetime import datetime
from typing import Dict, List, Optional, Union, Any

# Add parent directory to path to allow importing from app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Configuration
# Production URL
BASE_URL = "https://api.the-leadlab.com/api/v1"  
TIMEOUT = 10  # seconds

# Colors for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"

class EndpointTester:
    def __init__(self, base_url: str, timeout: int = 10):
        self.base_url = base_url
        self.timeout = timeout
        self.access_token: Optional[str] = None
        self.results: Dict[str, Any] = {
            "success": 0,
            "failure": 0,
            "skipped": 0,
            "details": []
        }
    
    def login(self, email: str, password: str) -> bool:
        """Log in to get access token for authenticated endpoints"""
        print(f"{YELLOW}Attempting to log in with {email}...{RESET}")
        
        try:
            response = requests.post(
                f"{self.base_url}/auth/login",
                json={"email": email, "password": password},
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                print(f"{GREEN}Login successful{RESET}")
                return True
            else:
                print(f"{RED}Login failed: {response.status_code} - {response.text}{RESET}")
                return False
        except requests.RequestException as e:
            print(f"{RED}Login request failed: {str(e)}{RESET}")
            return False
    
    def test_endpoint(self, method: str, endpoint: str, auth_required: bool = False, 
                     payload: Optional[Dict] = None, expected_status: int = 200,
                     description: str = "") -> None:
        """Test a single endpoint"""
        url = f"{self.base_url}{endpoint}"
        headers: Dict[str, str] = {}
        
        if auth_required and self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        
        result: Dict[str, Any] = {
            "endpoint": endpoint,
            "method": method,
            "description": description,
            "timestamp": datetime.now().isoformat(),
        }
        
        try:
            if method.lower() == "get":
                response = requests.get(url, headers=headers, timeout=self.timeout)
            elif method.lower() == "post":
                response = requests.post(url, headers=headers, json=payload, timeout=self.timeout)
            elif method.lower() == "put":
                response = requests.put(url, headers=headers, json=payload, timeout=self.timeout)
            elif method.lower() == "delete":
                response = requests.delete(url, headers=headers, timeout=self.timeout)
            else:
                print(f"{RED}Unsupported method: {method}{RESET}")
                self.results["skipped"] = self.results["skipped"] + 1
                result.update({
                    "status": "skipped",
                    "reason": f"Unsupported method: {method}"
                })
                self.results["details"].append(result)
                return
            
            status_code = response.status_code
            result["status_code"] = status_code
            
            if status_code == expected_status:
                print(f"{GREEN}✓ {method} {endpoint} - {status_code}{RESET}")
                if description:
                    print(f"  {description}")
                self.results["success"] = self.results["success"] + 1
                result["status"] = "success"
                try:
                    result["response"] = response.json()
                except:
                    result["response"] = response.text[:200]
            else:
                print(f"{RED}✗ {method} {endpoint} - {status_code}{RESET}")
                if description:
                    print(f"  {description}")
                print(f"  Expected {expected_status}, got {status_code}")
                try:
                    resp_json = response.json()
                    print(f"  Response: {json.dumps(resp_json, indent=2)[:200]}...")
                    result["response"] = resp_json
                except:
                    print(f"  Response: {response.text[:200]}...")
                    result["response"] = response.text[:200]
                self.results["failure"] = self.results["failure"] + 1
                result["status"] = "failure"
                result["error"] = f"Expected {expected_status}, got {status_code}"
                
        except requests.RequestException as e:
            print(f"{RED}✗ {method} {endpoint} - Exception: {str(e)}{RESET}")
            self.results["failure"] = self.results["failure"] + 1
            result["status"] = "failure"
            result["error"] = str(e)
        
        self.results["details"].append(result)
    
    def run_all_tests(self):
        """Run all endpoint tests"""
        # Public endpoints that don't require authentication
        self.test_endpoint("GET", "/health", auth_required=False, description="Health check endpoint")
        
        # Test authentication
        email = input("Enter test username/email: ")
        password = input("Enter test password: ")
        
        if not self.login(email, password):
            print(f"{RED}Authentication failed. Skipping authenticated endpoints.{RESET}")
            return self.results
        
        # Authenticated endpoints
        # Users
        self.test_endpoint("GET", "/users/me", auth_required=True, description="Get current user profile")
        self.test_endpoint("GET", "/users", auth_required=True, description="List all users")
        
        # Leads
        self.test_endpoint("GET", "/leads", auth_required=True, description="List leads")
        
        # Organizations
        self.test_endpoint("GET", "/organizations", auth_required=True, description="List organizations")
        
        # Lead Stages
        self.test_endpoint("GET", "/admin/lead-stages", auth_required=True, description="List lead stages")
        
        # Leads Import
        self.test_endpoint("GET", "/leads/import/history", auth_required=True, description="Get leads import history")
        
        # Tasks
        self.test_endpoint("GET", "/tasks", auth_required=True, description="List tasks")
        
        # Events
        self.test_endpoint("GET", "/events", auth_required=True, description="List events")
        
        # Reports
        self.test_endpoint("GET", "/reports", auth_required=True, description="List reports")
        
        return self.results
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*50)
        print(f"ENDPOINT TEST SUMMARY")
        print("="*50)
        total = self.results["success"] + self.results["failure"] + self.results["skipped"]
        print(f"Total tests: {total}")
        print(f"{GREEN}Passed: {self.results['success']}{RESET}")
        print(f"{RED}Failed: {self.results['failure']}{RESET}")
        print(f"{YELLOW}Skipped: {self.results['skipped']}{RESET}")
        print("="*50)

if __name__ == "__main__":
    print(f"Testing API endpoints at {BASE_URL}")
    tester = EndpointTester(BASE_URL)
    tester.run_all_tests()
    tester.print_summary()
    
    # Save results to file
    with open("endpoint_test_results.json", "w") as f:
        json.dump(tester.results, f, indent=2)
    
    print(f"Results saved to endpoint_test_results.json")
    
    # Exit with error code if any tests failed
    if tester.results["failure"] > 0:
        sys.exit(1) 