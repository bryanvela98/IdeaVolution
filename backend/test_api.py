#!/usr/bin/env python3
"""
Simple test script to verify IdeaVolution API endpoints
Run this after starting the Flask server to test basic functionality
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000/api"

def test_health():
    """Test health check endpoint"""
    print("🏥 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Health check: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_create_restaurant():
    """Test creating a restaurant"""
    print("\n🍽️  Testing restaurant creation...")
    try:
        data = {
            "name": "Test Restaurant",
            "email": "test@restaurant.com",
            "phone": "+1234567890",
            "address": "123 Main St, City",
            "coordinates": {"lat": 40.7128, "lng": -74.0060},
            "contact_person": "John Doe"
        }
        response = requests.post(f"{BASE_URL}/restaurants", json=data)
        result = response.json()
        print(f"✅ Restaurant created: {result['restaurant']['name']}")
        return result['restaurant']['id']
    except Exception as e:
        print(f"❌ Restaurant creation failed: {e}")
        return None

def test_create_foodbank():
    """Test creating a food bank"""
    print("\n🏪 Testing food bank creation...")
    try:
        data = {
            "name": "Test Food Bank",
            "email": "test@foodbank.com", 
            "phone": "+1234567891",
            "address": "456 Oak St, City",
            "coordinates": {"lat": 40.7589, "lng": -73.9851},
            "contact_person": "Jane Smith",
            "capacity": 100
        }
        response = requests.post(f"{BASE_URL}/foodbanks", json=data)
        result = response.json()
        print(f"✅ Food bank created: {result['foodbank']['name']}")
        return result['foodbank']['id']
    except Exception as e:
        print(f"❌ Food bank creation failed: {e}")
        return None

def test_create_driver():
    """Test creating a driver"""
    print("\n🚗 Testing driver creation...")
    try:
        data = {
            "name": "Test Driver",
            "email": "test@driver.com",
            "phone": "+1234567892", 
            "license_number": "DL123456",
            "vehicle_type": "van",
            "current_location": {"lat": 40.7505, "lng": -73.9934}
        }
        response = requests.post(f"{BASE_URL}/drivers", json=data)
        result = response.json()
        print(f"✅ Driver created: {result['driver']['name']}")
        return result['driver']['id']
    except Exception as e:
        print(f"❌ Driver creation failed: {e}")
        return None

def test_create_alert(restaurant_id):
    """Test creating a food alert"""
    print("\n🚨 Testing food alert creation...")
    try:
        data = {
            "restaurant_id": restaurant_id,
            "food_items": [
                {"name": "Leftover Sandwiches", "quantity": 20, "expiry": "2024-12-31"},
                {"name": "Fresh Salads", "quantity": 15, "expiry": "2024-12-30"}
            ],
            "notes": "Fresh food from lunch service"
        }
        response = requests.post(f"{BASE_URL}/alerts", json=data)
        result = response.json()
        print(f"✅ Alert created with {result['alert']['total_quantity']} items")
        return result['alert']['id']
    except Exception as e:
        print(f"❌ Alert creation failed: {e}")
        return None

def test_get_alerts():
    """Test getting all alerts"""
    print("\n📋 Testing get alerts...")
    try:
        response = requests.get(f"{BASE_URL}/alerts")
        result = response.json()
        print(f"✅ Found {len(result['alerts'])} alerts")
        return True
    except Exception as e:
        print(f"❌ Get alerts failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Starting IdeaVolution API Tests")
    print("=" * 50)
    
    # Test health check first
    if not test_health():
        print("❌ Server is not running. Please start the Flask app first.")
        return
    
    # Create test entities
    restaurant_id = test_create_restaurant()
    foodbank_id = test_create_foodbank()
    driver_id = test_create_driver()
    
    if restaurant_id:
        alert_id = test_create_alert(restaurant_id)
        
    test_get_alerts()
    
    print("\n" + "=" * 50)
    print("🎉 API tests completed!")
    print("\nNext steps:")
    print("1. Check the React frontend connection")
    print("2. Test WebSocket real-time features")
    print("3. Set up Firebase for production data")

if __name__ == "__main__":
    main()
