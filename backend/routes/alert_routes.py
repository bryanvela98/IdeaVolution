from flask import Blueprint, request, jsonify
from flask_socketio import emit
from models.models import FoodAlert, Restaurant, FoodBank, Driver, DeliveryRequest
from datetime import datetime, timedelta
import logging

alert_bp = Blueprint('alerts', __name__)

@alert_bp.route('/', methods=['POST'])
def create_food_alert():
    """Create a new food alert from restaurant"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['restaurant_id', 'food_items']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Verify restaurant exists
        restaurant = Restaurant.get_by_id(data['restaurant_id'])
        if not restaurant:
            return jsonify({'error': 'Restaurant not found'}), 404
        
        # Calculate total quantity
        total_quantity = sum(item.get('quantity', 0) for item in data['food_items'])
        data['total_quantity'] = total_quantity
        
        # Set expiration time (food expires in 24 hours)
        data['expires_at'] = datetime.now() + timedelta(hours=24)
        
        alert = FoodAlert.create(data)
        
        # Trigger real-time notification to nearby food banks
        from services.notification_service import get_notification_service
        notification_service = get_notification_service()
        if notification_service:
            notification_service.notify_nearby_foodbanks(alert.id)
        
        return jsonify({
            'message': 'Food alert created successfully',
            'alert': alert.to_dict()
        }), 201
        
    except Exception as e:
        logging.error(f"Error creating food alert: {str(e)}")
        return jsonify({'error': 'Failed to create food alert'}), 500

@alert_bp.route('/', methods=['GET'])
def get_alerts():
    """Get all alerts with optional filtering"""
    try:
        status = request.args.get('status')
        restaurant_id = request.args.get('restaurant_id')
        foodbank_id = request.args.get('foodbank_id')
        driver_id = request.args.get('driver_id')
        
        alerts = FoodAlert.get_all()
        
        # Apply filters
        if status:
            alerts = [a for a in alerts if a.status == status]
        if restaurant_id:
            alerts = [a for a in alerts if a.restaurant_id == restaurant_id]
        if foodbank_id:
            alerts = [a for a in alerts if a.foodbank_id == foodbank_id]
        if driver_id:
            alerts = [a for a in alerts if a.driver_id == driver_id]
        
        # Enrich alerts with restaurant and foodbank details
        enriched_alerts = []
        for alert in alerts:
            alert_dict = alert.to_dict()
            
            # Get restaurant details
            if alert.restaurant_id:
                restaurant = Restaurant.get_by_id(alert.restaurant_id)
                if restaurant:
                    alert_dict['restaurant_name'] = restaurant.name
                    alert_dict['restaurant_address'] = restaurant.address
                    alert_dict['restaurant_phone'] = restaurant.phone
                    alert_dict['restaurant_email'] = restaurant.email
            
            # Get foodbank details
            if alert.foodbank_id:
                foodbank = FoodBank.get_by_id(alert.foodbank_id)
                if foodbank:
                    alert_dict['foodbank_name'] = foodbank.name
                    alert_dict['foodbank_address'] = foodbank.address
                    alert_dict['foodbank_phone'] = foodbank.phone
                    alert_dict['foodbank_email'] = foodbank.email
            
            # Get driver details
            if alert.driver_id:
                driver = Driver.get_by_id(alert.driver_id)
                if driver:
                    alert_dict['driver_name'] = driver.name
                    alert_dict['driver_phone'] = driver.phone
                    alert_dict['driver_email'] = driver.email
                    alert_dict['driver_vehicle_type'] = driver.vehicle_type
            
            enriched_alerts.append(alert_dict)
        
        return jsonify({
            'alerts': enriched_alerts
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching alerts: {str(e)}")
        return jsonify({'error': 'Failed to fetch alerts'}), 500

@alert_bp.route('/<alert_id>', methods=['GET'])
def get_alert(alert_id):
    """Get a specific alert"""
    try:
        alert = FoodAlert.get_by_id(alert_id)
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404
        
        # Enrich alert with restaurant and foodbank details
        alert_dict = alert.to_dict()
        
        # Get restaurant details
        if alert.restaurant_id:
            restaurant = Restaurant.get_by_id(alert.restaurant_id)
            if restaurant:
                alert_dict['restaurant_name'] = restaurant.name
                alert_dict['restaurant_address'] = restaurant.address
                alert_dict['restaurant_phone'] = restaurant.phone
                alert_dict['restaurant_email'] = restaurant.email
        
        # Get foodbank details
        if alert.foodbank_id:
            foodbank = FoodBank.get_by_id(alert.foodbank_id)
            if foodbank:
                alert_dict['foodbank_name'] = foodbank.name
                alert_dict['foodbank_address'] = foodbank.address
                alert_dict['foodbank_phone'] = foodbank.phone
                alert_dict['foodbank_email'] = foodbank.email
        
        # Get driver details
        if alert.driver_id:
            driver = Driver.get_by_id(alert.driver_id)
            if driver:
                alert_dict['driver_name'] = driver.name
                alert_dict['driver_phone'] = driver.phone
                alert_dict['driver_email'] = driver.email
                alert_dict['driver_vehicle_type'] = driver.vehicle_type
            
        return jsonify({
            'alert': alert_dict
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching alert: {str(e)}")
        return jsonify({'error': 'Failed to fetch alert'}), 500

@alert_bp.route('/<alert_id>/accept', methods=['POST'])
def accept_alert_by_foodbank(alert_id):
    """Food bank accepts an alert"""
    try:
        data = request.get_json()
        foodbank_id = data.get('foodbank_id')
        
        if not foodbank_id:
            return jsonify({'error': 'foodbank_id is required'}), 400
        
        alert = FoodAlert.get_by_id(alert_id)
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404
        
        # Verify food bank exists
        foodbank = FoodBank.get_by_id(foodbank_id)
        if not foodbank:
            return jsonify({'error': 'Food bank not found'}), 404
        
        # Update alert status
        alert.update({
            'foodbank_id': foodbank_id,
            'status': FoodAlert.STATUSES['FOODBANK_ACCEPTED']
        })
        
        # Cancel escalation timer and trigger driver notification
        from services.notification_service import get_notification_service
        notification_service = get_notification_service()
        if notification_service:
            notification_service.cancel_escalation_timer(alert_id)
            notification_service.notify_available_drivers(alert_id)
        
        return jsonify({
            'message': 'Alert accepted successfully',
            'alert': alert.to_dict()
        }), 200
        
    except Exception as e:
        logging.error(f"Error accepting alert: {str(e)}")
        return jsonify({'error': 'Failed to accept alert'}), 500

@alert_bp.route('/<alert_id>/assign-driver', methods=['POST'])
def assign_driver_to_alert(alert_id):
    """Assign a driver to an alert"""
    try:
        data = request.get_json()
        driver_id = data.get('driver_id')
        
        if not driver_id:
            return jsonify({'error': 'driver_id is required'}), 400
        
        alert = FoodAlert.get_by_id(alert_id)
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404
        
        # Verify driver exists and is available
        driver = Driver.get_by_id(driver_id)
        if not driver:
            return jsonify({'error': 'Driver not found'}), 404
        
        if not driver.is_available:
            return jsonify({'error': 'Driver is not available'}), 400
        
        # Update alert and driver
        alert.update({
            'driver_id': driver_id,
            'status': FoodAlert.STATUSES['DRIVER_ASSIGNED']
        })
        
        driver.update({'is_available': False})
        
        # Create delivery request
        restaurant = Restaurant.get_by_id(alert.restaurant_id)
        foodbank = FoodBank.get_by_id(alert.foodbank_id)
        
        delivery_request = DeliveryRequest.create({
            'alert_id': alert_id,
            'driver_id': driver_id,
            'pickup_address': restaurant.address if restaurant else '',
            'delivery_address': foodbank.address if foodbank else '',
            'pickup_coordinates': restaurant.coordinates if restaurant else {},
            'delivery_coordinates': foodbank.coordinates if foodbank else {},
            'estimated_duration': 30  # Default 30 minutes
        })
        
        # Notify the driver via WebSocket
        from services.notification_service import get_notification_service
        notification_service = get_notification_service()
        if notification_service:
            notification_service.notify_assigned_driver(alert_id, driver_id, delivery_request)
        
        return jsonify({
            'message': 'Driver assigned successfully',
            'alert': alert.to_dict(),
            'delivery_request': delivery_request.to_dict()
        }), 200
        
    except Exception as e:
        logging.error(f"Error assigning driver: {str(e)}")
        return jsonify({'error': 'Failed to assign driver'}), 500

@alert_bp.route('/<alert_id>/status', methods=['PUT'])
def update_alert_status(alert_id):
    """Update alert status (for driver updates during delivery)"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'error': 'status is required'}), 400
        
        if new_status not in FoodAlert.STATUSES.values():
            return jsonify({'error': 'Invalid status'}), 400
        
        alert = FoodAlert.get_by_id(alert_id)
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404
        
        update_data = {'status': new_status}
        
        # Handle status-specific logic
        if new_status == FoodAlert.STATUSES['DELIVERED']:
            update_data['delivery_time'] = datetime.now()
            
            # Make driver available again
            if alert.driver_id:
                driver = Driver.get_by_id(alert.driver_id)
                if driver:
                    driver.update({'is_available': True})
        
        alert.update(update_data)
        
        return jsonify({
            'message': 'Alert status updated successfully',
            'alert': alert.to_dict()
        }), 200
        
    except Exception as e:
        logging.error(f"Error updating alert status: {str(e)}")
        return jsonify({'error': 'Failed to update alert status'}), 500
