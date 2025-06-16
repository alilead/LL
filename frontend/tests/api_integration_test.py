import requests
import json
from datetime import datetime
import logging
import sys
from typing import Dict, Any, Optional
from tqdm import tqdm

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class APITester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.access_token = None
        self.test_results = {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "failures": []
        }
        self.pbar = None

    def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        expected_status: int = 200,
        is_form_data: bool = False
    ) -> Dict[str, Any]:
        """Make HTTP request and validate response"""
        url = f"{self.base_url}{endpoint}"
        headers = {}
        
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        
        if data and not is_form_data:
            headers["Content-Type"] = "application/json"
            
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, params=params, timeout=5)
            elif method == "POST":
                if is_form_data:
                    response = requests.post(url, headers=headers, data=data, timeout=5)
                else:
                    response = requests.post(url, headers=headers, json=data, timeout=5)
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=5)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, timeout=5)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            self.test_results["total_tests"] += 1
            
            if response.status_code == expected_status:
                self.test_results["passed"] += 1
                logger.info(f"✅ {method} {endpoint} - Status: {response.status_code}")
                if self.pbar:
                    self.pbar.update(1)
                return response.json() if response.text else {}
            else:
                self.test_results["failed"] += 1
                error_msg = f"❌ {method} {endpoint} - Expected status {expected_status}, got {response.status_code}"
                self.test_results["failures"].append(error_msg)
                logger.error(error_msg)
                logger.error(f"Response: {response.text}")
                if self.pbar:
                    self.pbar.update(1)
                return {}

        except requests.exceptions.Timeout:
            self.test_results["failed"] += 1
            error_msg = f"❌ {method} {endpoint} - Timeout: Server took too long to respond"
            self.test_results["failures"].append(error_msg)
            logger.error(error_msg)
            if self.pbar:
                self.pbar.update(1)
            return {}
        except requests.exceptions.ConnectionError:
            self.test_results["failed"] += 1
            error_msg = f"❌ {method} {endpoint} - Connection Error: Could not connect to server"
            self.test_results["failures"].append(error_msg)
            logger.error(error_msg)
            if self.pbar:
                self.pbar.update(1)
            return {}
        except Exception as e:
            self.test_results["failed"] += 1
            error_msg = f"❌ {method} {endpoint} - Exception: {str(e)}"
            self.test_results["failures"].append(error_msg)
            logger.error(error_msg)
            if self.pbar:
                self.pbar.update(1)
            return {}

    def test_auth(self) -> None:
        """Test authentication endpoints"""
        logger.info("\n=== Testing Authentication ===")
        
        # Test login with form data
        login_data = {
            "username": "admin@example.com",
            "password": "admin123",
            "grant_type": "password"
        }
        response = self._make_request(
            "POST", 
            "/api/v1/auth/login", 
            data=login_data,
            is_form_data=True
        )
        if "access_token" in response:
            self.access_token = response["access_token"]
            logger.info("Successfully obtained access token")
        else:
            logger.error("Failed to obtain access token")

    def test_leads(self) -> None:
        """Test lead-related endpoints"""
        logger.info("\n=== Testing Leads ===")
        
        # Get all leads
        leads = self._make_request("GET", "/api/v1/leads/")
        
        # Create a new lead
        new_lead = {
            "first_name": "Test",
            "last_name": "User",
            "email": "test.user@example.com",
            "telephone": "+1234567890",
            "company": "Test Company",
            "job_title": "Test Manager",
            "stage_id": 1,
            "user_id": 1
        }
        created_lead = self._make_request(
            "POST", 
            "/api/v1/leads/", 
            data=new_lead
        )
        
        if created_lead and "id" in created_lead:
            lead_id = created_lead["id"]
            
            # Update the lead
            update_data = {
                "first_name": "Updated",
                "last_name": "User"
            }
            self._make_request(
                "PUT",
                f"/api/v1/leads/{lead_id}",
                data=update_data
            )
            
            # Delete the lead
            self._make_request(
                "DELETE",
                f"/api/v1/leads/{lead_id}",
                expected_status=204
            )

    def test_deals(self) -> None:
        """Test deal-related endpoints"""
        logger.info("\n=== Testing Deals ===")
        
        # Get all deals
        deals = self._make_request("GET", "/api/v1/deals/")
        
        # Create a new deal
        new_deal = {
            "name": "Test Deal",
            "amount": 10000.00,
            "currency_id": 1,  # USD
            "probability": 50,
            "expected_close_date": datetime.now().date().isoformat(),  # Only date for deals
            "status": "open",  # lowercase to match ENUM
            "lead_id": 1,
            "user_id": 1
        }
        created_deal = self._make_request(
            "POST",
            "/api/v1/deals/",
            data=new_deal
        )
        
        if created_deal and "id" in created_deal:
            deal_id = created_deal["id"]
            
            # Update the deal
            update_data = {
                "name": "Updated Deal",
                "probability": 75,
                "status": "won"
            }
            self._make_request(
                "PUT",
                f"/api/v1/deals/{deal_id}",
                data=update_data
            )
            
            # Delete the deal
            self._make_request(
                "DELETE",
                f"/api/v1/deals/{deal_id}",
                expected_status=204
            )

    def test_activities(self) -> None:
        """Test activity-related endpoints"""
        logger.info("\n=== Testing Activities ===")
        
        # Get all activities
        activities = self._make_request("GET", "/api/v1/activities/", params={"lead_id": 1})
        
        # Create a new activity
        new_activity = {
            "type": "call",  # lowercase to match ENUM in DB
            "description": "Test call",
            "scheduled_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "duration_minutes": 30,  # match DB column name
            "lead_id": 1,
            "user_id": 1
        }
        created_activity = self._make_request(
            "POST",
            "/api/v1/activities/",
            data=new_activity
        )
        
        if created_activity and "id" in created_activity:
            activity_id = created_activity["id"]
            
            # Update the activity
            update_data = {
                "description": "Updated call",
                "duration_minutes": 45
            }
            self._make_request(
                "PUT",
                f"/api/v1/activities/{activity_id}",
                data=update_data
            )
            
            # Delete the activity
            self._make_request(
                "DELETE",
                f"/api/v1/activities/{activity_id}",
                expected_status=204
            )

    def test_notes(self) -> None:
        """Test note-related endpoints"""
        logger.info("\n=== Testing Notes ===")
        
        # Get all notes
        notes = self._make_request("GET", "/api/v1/notes/", params={"lead_id": 1})
        
        # Create a new note
        new_note = {
            "content": "Test note content",
            "lead_id": 1,
            "user_id": 1
        }
        created_note = self._make_request(
            "POST",
            "/api/v1/notes/",
            data=new_note
        )
        
        if created_note and "id" in created_note:
            note_id = created_note["id"]
            
            # Update the note
            update_data = {
                "content": "Updated note content"
            }
            self._make_request(
                "PUT",
                f"/api/v1/notes/{note_id}",
                data=update_data
            )
            
            # Delete the note
            self._make_request(
                "DELETE",
                f"/api/v1/notes/{note_id}",
                expected_status=204
            )

    def run_all_tests(self) -> None:
        """Run all API tests"""
        logger.info("Starting API Integration Tests...")
        
        # Calculate total number of tests
        total_tests = 13  # Update this number based on total number of API calls
        
        # Initialize progress bar
        self.pbar = tqdm(total=total_tests, desc="Running Tests", 
                        bar_format='{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}]')
        
        # Run all test methods
        self.test_auth()
        self.test_leads()
        self.test_deals()
        self.test_activities()
        self.test_notes()
        
        # Close progress bar
        self.pbar.close()
        
        # Print summary
        logger.info("\n=== Test Summary ===")
        logger.info(f"Total Tests: {self.test_results['total_tests']}")
        logger.info(f"Passed: {self.test_results['passed']}")
        logger.info(f"Failed: {self.test_results['failed']}")
        
        if self.test_results["failures"]:
            logger.info("\nFailures:")
            for failure in self.test_results["failures"]:
                logger.info(failure)

if __name__ == "__main__":
    tester = APITester()
    tester.run_all_tests()
