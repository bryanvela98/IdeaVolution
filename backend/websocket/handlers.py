from flask_socketio import emit, join_room, leave_room, disconnect
from flask import request
from datetime import datetime
import logging

def register_socketio_handlers(socketio):
    """Register all WebSocket event handlers"""
    
    @socketio.on('connect')
    def handle_connect():
        """Handle client connection"""
        logging.info(f"Client connected: {request.sid}")
        emit('connected', {'message': 'Connected to IdeaVolution real-time service'})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection"""
        logging.info(f"Client disconnected: {request.sid}")
    
    @socketio.on('join_restaurant')
    def handle_join_restaurant(data):
        """Restaurant joins their room for notifications"""
        restaurant_id = data.get('restaurant_id')
        if restaurant_id:
            room = f'restaurant_{restaurant_id}'
            join_room(room)
            emit('joined_room', {'room': room, 'type': 'restaurant'})
            logging.info(f"Restaurant {restaurant_id} joined room {room}")
    
    @socketio.on('join_foodbank')
    def handle_join_foodbank(data):
        """Food bank joins their room for notifications"""
        foodbank_id = data.get('foodbank_id')
        if foodbank_id:
            room = f'foodbank_{foodbank_id}'
            join_room(room)
            emit('joined_room', {'room': room, 'type': 'foodbank'})
            logging.info(f"Food bank {foodbank_id} joined room {room}")
    
    @socketio.on('join_driver')
    def handle_join_driver(data):
        """Driver joins their room for notifications"""
        driver_id = data.get('driver_id')
        if driver_id:
            room = f'driver_{driver_id}'
            join_room(room)
            emit('joined_room', {'room': room, 'type': 'driver'})
            logging.info(f"Driver {driver_id} joined room {room}")
    
    @socketio.on('leave_room')
    def handle_leave_room(data):
        """Leave a specific room"""
        room = data.get('room')
        if room:
            leave_room(room)
            emit('left_room', {'room': room})
            logging.info(f"Client left room {room}")
    
    @socketio.on('ping')
    def handle_ping():
        """Handle ping for connection testing"""
        emit('pong', {'timestamp': str(datetime.now())})
    
    @socketio.on('foodbank_response')
    def handle_foodbank_response(data):
        """Handle food bank response to alert"""
        from services.notification_service import get_notification_service
        
        alert_id = data.get('alert_id')
        response = data.get('response')  # 'accept' or 'decline'
        foodbank_id = data.get('foodbank_id')
        
        if not all([alert_id, response, foodbank_id]):
            emit('error', {'message': 'Missing required fields'})
            return
        
        if response == 'accept':
            # Cancel escalation timer
            notification_service = get_notification_service()
            if notification_service:
                notification_service.cancel_escalation_timer(alert_id)
            
            emit('response_received', {
                'alert_id': alert_id,
                'status': 'accepted',
                'message': 'Alert accepted successfully'
            })
        elif response == 'decline':
            emit('response_received', {
                'alert_id': alert_id,
                'status': 'declined',
                'message': 'Alert declined'
            })
        
        logging.info(f"Food bank {foodbank_id} {response}d alert {alert_id}")
    
    @socketio.on('driver_response')
    def handle_driver_response(data):
        """Handle driver response to delivery request"""
        alert_id = data.get('alert_id')
        response = data.get('response')  # 'accept' or 'decline'
        driver_id = data.get('driver_id')
        
        if not all([alert_id, response, driver_id]):
            emit('error', {'message': 'Missing required fields'})
            return
        
        if response == 'accept':
            emit('response_received', {
                'alert_id': alert_id,
                'status': 'accepted',
                'message': 'Delivery request accepted'
            })
        elif response == 'decline':
            emit('response_received', {
                'alert_id': alert_id,
                'status': 'declined',
                'message': 'Delivery request declined'
            })
        
        logging.info(f"Driver {driver_id} {response}d delivery request for alert {alert_id}")
    
    @socketio.on('location_update')
    def handle_location_update(data):
        """Handle real-time location updates from drivers"""
        driver_id = data.get('driver_id')
        location = data.get('location')  # {lat, lng}
        alert_id = data.get('alert_id')
        
        if driver_id and location:
            # Broadcast location update to relevant parties
            if alert_id:
                # Notify restaurant and food bank about driver location
                socketio.emit('driver_location_update', {
                    'driver_id': driver_id,
                    'location': location,
                    'alert_id': alert_id
                }, room=f'alert_{alert_id}')
            
            logging.info(f"Location update from driver {driver_id}: {location}")

    return socketio
