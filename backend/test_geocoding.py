"""
Test script to verify geocoding service functionality
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.geocoding_service import geocoding_service

def test_geocoding():
    print("Testing Geocoding Service...")
    
    # Test address geocoding
    test_addresses = [
        "5511 Bloomfield St, Halifax, NS, Canada",
        "456 Queen St, Toronto, ON, Canada",
        "789 King St, Toronto, ON, Canada"
    ]
    
    coordinates = []
    
    for address in test_addresses:
        print(f"\nGeocoding: {address}")
        lat, lon = geocoding_service.get_coordinates(address)
        
        if lat and lon:
            print(f"  ✅ Success: {lat:.6f}, {lon:.6f}")
            coordinates.append((lat, lon))
        else:
            print(f"  ❌ Failed to geocode")
    
    # Test distance calculation
    if len(coordinates) >= 2:
        print(f"\nTesting distance calculation...")
        lat1, lon1 = coordinates[0]
        lat2, lon2 = coordinates[1]
        
        distance = geocoding_service.calculate_distance(lat1, lon1, lat2, lon2)
        print(f"Distance between first two addresses: {distance:.2f} km")
    
    print("\n✅ Geocoding service test completed!")

if __name__ == "__main__":
    test_geocoding()
