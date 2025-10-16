from flask import Blueprint, request, jsonify
from models.models import Driver
import logging

driver_bp = Blueprint('drivers', __name__)

@driver_bp.route('/', methods=['POST'])
def create_driver():
    """Create a new driver"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'phone', 'license_number', 'vehicle_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        driver = Driver.create(data)
        return jsonify({
            'message': 'Driver created successfully',
            'driver': driver.to_dict()
        }), 201
        
    except Exception as e:
        logging.error(f"Error creating driver: {str(e)}")
        return jsonify({'error': 'Failed to create driver'}), 500

@driver_bp.route('/', methods=['GET'])
def get_drivers():
    """Get all drivers"""
    try:
        drivers = Driver.get_all()
        return jsonify({
            'drivers': [d.to_dict() for d in drivers]
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching drivers: {str(e)}")
        return jsonify({'error': 'Failed to fetch drivers'}), 500

@driver_bp.route('/available', methods=['GET'])
def get_available_drivers():
    """Get available drivers"""
    try:
        drivers = Driver.get_all()
        available_drivers = [d for d in drivers if d.is_available and d.is_active]
        
        return jsonify({
            'available_drivers': [d.to_dict() for d in available_drivers]
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching available drivers: {str(e)}")
        return jsonify({'error': 'Failed to fetch available drivers'}), 500

@driver_bp.route('/<driver_id>/availability', methods=['PUT'])
def update_driver_availability(driver_id):
    """Update driver availability status"""
    try:
        driver = Driver.get_by_id(driver_id)
        if not driver:
            return jsonify({'error': 'Driver not found'}), 404
        
        data = request.get_json()
        is_available = data.get('is_available')
        current_location = data.get('current_location')
        
        update_data = {}
        if is_available is not None:
            update_data['is_available'] = is_available
        if current_location:
            update_data['current_location'] = current_location
            
        driver.update(update_data)
        
        return jsonify({
            'message': 'Driver availability updated',
            'driver': driver.to_dict()
        }), 200
        
    except Exception as e:
        logging.error(f"Error updating driver availability: {str(e)}")
        return jsonify({'error': 'Failed to update driver availability'}), 500
