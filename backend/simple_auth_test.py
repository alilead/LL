#!/usr/bin/env python3
import requests
import time
import json

print("Simple Login Test")
print("=================")

# Test parameters
base_url = "https://api.the-leadlab.com/api/v1"
email = "firat@the-leadlab.com"
password = "147741_a"

# Login request
print(f"Attempting login with {email}...")
start_time = time.time()

try:
    # Send request with increased timeout
    response = requests.post(
        f"{base_url}/auth/login",
        json={"email": email, "password": password},
        headers={"Content-Type": "application/json"},
        timeout=30  # Increased timeout
    )
    
    elapsed = time.time() - start_time
    print(f"Request took {elapsed:.2f} seconds")
    
    # Check response
    print(f"Status code: {response.status_code}")
    
    if response.status_code == 200:
        print("Login successful!")
        data = response.json()
        print(f"User: {data['user']['email']}")
        print(f"Token: {data['access_token'][:20]}...")
    else:
        print("Login failed!")
        print("Response:", response.text)
        
except requests.exceptions.RequestException as e:
    elapsed = time.time() - start_time
    print(f"Request failed after {elapsed:.2f} seconds")
    print(f"Error: {str(e)}")

print("\nTest complete.") 