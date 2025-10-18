"""
Utility routes for geocoding and distance calculations
"""
from flask import Blueprint, request, jsonify
from services.geocoding_service import geocoding_service

utility_bp = Blueprint('utility', __name__, url_prefix='/api/utility')

@utility_bp.route('/geocode', methods=['POST'])
def geocode_address():
    """Get coordinates for an address"""
    try:
        data = request.json
        address = data.get('address')
        
        if not address:
            return jsonify({'error': 'Address is required'}), 400
        
        lat, lon = geocoding_service.get_coordinates(address)
        
        if lat and lon:
            return jsonify({
                'success': True,
                'coordinates': {
                    'latitude': lat,
                    'longitude': lon
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Could not geocode address'
            }), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@utility_bp.route('/distance', methods=['POST'])
def calculate_distance():
    """Calculate distance between two addresses or coordinates"""
    try:
        data = request.json
        
        # Option 1: Two addresses
        if 'address1' in data and 'address2' in data:
            lat1, lon1 = geocoding_service.get_coordinates(data['address1'])
            lat2, lon2 = geocoding_service.get_coordinates(data['address2'])
            
            if not all([lat1, lon1, lat2, lon2]):
                return jsonify({'error': 'Could not geocode one or both addresses'}), 404
                
        # Option 2: Two coordinate pairs
        elif 'coordinates1' in data and 'coordinates2' in data:
            coords1 = data['coordinates1']
            coords2 = data['coordinates2']
            lat1, lon1 = coords1['latitude'], coords1['longitude']
            lat2, lon2 = coords2['latitude'], coords2['longitude']
            
        else:
            return jsonify({'error': 'Invalid input format'}), 400
        
        distance = geocoding_service.calculate_distance(lat1, lon1, lat2, lon2)
        
        return jsonify({
            'success': True,
            'distance_km': round(distance, 2),
            'distance_miles': round(distance * 0.621371, 2),
            'coordinates1': {'latitude': lat1, 'longitude': lon1},
            'coordinates2': {'latitude': lat2, 'longitude': lon2}
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@utility_bp.route('/nearest-foodbanks', methods=['POST'])
def find_nearest_foodbanks():
    """Find nearest food banks to a restaurant address"""
    try:
        from models.models import FoodBank
        
        data = request.json
        restaurant_address = data.get('restaurant_address')
        max_results = data.get('max_results', 5)
        
        if not restaurant_address:
            return jsonify({'error': 'Restaurant address is required'}), 400
        
        # Get all active food banks
        foodbanks = FoodBank.get_all()
        active_foodbanks = [fb for fb in foodbanks if fb.is_active and fb.address]
        
        if not active_foodbanks:
            return jsonify({'error': 'No active food banks with addresses found'}), 404
        
        # Find nearest food banks
        nearest = geocoding_service.find_nearest_foodbanks(
            restaurant_address, 
            active_foodbanks, 
            max_results
        )
        
        result = []
        for foodbank, distance in nearest:
            fb_dict = foodbank.to_dict()
            fb_dict['distance_km'] = round(distance, 2) if distance is not None else None
            fb_dict['distance_miles'] = round(distance * 0.621371, 2) if distance is not None else None
            result.append(fb_dict)
        
        return jsonify({
            'success': True,
            'restaurant_address': restaurant_address,
            'nearest_foodbanks': result
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
