"""
Geocoding service to convert addresses to coordinates and calculate distances
"""
import math
import logging
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import time

class GeocodingService:
    def __init__(self):
        self.geolocator = Nominatim(user_agent="ideavolution-app")
    
    def get_coordinates(self, address, retry_count=3):
        """
        Get latitude and longitude from address
        Returns: (latitude, longitude) or (None, None) if failed
        """
        if not address or not address.strip():
            logging.warning("Empty address provided")
            return None, None
            
        for attempt in range(retry_count):
            try:
                logging.info(f"Geocoding attempt {attempt + 1} for: {address}")
                location = self.geolocator.geocode(address, timeout=10)
                if location:
                    logging.info(f"Successfully geocoded '{address}' to {location.latitude}, {location.longitude}")
                    return location.latitude, location.longitude
                else:
                    logging.warning(f"Address not found: {address}")
                    return None, None
                    
            except (GeocoderTimedOut, GeocoderServiceError) as e:
                logging.warning(f"Geocoding attempt {attempt + 1} failed: {str(e)}")
                if attempt < retry_count - 1:
                    time.sleep(1)  # Wait before retry
                else:
                    logging.error(f"All geocoding attempts failed for address: {address}")
                    return None, None
            except Exception as e:
                logging.error(f"Unexpected error geocoding '{address}': {str(e)}")
                return None, None
    
    @staticmethod
    def calculate_distance(lat1, lon1, lat2, lon2):
        """
        Calculate distance between two points using Haversine formula
        Returns distance in kilometers
        """
        if not all([lat1, lon1, lat2, lon2]):
            return float('inf')  # Return infinity if any coordinate is missing
        
        # Convert to radians
        R = 6371  # Earth's radius in kilometers
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def find_nearest_foodbanks(self, restaurant_address, foodbanks, max_results=5):
        """
        Find nearest food banks to a restaurant
        Returns list of (foodbank, distance_km) tuples, sorted by distance
        """
        # Get restaurant coordinates
        rest_lat, rest_lon = self.get_coordinates(restaurant_address)
        if not rest_lat or not rest_lon:
            logging.error(f"Could not geocode restaurant address: {restaurant_address}")
            return [(fb, None) for fb in foodbanks[:max_results]]
        
        foodbank_distances = []
        
        for foodbank in foodbanks:
            # Get foodbank coordinates
            fb_lat, fb_lon = self.get_coordinates(foodbank.address)
            
            # Calculate distance
            distance = self.calculate_distance(rest_lat, rest_lon, fb_lat, fb_lon)
            foodbank_distances.append((foodbank, distance))
        
        # Sort by distance (closest first)
        foodbank_distances.sort(key=lambda x: x[1] if x[1] is not None else float('inf'))
        
        return foodbank_distances[:max_results]

# Global geocoding service instance
geocoding_service = GeocodingService()
