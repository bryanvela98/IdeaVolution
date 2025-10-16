from flask import Blueprint, request, jsonify
from models.models import FoodBank
import logging

foodbank_bp = Blueprint('foodbanks', __name__)

@foodbank_bp.route('/', methods=['POST'])
def create_foodbank():
    """Create a new food bank"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'phone', 'address']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        foodbank = FoodBank.create(data)
        return jsonify({
            'message': 'Food bank created successfully',
            'foodbank': foodbank.to_dict()
        }), 201
        
    except Exception as e:
        logging.error(f"Error creating food bank: {str(e)}")
        return jsonify({'error': 'Failed to create food bank'}), 500

@foodbank_bp.route('/', methods=['GET'])
def get_foodbanks():
    """Get all food banks"""
    try:
        foodbanks = FoodBank.get_all()
        return jsonify({
            'foodbanks': [fb.to_dict() for fb in foodbanks]
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching food banks: {str(e)}")
        return jsonify({'error': 'Failed to fetch food banks'}), 500

@foodbank_bp.route('/<foodbank_id>', methods=['GET'])
def get_foodbank(foodbank_id):
    """Get a specific food bank"""
    try:
        foodbank = FoodBank.get_by_id(foodbank_id)
        if not foodbank:
            return jsonify({'error': 'Food bank not found'}), 404
            
        return jsonify({
            'foodbank': foodbank.to_dict()
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching food bank: {str(e)}")
        return jsonify({'error': 'Failed to fetch food bank'}), 500

@foodbank_bp.route('/nearby', methods=['POST'])
def get_nearby_foodbanks():
    """Get nearby food banks based on coordinates"""
    try:
        data = request.get_json()
        lat = data.get('lat')
        lng = data.get('lng')
        radius = data.get('radius', 10)  # Default 10km radius
        
        if not lat or not lng:
            return jsonify({'error': 'Latitude and longitude are required'}), 400
        
        # For now, return all active food banks
        # In production, you'd implement proper geo-queries
        foodbanks = FoodBank.get_all()
        active_foodbanks = [fb for fb in foodbanks if fb.is_active]
        
        return jsonify({
            'nearby_foodbanks': [fb.to_dict() for fb in active_foodbanks]
        }), 200
        
    except Exception as e:
        logging.error(f"Error finding nearby food banks: {str(e)}")
        return jsonify({'error': 'Failed to find nearby food banks'}), 500
