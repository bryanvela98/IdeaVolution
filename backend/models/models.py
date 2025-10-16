from datetime import datetime, timedelta
from typing import Dict, List, Optional
from config.firebase_config import db

class BaseModel:
    """Base model with common Firestore operations"""
    collection_name = None
    
    def __init__(self, data: Dict):
        self.id = data.get('id')
        self.created_at = data.get('created_at', datetime.now())
        self.updated_at = data.get('updated_at', datetime.now())
    
    def to_dict(self) -> Dict:
        """Convert model to dictionary for Firestore"""
        return {
            'id': self.id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @classmethod
    def create(cls, data: Dict):
        """Create new document in Firestore"""
        doc_ref = db.collection(cls.collection_name).document()
        data['id'] = doc_ref.id
        data['created_at'] = datetime.now()
        data['updated_at'] = datetime.now()
        
        instance = cls(data)
        doc_ref.set(instance.to_dict())
        return instance
    
    @classmethod
    def get_by_id(cls, doc_id: str):
        """Get document by ID"""
        doc = db.collection(cls.collection_name).document(doc_id).get()
        if doc.exists:
            return cls(doc.to_dict())
        return None
    
    @classmethod
    def get_all(cls, limit: int = 100):
        """Get all documents"""
        docs = db.collection(cls.collection_name).limit(limit).stream()
        return [cls(doc.to_dict()) for doc in docs]
    
    def update(self, data: Dict):
        """Update document"""
        data['updated_at'] = datetime.now()
        db.collection(self.collection_name).document(self.id).update(data)
        
        # Update instance attributes
        for key, value in data.items():
            setattr(self, key, value)
    
    def delete(self):
        """Delete document"""
        db.collection(self.collection_name).document(self.id).delete()


class Restaurant(BaseModel):
    collection_name = 'restaurants'
    
    def __init__(self, data: Dict):
        super().__init__(data)
        self.name = data.get('name')
        self.email = data.get('email')
        self.phone = data.get('phone')
        self.address = data.get('address')
        self.coordinates = data.get('coordinates', {})  # {lat, lng}
        self.contact_person = data.get('contact_person')
        self.is_active = data.get('is_active', True)
    
    def to_dict(self) -> Dict:
        base_dict = super().to_dict()
        base_dict.update({
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'coordinates': self.coordinates,
            'contact_person': self.contact_person,
            'is_active': self.is_active
        })
        return base_dict


class FoodBank(BaseModel):
    collection_name = 'foodbanks'
    
    def __init__(self, data: Dict):
        super().__init__(data)
        self.name = data.get('name')
        self.email = data.get('email')
        self.phone = data.get('phone')
        self.address = data.get('address')
        self.coordinates = data.get('coordinates', {})  # {lat, lng}
        self.capacity = data.get('capacity', 100)  # Max items they can handle
        self.current_load = data.get('current_load', 0)
        self.contact_person = data.get('contact_person')
        self.is_active = data.get('is_active', True)
    
    def to_dict(self) -> Dict:
        base_dict = super().to_dict()
        base_dict.update({
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'coordinates': self.coordinates,
            'capacity': self.capacity,
            'current_load': self.current_load,
            'contact_person': self.contact_person,
            'is_active': self.is_active
        })
        return base_dict
    
    @property
    def available_capacity(self):
        return self.capacity - self.current_load


class Driver(BaseModel):
    collection_name = 'drivers'
    
    def __init__(self, data: Dict):
        super().__init__(data)
        self.name = data.get('name')
        self.email = data.get('email')
        self.phone = data.get('phone')
        self.license_number = data.get('license_number')
        self.vehicle_type = data.get('vehicle_type')  # car, van, truck
        self.current_location = data.get('current_location', {})  # {lat, lng}
        self.is_available = data.get('is_available', True)
        self.is_active = data.get('is_active', True)
        self.rating = data.get('rating', 5.0)
    
    def to_dict(self) -> Dict:
        base_dict = super().to_dict()
        base_dict.update({
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'license_number': self.license_number,
            'vehicle_type': self.vehicle_type,
            'current_location': self.current_location,
            'is_available': self.is_available,
            'is_active': self.is_active,
            'rating': self.rating
        })
        return base_dict


class FoodAlert(BaseModel):
    collection_name = 'food_alerts'
    
    STATUSES = {
        'PENDING': 'pending',
        'FOODBANK_NOTIFIED': 'foodbank_notified',
        'FOODBANK_ACCEPTED': 'foodbank_accepted',
        'DRIVER_REQUESTED': 'driver_requested',
        'DRIVER_ASSIGNED': 'driver_assigned',
        'IN_TRANSIT': 'in_transit',
        'DELIVERED': 'delivered',
        'EXPIRED': 'expired',
        'CANCELLED': 'cancelled'
    }
    
    def __init__(self, data: Dict):
        super().__init__(data)
        self.restaurant_id = data.get('restaurant_id')
        self.foodbank_id = data.get('foodbank_id')
        self.driver_id = data.get('driver_id')
        self.status = data.get('status', self.STATUSES['PENDING'])
        self.food_items = data.get('food_items', [])  # List of food items
        self.total_quantity = data.get('total_quantity', 0)
        self.pickup_time = data.get('pickup_time')
        self.delivery_time = data.get('delivery_time')
        self.notes = data.get('notes', '')
        self.expires_at = data.get('expires_at')
        self.notified_foodbanks = data.get('notified_foodbanks', [])  # Track escalation
    
    def to_dict(self) -> Dict:
        base_dict = super().to_dict()
        base_dict.update({
            'restaurant_id': self.restaurant_id,
            'foodbank_id': self.foodbank_id,
            'driver_id': self.driver_id,
            'status': self.status,
            'food_items': self.food_items,
            'total_quantity': self.total_quantity,
            'pickup_time': self.pickup_time,
            'delivery_time': self.delivery_time,
            'notes': self.notes,
            'expires_at': self.expires_at,
            'notified_foodbanks': self.notified_foodbanks
        })
        return base_dict
    
    @classmethod
    def get_pending_alerts(cls):
        """Get all pending alerts for escalation"""
        docs = db.collection(cls.collection_name).where(
            'status', '==', cls.STATUSES['PENDING']
        ).stream()
        return [cls(doc.to_dict()) for doc in docs]


class DeliveryRequest(BaseModel):
    collection_name = 'delivery_requests'
    
    def __init__(self, data: Dict):
        super().__init__(data)
        self.alert_id = data.get('alert_id')
        self.driver_id = data.get('driver_id')
        self.pickup_address = data.get('pickup_address')
        self.delivery_address = data.get('delivery_address')
        self.pickup_coordinates = data.get('pickup_coordinates', {})
        self.delivery_coordinates = data.get('delivery_coordinates', {})
        self.estimated_duration = data.get('estimated_duration')  # in minutes
        self.actual_pickup_time = data.get('actual_pickup_time')
        self.actual_delivery_time = data.get('actual_delivery_time')
        self.status = data.get('status', 'assigned')  # assigned, picked_up, delivered
    
    def to_dict(self) -> Dict:
        base_dict = super().to_dict()
        base_dict.update({
            'alert_id': self.alert_id,
            'driver_id': self.driver_id,
            'pickup_address': self.pickup_address,
            'delivery_address': self.delivery_address,
            'pickup_coordinates': self.pickup_coordinates,
            'delivery_coordinates': self.delivery_coordinates,
            'estimated_duration': self.estimated_duration,
            'actual_pickup_time': self.actual_pickup_time,
            'actual_delivery_time': self.actual_delivery_time,
            'status': self.status
        })
        return base_dict
