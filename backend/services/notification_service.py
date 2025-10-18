from flask_socketio import emit, join_room, leave_room
from models.models import FoodAlert, FoodBank, Driver, Restaurant
from services.geocoding_service import geocoding_service
from datetime import datetime, timedelta
import threading
import time
import logging

class NotificationService:
    def __init__(self, socketio):
        self.socketio = socketio
        self.active_timers = {}  # Track active escalation timers
        
    def notify_nearby_foodbanks(self, alert_id):
        """Notify food banks about new alert"""
        try:
            alert = FoodAlert.get_by_id(alert_id)
            if not alert:
                return
            
            # Get restaurant for address
            restaurant = None
            if alert.restaurant_id:
                restaurant = Restaurant.get_by_id(alert.restaurant_id)
            
            if not restaurant or not restaurant.address:
                logging.warning(f"No restaurant address found for alert {alert_id}")
                # Fallback to first available food bank
                foodbanks = FoodBank.get_all()
                active_foodbanks = [fb for fb in foodbanks if fb.is_active]
                if active_foodbanks:
                    first_foodbank = active_foodbanks[0]
                else:
                    logging.warning(f"No active food banks found for alert {alert_id}")
                    return
            else:
                # Get nearby food banks using geocoding
                foodbanks = FoodBank.get_all()
                active_foodbanks = [fb for fb in foodbanks if fb.is_active and fb.address]
                
                if not active_foodbanks:
                    logging.warning(f"No active food banks with addresses found for alert {alert_id}")
                    return
                
                # Find nearest food banks
                nearest_foodbanks = geocoding_service.find_nearest_foodbanks(
                    restaurant.address, 
                    active_foodbanks, 
                    max_results=5
                )
                
                if not nearest_foodbanks:
                    logging.warning(f"Could not find nearby food banks for alert {alert_id}")
                    return
                
                # Get the closest food bank
                first_foodbank, distance = nearest_foodbanks[0]
                logging.info(f"Selected closest food bank {first_foodbank.id} at {distance:.2f} km distance")
            
            # Enrich alert with restaurant details
            alert_dict = alert.to_dict()
            if alert.restaurant_id:
                restaurant = Restaurant.get_by_id(alert.restaurant_id)
                if restaurant:
                    alert_dict['restaurant_name'] = restaurant.name
                    alert_dict['restaurant_address'] = restaurant.address
                    alert_dict['restaurant_phone'] = restaurant.phone
                    alert_dict['restaurant_email'] = restaurant.email
            
            notification_data = {
                'alert_id': alert_id,
                'alert': alert_dict,
                'message': f'New food available from {restaurant.name if restaurant else "restaurant"}',
                'expires_in_minutes': 10
            }
            
            # Send real-time notification to food bank
            self.socketio.emit(
                'new_food_alert',
                notification_data,
                room=f'foodbank_{first_foodbank.id}'
            )
            
            # Update alert with notified food bank
            notified_list = alert.notified_foodbanks or []
            notified_list.append(first_foodbank.id)
            alert.update({
                'notified_foodbanks': notified_list,
                'status': FoodAlert.STATUSES['FOODBANK_NOTIFIED']
            })
            
            # Start escalation timer (10 minutes)
            self.start_escalation_timer(alert_id, first_foodbank.id)
            
            logging.info(f"Notified food bank {first_foodbank.id} about alert {alert_id}")
            
        except Exception as e:
            logging.error(f"Error notifying food banks: {str(e)}")
    
    def start_escalation_timer(self, alert_id, current_foodbank_id):
        """Start timer to escalate to next food bank if no response"""
        def escalate():
            time.sleep(600)  # Wait 10 minutes (600 seconds)
            
            try:
                alert = FoodAlert.get_by_id(alert_id)
                if not alert:
                    return
                
                # Check if alert is still pending
                if alert.status == FoodAlert.STATUSES['FOODBANK_NOTIFIED']:
                    self.escalate_to_next_foodbank(alert_id)
                    
            except Exception as e:
                logging.error(f"Error in escalation timer: {str(e)}")
            finally:
                # Remove timer from active timers
                if alert_id in self.active_timers:
                    del self.active_timers[alert_id]
        
        # Store timer reference
        timer = threading.Thread(target=escalate)
        timer.daemon = True
        self.active_timers[alert_id] = timer
        timer.start()
    
    def escalate_to_next_foodbank(self, alert_id):
        """Escalate alert to the next available food bank"""
        try:
            alert = FoodAlert.get_by_id(alert_id)
            if not alert:
                return
            
            # Get restaurant for address
            restaurant = None
            if alert.restaurant_id:
                restaurant = Restaurant.get_by_id(alert.restaurant_id)
            
            # Get all food banks
            foodbanks = FoodBank.get_all()
            active_foodbanks = [fb for fb in foodbanks if fb.is_active]
            
            # Find next food bank that hasn't been notified
            notified_ids = alert.notified_foodbanks or []
            available_foodbanks = [fb for fb in active_foodbanks if fb.id not in notified_ids]
            
            if not available_foodbanks:
                # No more food banks available, mark as expired
                alert.update({'status': FoodAlert.STATUSES['EXPIRED']})
                logging.warning(f"Alert {alert_id} expired - no more food banks available")
                return
            
            # Use distance-based selection if restaurant address is available
            if restaurant and restaurant.address:
                foodbanks_with_address = [fb for fb in available_foodbanks if fb.address]
                if foodbanks_with_address:
                    # Find nearest available food banks
                    nearest_foodbanks = geocoding_service.find_nearest_foodbanks(
                        restaurant.address, 
                        foodbanks_with_address, 
                        max_results=len(foodbanks_with_address)
                    )
                    if nearest_foodbanks:
                        next_foodbank, distance = nearest_foodbanks[0]
                        logging.info(f"Selected next closest food bank {next_foodbank.id} at {distance:.2f} km distance")
                    else:
                        next_foodbank = available_foodbanks[0]
                else:
                    next_foodbank = available_foodbanks[0]
            else:
                # Fallback to first available
                next_foodbank = available_foodbanks[0]
            
            # Enrich alert with restaurant details
            alert_dict = alert.to_dict()
            if alert.restaurant_id:
                restaurant = Restaurant.get_by_id(alert.restaurant_id)
                if restaurant:
                    alert_dict['restaurant_name'] = restaurant.name
                    alert_dict['restaurant_address'] = restaurant.address
                    alert_dict['restaurant_phone'] = restaurant.phone
                    alert_dict['restaurant_email'] = restaurant.email
            
            # Notify next food bank
            notification_data = {
                'alert_id': alert_id,
                'alert': alert_dict,
                'message': f'Escalated food alert - Previous food bank did not respond',
                'expires_in_minutes': 10,
                'is_escalated': True
            }
            
            self.socketio.emit(
                'new_food_alert',
                notification_data,
                room=f'foodbank_{next_foodbank.id}'
            )
            
            # Update alert
            notified_list = alert.notified_foodbanks or []
            notified_list.append(next_foodbank.id)
            alert.update({'notified_foodbanks': notified_list})
            
            # Start new escalation timer
            self.start_escalation_timer(alert_id, next_foodbank.id)
            
            logging.info(f"Escalated alert {alert_id} to food bank {next_foodbank.id}")
            
        except Exception as e:
            logging.error(f"Error escalating alert: {str(e)}")
    
    def notify_available_drivers(self, alert_id):
        """Notify available drivers about delivery request"""
        try:
            alert = FoodAlert.get_by_id(alert_id)
            if not alert:
                return
            
            # Get available drivers
            drivers = Driver.get_all()
            available_drivers = [d for d in drivers if d.is_available and d.is_active]
            
            if not available_drivers:
                logging.warning(f"No available drivers for alert {alert_id}")
                return
            
            # Enrich alert with restaurant details
            alert_dict = alert.to_dict()
            if alert.restaurant_id:
                restaurant = Restaurant.get_by_id(alert.restaurant_id)
                if restaurant:
                    alert_dict['restaurant_name'] = restaurant.name
                    alert_dict['restaurant_address'] = restaurant.address
                    alert_dict['restaurant_phone'] = restaurant.phone
                    alert_dict['restaurant_email'] = restaurant.email
            
            notification_data = {
                'alert_id': alert_id,
                'alert': alert_dict,
                'message': 'New delivery request available',
                'estimated_duration': 30
            }
            
            # Notify all available drivers
            for driver in available_drivers:
                self.socketio.emit(
                    'delivery_request',
                    notification_data,
                    room=f'driver_{driver.id}'
                )
            
            # Update alert status
            alert.update({'status': FoodAlert.STATUSES['DRIVER_REQUESTED']})
            
            logging.info(f"Notified {len(available_drivers)} drivers about alert {alert_id}")
            
        except Exception as e:
            logging.error(f"Error notifying drivers: {str(e)}")
    
    def cancel_escalation_timer(self, alert_id):
        """Cancel escalation timer when food bank accepts"""
        if alert_id in self.active_timers:
            # Note: We can't actually stop a sleeping thread, but we check alert status
            # in the escalation function, so it will exit gracefully
            del self.active_timers[alert_id]
            logging.info(f"Cancelled escalation timer for alert {alert_id}")
    
    def notify_assigned_driver(self, alert_id, driver_id, delivery_request):
        """Notify a specific driver that they've been assigned to a delivery"""
        try:
            alert = FoodAlert.get_by_id(alert_id)
            if not alert:
                logging.error(f"Alert {alert_id} not found for driver notification")
                return
            
            # Enrich alert with restaurant details
            alert_dict = alert.to_dict()
            if alert.restaurant_id:
                restaurant = Restaurant.get_by_id(alert.restaurant_id)
                if restaurant:
                    alert_dict['restaurant_name'] = restaurant.name
                    alert_dict['restaurant_address'] = restaurant.address
                    alert_dict['restaurant_phone'] = restaurant.phone
                    alert_dict['restaurant_email'] = restaurant.email
            
            notification_data = {
                'alert_id': alert_id,
                'alert': alert_dict,
                'delivery_request': delivery_request.to_dict() if delivery_request else {},
                'message': 'New delivery assigned to you',
                'estimated_duration': 30
            }
            
            # Notify the specific driver
            self.socketio.emit(
                'delivery_request',
                notification_data,
                room=f'driver_{driver_id}'
            )
            
            logging.info(f"Notified driver {driver_id} about assignment for alert {alert_id}")
            
        except Exception as e:
            logging.error(f"Error notifying assigned driver: {str(e)}")

# Global notification service instance
notification_service = None

def init_notification_service(socketio):
    """Initialize the notification service with socketio instance"""
    global notification_service
    notification_service = NotificationService(socketio)
    return notification_service

def get_notification_service():
    """Get the global notification service instance"""
    return notification_service
