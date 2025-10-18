export type UserRole = "restaurant" | "foodbank" | "driver" | null

export interface FoodAlert {
  id: string
  restaurant_id: string
  foodbank_id?: string
  driver_id?: string
  food_items: FoodItem[]
  total_quantity: number
  status: AlertStatus
  created_at: string
  expires_at: string
  pickup_time?: string
  delivery_time?: string
  notes?: string
  restaurant_name?: string
  restaurant_address?: string
  restaurant_phone?: string
  restaurant_email?: string
  foodbank_name?: string
  foodbank_address?: string
  foodbank_phone?: string
  foodbank_email?: string
  driver_name?: string
  driver_phone?: string
  driver_email?: string
  driver_vehicle_type?: string
  notified_foodbanks?: string[]
}

export interface FoodItem {
  name: string
  quantity: number
  unit: string
}

export interface Restaurant {
  id: string
  name: string
  email: string
  phone: string
  address: string
  coordinates?: { lat: number; lng: number }
  contact_person?: string
  is_active: boolean
  created_at: string
}

export interface FoodBank {
  id: string
  name: string
  email: string
  phone: string
  address: string
  coordinates?: { lat: number; lng: number }
  capacity: number
  current_load: number
  contact_person?: string
  is_active: boolean
  created_at: string
}

export interface Driver {
  id: string
  name: string
  email: string
  phone: string
  vehicle_type: string
  is_available: boolean
  is_active: boolean
  rating?: number
  created_at: string
}

export interface DeliveryRequest {
  id: string
  alert_id: string
  driver_id: string
  pickup_address: string
  delivery_address: string
  pickup_coordinates?: { lat: number; lng: number }
  delivery_coordinates?: { lat: number; lng: number }
  estimated_duration: number
  status: string
  created_at: string
}

export interface AuthResponse {
  uid: string
  token: string
  message: string
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  address: string
  phone?: string
  vehicle_type?: string // for drivers
  capacity?: number // for food banks
}

export interface Notification {
  id: string
  type: string
  message: string
  timestamp: string
  read: boolean
}

export type AlertStatus = 
  | "pending"
  | "foodbank_notified"
  | "foodbank_accepted"
  | "driver_requested"
  | "driver_assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "expired"
  | "cancelled"

export type FoodItemUnit = "servings" | "kg" | "lbs" | "pieces" | "loaves" | "portions" | "meals" | "items"

// Distance calculation types
export interface DistanceRequest {
  address1: string
  address2: string
}

export interface DistanceResponse {
  coordinates1: {
    latitude: number
    longitude: number
  }
  coordinates2: {
    latitude: number
    longitude: number
  }
  distance_km: number
  distance_miles: number
  success: boolean
}

// Map marker types
export interface MapMarker {
  id: string
  position: {
    lat: number
    lng: number
  }
  title: string
  address: string
  type: 'restaurant' | 'foodbank'
  alertId?: string
}

