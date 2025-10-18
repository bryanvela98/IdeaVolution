import { io, Socket } from 'socket.io-client'

class SocketService {
  private socket: Socket | null = null

  connect() {
    if (!this.socket) {
      this.socket = io('http://localhost:5000', {
        transports: ['websocket', 'polling']
      })
    }
    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  // Restaurant methods
  joinRestaurant(restaurantId: string, callback: (data: any) => void) {
    if (!this.socket) return
    this.socket.emit('join_restaurant', { restaurant_id: restaurantId })
    this.socket.on('restaurant_joined', callback)
  }

  // Food Bank methods
  joinFoodBank(foodbankId: string, callback: (data: any) => void) {
    if (!this.socket) return
    this.socket.emit('join_foodbank', { foodbank_id: foodbankId })
    this.socket.on('foodbank_joined', callback)
  }

  onNewFoodAlert(callback: (alert: any) => void) {
    if (!this.socket) return
    this.socket.on('new_food_alert', callback)
  }

  // Driver methods
  joinDriver(driverId: string, callback: (data: any) => void) {
    if (!this.socket) return
    this.socket.emit('join_driver', { driver_id: driverId })
    this.socket.on('driver_joined', callback)
  }

  onDeliveryRequest(callback: (request: any) => void) {
    if (!this.socket) return
    this.socket.on('delivery_request', callback)
  }

  // Alert status updates
  onAlertStatusUpdate(callback: (data: any) => void) {
    if (!this.socket) return
    this.socket.on('alert_status_update', callback)
  }

  // Response methods
  respondToAlert(alertId: string, action: string, userId: string) {
    if (!this.socket) return
    this.socket.emit('alert_response', {
      alert_id: alertId,
      action: action,
      user_id: userId
    })
  }
}

export const socketService = new SocketService()

