#!/usr/bin/env python3
import requests
import sys
import os
import json
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "http://localhost:8000/api/v1"  # Yerel API URL'si
TIMEOUT = 10  # seconds

def login(email: str, password: str) -> Optional[str]:
    """Log in and get access token"""
    print(f"\n🔑 Attempting to log in with {email}...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": email, "password": password},
            timeout=TIMEOUT
        )
        
        if response.status_code == 200:
            data = response.json()
            access_token = data.get("access_token")
            print(f"✅ Login successful")
            return access_token
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
    except requests.RequestException as e:
        print(f"❌ Login request failed: {str(e)}")
        return None

def update_user_password(user_id: int, new_password: str, access_token: str) -> bool:
    """Update user password using PATCH endpoint"""
    print(f"\n📝 Attempting to update password for user ID {user_id}...")
    
    headers = {"Authorization": f"Bearer {access_token}"}
    payload = {"password": new_password}
    
    try:
        response = requests.patch(
            f"{BASE_URL}/users/{user_id}",
            headers=headers,
            json=payload,
            timeout=TIMEOUT
        )
        
        if response.status_code == 200:
            print(f"✅ Password update successful")
            return True
        else:
            print(f"❌ Password update failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except requests.RequestException as e:
        print(f"❌ Password update request failed: {str(e)}")
        return False

def change_password_endpoint(current_password: str, new_password: str, access_token: str) -> bool:
    """Use the change-password endpoint to update password"""
    print(f"\n🔄 Attempting to change password using /auth/change-password endpoint...")
    
    headers = {"Authorization": f"Bearer {access_token}"}
    payload = {
        "current_password": current_password,
        "new_password": new_password
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/change-password",
            headers=headers,
            json=payload,
            timeout=TIMEOUT
        )
        
        if response.status_code == 200:
            print(f"✅ Change password successful")
            return True
        else:
            print(f"❌ Change password failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except requests.RequestException as e:
        print(f"❌ Change password request failed: {str(e)}")
        return False

def verify_login_with_new_password(email: str, new_password: str) -> bool:
    """Verify we can log in with the new password"""
    print(f"\n✓ Verifying login with new password...")
    
    access_token = login(email, new_password)
    return access_token is not None

def main():
    print("=" * 50)
    print("PASSWORD UPDATE TEST")
    print("=" * 50)
    
    # Get test credentials
    email = input("Enter test user email: ")
    current_password = input("Enter current password: ")
    new_password = input("Enter new password: ")
    user_id = input("Enter user ID for update: ")
    
    # Step 1: Login with current credentials
    access_token = login(email, current_password)
    if not access_token:
        print("\n❌ Test failed: Could not login with current credentials")
        return
    
    # Step 2: Update password with PATCH endpoint
    if update_user_password(int(user_id), new_password, access_token):
        # Step 3: Verify we can login with the new password
        if verify_login_with_new_password(email, new_password):
            print("\n✅ TEST PASSED: Password updated successfully and verified")
        else:
            print("\n❌ TEST FAILED: Could not login with new password")
    else:
        # Try alternate change password endpoint
        print("\n⚠️ PATCH update failed, trying /auth/change-password endpoint...")
        if change_password_endpoint(current_password, new_password, access_token):
            # Verify we can login with the new password
            if verify_login_with_new_password(email, new_password):
                print("\n✅ TEST PASSED: Password changed successfully using change-password endpoint")
            else:
                print("\n❌ TEST FAILED: Could not login with new password after using change-password endpoint")
        else:
            print("\n❌ TEST FAILED: Password update failed with both methods")

if __name__ == "__main__":
    main() 