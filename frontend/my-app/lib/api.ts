const API_BASE_URL = 'http://localhost:5000/api'

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

// API client functions
export const utilityAPI = {
  calculateDistance: async (request: DistanceRequest): Promise<DistanceResponse> => {
    const response = await fetch(`${API_BASE_URL}/utility/distance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Distance calculation failed' }))
      throw new Error(errorData.error || 'Distance calculation failed')
    }
    
    return response.json()
  }
}

export const alertAPI = {
  create: async (data: any, token: string): Promise<{ alert: FoodAlert }> => {
    const response = await fetch(`${API_BASE_URL}/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to create alert' }))
      throw new Error(errorData.error || 'Failed to create alert')
    }
    
    return response.json()
  },

  getAll: async (filters: {
    status?: string
    restaurant_id?: string
    foodbank_id?: string
    driver_id?: string
  }, token: string): Promise<{ alerts: FoodAlert[] }> => {
    const params = new URLSearchParams()
    if (filters.status) params.append('status', filters.status)
    if (filters.restaurant_id) params.append('restaurant_id', filters.restaurant_id)
    if (filters.foodbank_id) params.append('foodbank_id', filters.foodbank_id)
    if (filters.driver_id) params.append('driver_id', filters.driver_id)
    
    const response = await fetch(`${API_BASE_URL}/alerts?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch alerts' }))
      throw new Error(errorData.error || 'Failed to fetch alerts')
    }
    
    return response.json()
  },

  accept: async (alertId: string, foodbankId: string, token: string): Promise<{ alert: FoodAlert }> => {
    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ foodbank_id: foodbankId })
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to accept alert' }))
      throw new Error(errorData.error || 'Failed to accept alert')
    }
    
    return response.json()
  },

  assignDriver: async (alertId: string, driverId: string, token: string): Promise<{ alert: FoodAlert }> => {
    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/assign-driver`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ driver_id: driverId })
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to assign driver' }))
      throw new Error(errorData.error || 'Failed to assign driver')
    }
    
    return response.json()
  },

  updateStatus: async (alertId: string, status: string, token: string): Promise<{ alert: FoodAlert }> => {
    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to update status' }))
      throw new Error(errorData.error || 'Failed to update status')
    }
    
    return response.json()
  }
}

export const driverAPI = {
  getAvailable: async (token: string): Promise<{ drivers: Driver[] }> => {
    const response = await fetch(`${API_BASE_URL}/drivers/available`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch drivers' }))
      throw new Error(errorData.error || 'Failed to fetch drivers')
    }
    
    return response.json()
  },

  updateAvailability: async (driverId: string, isAvailable: boolean, token: string): Promise<{ driver: Driver }> => {
    const response = await fetch(`${API_BASE_URL}/drivers/${driverId}/availability`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ is_available: isAvailable })
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to update availability' }))
      throw new Error(errorData.error || 'Failed to update availability')
    }
    
    return response.json()
  }
}

