#!/usr/bin/env python3
"""
Simple test script for TripCraft Backend API
Run this after starting the server to test basic functionality
"""

import requests
import json

BASE_URL = "http://localhost:8005"
API_BASE = f"{BASE_URL}/api/v1"

def test_health_check():
    """Test health check endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure it's running on http://localhost:8005")
        return False

def test_root_endpoint():
    """Test root endpoint"""
    print("🏠 Testing root endpoint...")
    try:
        response = requests.get(BASE_URL)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Root endpoint working: {data.get('message', 'No message')}")
            return True
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")
        return False

def test_user_registration():
    """Test user registration"""
    print("📝 Testing user registration...")
    
    test_user = {
        "email": "test@example.com",
        "full_name": "Test User",
        "phone": "+1234567890",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/register",
            json=test_user,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ User registration successful: {data.get('email', 'No email')}")
            return data
        else:
            print(f"❌ User registration failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ User registration error: {e}")
        return None

def test_user_login():
    """Test user login"""
    print("🔑 Testing user login...")
    
    login_data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ User login successful")
            return data.get("access_token")
        else:
            print(f"❌ User login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ User login error: {e}")
        return None

def test_protected_endpoint(token):
    """Test protected endpoint with token"""
    if not token:
        print("❌ No token available for protected endpoint test")
        return False
    
    print("🔒 Testing protected endpoint...")
    
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{API_BASE}/auth/me",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Protected endpoint working: {data.get('email', 'No email')}")
            return True
        else:
            print(f"❌ Protected endpoint failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Protected endpoint error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 TripCraft Backend API Test Suite")
    print("=" * 50)
    
    # Test basic endpoints
    if not test_health_check():
        return
    
    if not test_root_endpoint():
        return
    
    print("\n" + "=" * 50)
    print("🔐 Testing Authentication Endpoints")
    print("=" * 50)
    
    # Test user registration
    user_data = test_user_registration()
    if not user_data:
        print("⚠️  Skipping login test due to registration failure")
        return
    
    # Test user login
    token = test_user_login()
    if not token:
        print("⚠️  Skipping protected endpoint test due to login failure")
        return
    
    # Test protected endpoint
    test_protected_endpoint(token)
    
    print("\n" + "=" * 50)
    print("🎉 Test suite completed!")
    print("=" * 50)
    print(f"📚 API Documentation: {BASE_URL}/docs")
    print(f"🔍 Health Check: {BASE_URL}/health")

if __name__ == "__main__":
    main()
