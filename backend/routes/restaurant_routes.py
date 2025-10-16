from flask import Blueprint, request, jsonify
from models.models import Restaurant
import logging

restaurant_bp = Blueprint('restaurants', __name__)

@restaurant_bp.route('/', methods=['POST'])
def create_restaurant():
    """Create a new restaurant"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'phone', 'address']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        restaurant = Restaurant.create(data)
        return jsonify({
            'message': 'Restaurant created successfully',
            'restaurant': restaurant.to_dict()
        }), 201
        
    except Exception as e:
        logging.error(f"Error creating restaurant: {str(e)}")
        return jsonify({'error': 'Failed to create restaurant'}), 500

@restaurant_bp.route('/', methods=['GET'])
def get_restaurants():
    """Get all restaurants"""
    try:
        restaurants = Restaurant.get_all()
        return jsonify({
            'restaurants': [r.to_dict() for r in restaurants]
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching restaurants: {str(e)}")
        return jsonify({'error': 'Failed to fetch restaurants'}), 500

@restaurant_bp.route('/<restaurant_id>', methods=['GET'])
def get_restaurant(restaurant_id):
    """Get a specific restaurant"""
    try:
        restaurant = Restaurant.get_by_id(restaurant_id)
        if not restaurant:
            return jsonify({'error': 'Restaurant not found'}), 404
            
        return jsonify({
            'restaurant': restaurant.to_dict()
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching restaurant: {str(e)}")
        return jsonify({'error': 'Failed to fetch restaurant'}), 500

@restaurant_bp.route('/<restaurant_id>', methods=['PUT'])
def update_restaurant(restaurant_id):
    """Update a restaurant"""
    try:
        restaurant = Restaurant.get_by_id(restaurant_id)
        if not restaurant:
            return jsonify({'error': 'Restaurant not found'}), 404
        
        data = request.get_json()
        restaurant.update(data)
        
        return jsonify({
            'message': 'Restaurant updated successfully',
            'restaurant': restaurant.to_dict()
        }), 200
        
    except Exception as e:
        logging.error(f"Error updating restaurant: {str(e)}")
        return jsonify({'error': 'Failed to update restaurant'}), 500
