"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { UtensilsCrossed, Building2, Truck, ArrowLeft, Clock, CheckCircle, AlertCircle, Loader2, Plus, Minus, RefreshCcw } from "lucide-react"
import { UserRole, FoodAlert, FoodItem, Driver, AlertStatus } from "@/lib/types"
import { alertAPI, driverAPI } from "@/lib/api"
import { socketService } from "@/lib/socket"
import RegisterForm from "@/components/RegisterForm"

export default function FoodConnectNS() {
  // Auth state
  const [selectedRole, setSelectedRole] = useState<UserRole>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Restaurant state
  const [restaurantAlerts, setRestaurantAlerts] = useState<FoodAlert[]>([])
  const [foodItems, setFoodItems] = useState<FoodItem[]>([{ name: "", quantity: 1, unit: "servings" }])
  const [alertNotes, setAlertNotes] = useState("")
  const [pickupTime, setPickupTime] = useState("")

  // Food Bank state
  const [availableAlerts, setAvailableAlerts] = useState<FoodAlert[]>([])
  const [acceptedAlerts, setAcceptedAlerts] = useState<FoodAlert[]>([])
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([])

  // Driver state
  const [driverAlerts, setDriverAlerts] = useState<FoodAlert[]>([])
  const [isAvailable, setIsAvailable] = useState(true)

  // Real-time notifications
  const [notifications, setNotifications] = useState<string[]>([])

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Initialize WebSocket connection on login
  useEffect(() => {
    if (isLoggedIn && userId && selectedRole) {
      // Connect to WebSocket
      socketService.connect()

      // Join appropriate room based on role
      if (selectedRole === "restaurant") {
        socketService.joinRestaurant(userId, (data) => {
          console.log("Joined restaurant room:", data)
        })
      } else if (selectedRole === "foodbank") {
        socketService.joinFoodBank(userId, (data) => {
          console.log("Joined food bank room:", data)
        })

        // Listen for new food alerts
        socketService.onNewFoodAlert((alert) => {
          console.log("🔔 New food alert received:", alert)
          setNotifications(prev => [...prev, `New food available from ${alert.restaurant_name || 'a restaurant'}!`])
          setAvailableAlerts(prev => [alert, ...prev])
        })
      } else if (selectedRole === "driver") {
        socketService.joinDriver(userId, (data) => {
          console.log("Joined driver room:", data)
        })

        // Listen for delivery requests
        socketService.onDeliveryRequest((request) => {
          console.log("🚚 New delivery request received via WebSocket:", request)
          setNotifications(prev => [...prev, "New delivery request assigned to you!"])
          console.log("Refreshing driver alerts after delivery assignment...")
          fetchDriverAlerts()
        })
      }

      // Listen for alert status updates (all roles)
      socketService.onAlertStatusUpdate((data: any) => {
        console.log("Alert status updated:", data)
        
        if (selectedRole === "restaurant") {
          setRestaurantAlerts(prev =>
            prev.map(alert =>
              alert.id === data.alert_id ? { ...alert, status: data.status as AlertStatus } : alert
            )
          )
        } else if (selectedRole === "foodbank") {
          setAcceptedAlerts(prev =>
            prev.map(alert =>
              alert.id === data.alert_id ? { ...alert, status: data.status as AlertStatus } : alert
            )
          )
        } else if (selectedRole === "driver") {
          setDriverAlerts(prev =>
            prev.map(alert =>
              alert.id === data.alert_id ? { ...alert, status: data.status as AlertStatus } : alert
            )
          )
        }
      })

      // Fetch initial data
      fetchData()

      return () => {
        socketService.disconnect()
      }
    }
  }, [isLoggedIn, userId, selectedRole])

  // Fetch data based on role
  const fetchData = async () => {
    if (!token || !userId) return

    setIsLoading(true)
    try {
      if (selectedRole === "restaurant") {
        await fetchRestaurantAlerts()
      } else if (selectedRole === "foodbank") {
        await fetchAvailableAlerts()
        await fetchAcceptedAlerts()
        await fetchAvailableDrivers()
      } else if (selectedRole === "driver") {
        await fetchDriverAlerts()
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch data")
    } finally {
      setIsLoading(false)
    }
  }

  // Restaurant: Fetch all alerts created by this restaurant
  const fetchRestaurantAlerts = async () => {
    if (!token || !userId) return
    try {
      const response = await alertAPI.getAll({ restaurant_id: userId }, token)
      setRestaurantAlerts(response.alerts || [])
    } catch (err: any) {
      console.error("Error fetching restaurant alerts:", err)
      setRestaurantAlerts([])
    }
  }

  // Food Bank: Fetch available alerts (pending status)
  const fetchAvailableAlerts = async () => {
    if (!token) return
    try {
      const response = await alertAPI.getAll({ status: "pending" }, token)
      setAvailableAlerts(response.alerts || [])
    } catch (err: any) {
      console.error("Error fetching available alerts:", err)
      setAvailableAlerts([])
    }
  }

  // Food Bank: Fetch alerts accepted by this food bank
  const fetchAcceptedAlerts = async () => {
    if (!token || !userId) return
    try {
      const response = await alertAPI.getAll({ foodbank_id: userId }, token)
      setAcceptedAlerts(response.alerts || [])
    } catch (err: any) {
      console.error("Error fetching accepted alerts:", err)
      setAcceptedAlerts([])
    }
  }

  // Food Bank: Fetch available drivers
  const fetchAvailableDrivers = async () => {
    if (!token) return
    try {
      const response = await driverAPI.getAvailable(token)
      setAvailableDrivers(response.drivers || [])
    } catch (err: any) {
      console.error("Error fetching available drivers:", err)
      setAvailableDrivers([]) // Set empty array on error to prevent undefined
    }
  }

  // Driver: Fetch alerts assigned to this driver
  const fetchDriverAlerts = async () => {
    if (!token || !userId) {
      console.log("Cannot fetch driver alerts: missing token or userId", { token: !!token, userId })
      return
    }
    try {
      console.log("Fetching driver alerts for driver:", userId)
      // Fetch alerts filtered by driver_id
      const response = await alertAPI.getAll({ driver_id: userId }, token)
      console.log("Driver alerts fetched:", response.alerts?.length || 0, "alerts", response.alerts)
      setDriverAlerts(response.alerts || [])
    } catch (err: any) {
      console.error("Error fetching driver alerts:", err)
      setDriverAlerts([])
    }
  }

  const handleLoginSuccess = (uid: string, authToken: string) => {
    setUserId(uid)
    setToken(authToken)
    setIsLoggedIn(true)
  }

  const handleReset = () => {
    socketService.disconnect()
    setSelectedRole(null)
    setIsLoggedIn(false)
    setUserId(null)
    setToken(null)
    setRestaurantAlerts([])
    setAvailableAlerts([])
    setAcceptedAlerts([])
    setDriverAlerts([])
    setFoodItems([{ name: "", quantity: 1, unit: "servings" }])
    setAlertNotes("")
    setPickupTime("")
    setNotifications([])
    setError(null)
    setSuccessMessage(null)
  }

  // Restaurant: Add food item to form
  const addFoodItem = () => {
    setFoodItems([...foodItems, { name: "", quantity: 1, unit: "servings" }])
  }

  // Restaurant: Remove food item from form
  const removeFoodItem = (index: number) => {
    if (foodItems.length > 1) {
      setFoodItems(foodItems.filter((_, i) => i !== index))
    }
  }

  // Restaurant: Update food item
  const updateFoodItem = (index: number, field: keyof FoodItem, value: string | number) => {
    const updated = [...foodItems]
    updated[index] = { ...updated[index], [field]: value }
    setFoodItems(updated)
  }

  // Restaurant: Create food alert
  const handleCreateAlert = async () => {
    if (!token || !userId) return

    // Validation
    const validItems = foodItems.filter(item => item.name && item.quantity > 0)
    if (validItems.length === 0) {
      setError("Please add at least one food item")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await alertAPI.create(
        {
          restaurant_id: userId,
          food_items: validItems,
          notes: alertNotes || undefined,
          pickup_time: pickupTime || undefined,
        },
        token
      )

      setSuccessMessage("Food alert created successfully! Nearby food banks will be notified.")
      
      // Reset form
      setFoodItems([{ name: "", quantity: 1, unit: "servings" }])
      setAlertNotes("")
      setPickupTime("")

      // Refresh alerts
      await fetchRestaurantAlerts()
    } catch (err: any) {
      setError(err.message || "Failed to create alert")
    } finally {
      setIsLoading(false)
    }
  }

  // Food Bank: Accept an alert
  const handleAcceptAlert = async (alertId: string) => {
    if (!token || !userId) return

    setIsLoading(true)
    setError(null)

    try {
      await alertAPI.accept(alertId, userId, token)
      
      setSuccessMessage("Alert accepted! You can now assign a driver.")
      
      // Update local state
      const acceptedAlert = availableAlerts.find(a => a.id === alertId)
      if (acceptedAlert) {
        setAvailableAlerts(prev => prev.filter(a => a.id !== alertId))
        setAcceptedAlerts(prev => [{ ...acceptedAlert, status: "foodbank_accepted", foodbank_id: userId }, ...prev])
      }

      // Emit WebSocket event
      socketService.respondToAlert(alertId, "accept", userId)
    } catch (err: any) {
      setError(err.message || "Failed to accept alert")
    } finally {
      setIsLoading(false)
    }
  }

  // Food Bank: Assign driver to alert
  const handleAssignDriver = async (alertId: string, driverId: string) => {
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      console.log("Assigning driver:", { alertId, driverId })
      await alertAPI.assignDriver(alertId, driverId, token)
      console.log("Driver assigned successfully via API")
      
      setSuccessMessage("Driver assigned successfully!")
      
      // Refresh data
      await fetchAcceptedAlerts()
      await fetchAvailableDrivers()
    } catch (err: any) {
      setError(err.message || "Failed to assign driver")
    } finally {
      setIsLoading(false)
    }
  }

  // Driver: Update alert status
  const handleUpdateStatus = async (alertId: string, newStatus: string) => {
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      await alertAPI.updateStatus(alertId, newStatus, token)
      
      setSuccessMessage(`Status updated to: ${newStatus}`)
      
      // Update local state
      setDriverAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId ? { ...alert, status: newStatus as AlertStatus } : alert
        )
      )
    } catch (err: any) {
      setError(err.message || "Failed to update status")
    } finally {
      setIsLoading(false)
    }
  }

  // Driver: Toggle availability
  const handleToggleAvailability = async () => {
    if (!token || !userId) return

    setIsLoading(true)
    try {
      await driverAPI.updateAvailability(userId, !isAvailable, token)
      setIsAvailable(!isAvailable)
      setSuccessMessage(`You are now ${!isAvailable ? 'available' : 'unavailable'}`)
    } catch (err: any) {
      setError(err.message || "Failed to update availability")
    } finally {
      setIsLoading(false)
    }
  }

  // Format time remaining for 10-minute timer
  const getTimeRemaining = (createdAt: string): string => {
    const created = new Date(createdAt)
    const now = new Date()
    const tenMinutes = 10 * 60 * 1000
    const elapsed = now.getTime() - created.getTime()
    const remaining = tenMinutes - elapsed

    if (remaining <= 0) return "Escalated"

    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Get status badge color
  const getStatusBadgeVariant = (status: AlertStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "pending":
        return "outline"
      case "foodbank_accepted":
      case "driver_assigned":
        return "secondary"
      case "picked_up":
      case "in_transit":
        return "default"
      case "delivered":
        return "default"
      case "expired":
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Role Selection Screen
  if (!selectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-8 text-center">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-balance text-foreground">FoodConnectNS</h1>
            <p className="text-lg md:text-xl text-muted-foreground text-balance">Reducing Waste, Feeding Nova Scotia</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 pt-8">
            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2"
              onClick={() => setSelectedRole("restaurant")}
            >
              <CardHeader className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <UtensilsCrossed className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">I'm a Donor</CardTitle>
                <CardDescription className="text-base">Donate surplus food to those in need</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2"
              onClick={() => setSelectedRole("foodbank")}
            >
              <CardHeader className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-secondary" />
                </div>
                <CardTitle className="text-xl">I'm a Food Bank</CardTitle>
                <CardDescription className="text-base">Request food donations for your community</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2"
              onClick={() => setSelectedRole("driver")}
            >
              <CardHeader className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                  <Truck className="w-8 h-8 text-accent" />
                </div>
                <CardTitle className="text-xl">I'm a Driver</CardTitle>
                <CardDescription className="text-base">Deliver food from donors to recipients</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Login/Register Screen
  if (!isLoggedIn) {
    return (
      <RegisterForm
        role={selectedRole}
        onSuccess={handleLoginSuccess}
        onBack={handleReset}
      />
    )
  }

  // Show notifications
  const NotificationBanner = () => {
    if (notifications.length === 0) return null
    
    return (
      <div className="mb-4 space-y-2">
        {notifications.slice(-3).map((notif, index) => (
          <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">{notif}</span>
            </div>
            <button
              onClick={() => setNotifications(prev => prev.filter((_, i) => i !== index))}
              className="text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
            </div>
        ))}
      </div>
    )
  }

  // Success/Error Messages
  const MessageBanner = () => (
    <>
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-800">{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}
    </>
  )

  // Restaurant Dashboard
  if (selectedRole === "restaurant") {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Donor Dashboard</h1>
              <p className="text-muted-foreground">Manage your food donations</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fetchRestaurantAlerts()}
                disabled={isLoading}
                title="Refresh alerts"
              >
                <RefreshCcw className="w-4 h-4" />
              </Button>
            <Button variant="outline" onClick={handleReset}>
              <ArrowLeft className="w-4 h-4 mr-2" />
                Logout
            </Button>
            </div>
          </div>

          <NotificationBanner />
          <MessageBanner />

          <Card>
            <CardHeader>
              <CardTitle>Create Food Alert</CardTitle>
              <CardDescription>Share surplus food with the community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Food Items</Label>
                  <Button onClick={addFoodItem} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {foodItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-10 space-y-2">
                      <Label htmlFor={`item-name-${index}`}>Item Name</Label>
                      <Input
                        id={`item-name-${index}`}
                        placeholder="e.g., Fresh Bread, 20 loaves"
                        value={item.name}
                        onChange={(e) => updateFoodItem(index, "name", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor={`item-quantity-${index}`}>Quantity</Label>
                  <Input
                        id={`item-quantity-${index}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateFoodItem(index, "quantity", parseInt(e.target.value) || 1)}
                  />
                </div>
                    {foodItems.length > 1 && (
                      <div className="col-span-12">
                        <Button
                          onClick={() => removeFoodItem(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                        >
                          <Minus className="w-4 h-4 mr-2" />
                          Remove Item
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickupTime">Pickup Time (Optional)</Label>
                <Input
                  id="pickupTime"
                  type="datetime-local"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Description (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional details about the food..."
                  value={alertNotes}
                  onChange={(e) => setAlertNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button onClick={handleCreateAlert} className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Alert...
                  </>
                ) : (
                  "Create Food Alert"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Food Alerts</CardTitle>
              <CardDescription>Track the status of your donations</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && restaurantAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : restaurantAlerts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No alerts created yet</p>
              ) : (
              <div className="space-y-3">
                  {restaurantAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                    <div className="space-y-1">
                          <p className="font-semibold text-foreground">
                            {alert.food_items && alert.food_items.length > 0
                              ? alert.food_items.map(item => `${item.quantity}x ${item.name}`).join(", ")
                              : "Food items not available"}
                          </p>
                      <p className="text-sm text-muted-foreground">
                            Total: {alert.total_quantity || 0} servings
                          </p>
                          {alert.notes && (
                            <p className="text-sm text-muted-foreground">{alert.notes}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={getStatusBadgeVariant(alert.status)}>
                            {alert.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {alert.status === "pending" && (
                            <div className="flex items-center gap-1 text-xs text-orange-600">
                              <Clock className="w-3 h-3" />
                              {getTimeRemaining(alert.created_at)}
                            </div>
                          )}
                        </div>
                      </div>
                  </div>
                ))}
              </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Food Bank Dashboard
  if (selectedRole === "foodbank") {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Food Bank Dashboard</h1>
              <p className="text-muted-foreground">Browse and request available food</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  await fetchAvailableAlerts()
                  await fetchAcceptedAlerts()
                  await fetchAvailableDrivers()
                }}
                disabled={isLoading}
                title="Refresh all data"
              >
                <RefreshCcw className="w-4 h-4" />
              </Button>
            <Button variant="outline" onClick={handleReset}>
              <ArrowLeft className="w-4 h-4 mr-2" />
                Logout
            </Button>
            </div>
          </div>

          <NotificationBanner />
          <MessageBanner />

          <Card>
            <CardHeader>
              <CardTitle>Available Food Alerts</CardTitle>
              <CardDescription>Accept alerts within 10 minutes to prevent escalation</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && availableAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : availableAlerts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No available alerts at the moment</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {availableAlerts.map((alert) => (
                    <Card key={alert.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{alert.restaurant_name || "Restaurant"}</CardTitle>
                            <CardDescription>{alert.restaurant_address || "Address not provided"}</CardDescription>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-orange-600 font-semibold">
                            <Clock className="w-4 h-4" />
                            {getTimeRemaining(alert.created_at)}
                          </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Food Items:</p>
                          {alert.food_items && alert.food_items.length > 0 ? (
                            <ul className="text-sm text-muted-foreground list-disc list-inside">
                              {alert.food_items.map((item, index) => (
                                <li key={index}>
                                  {item.quantity}x {item.name}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">No items listed</p>
                          )}
                          <p className="text-sm font-medium pt-2">
                            Total: {alert.total_quantity || 0} servings
                          </p>
                          {alert.notes && (
                            <p className="text-sm text-muted-foreground pt-1">{alert.notes}</p>
                          )}
                      </div>
                        <Button 
                          className="w-full" 
                          onClick={() => handleAcceptAlert(alert.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Accepting...
                            </>
                          ) : (
                            "Accept Alert"
                          )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              )}
            </CardContent>
          </Card>

          {acceptedAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Accepted Alerts</CardTitle>
                <CardDescription>Assign drivers to complete deliveries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {acceptedAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{alert.restaurant_name || "Restaurant"}</p>
                        <p className="text-sm text-muted-foreground">
                            {alert.food_items && alert.food_items.length > 0 
                              ? alert.food_items.map(item => `${item.quantity}x ${item.name}`).join(", ")
                              : "Food items not available"}
                        </p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(alert.status)}>
                          {alert.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>

                      {alert.status === "foodbank_accepted" && availableDrivers && availableDrivers.length > 0 && (
                        <div className="space-y-2">
                          <Label>Assign Driver:</Label>
                          <div className="grid grid-cols-1 gap-2">
                            {availableDrivers.map((driver) => (
                              <div key={driver.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <p className="text-sm font-medium">{driver.name}</p>
                                  <p className="text-xs text-muted-foreground">{driver.vehicle_type || "Vehicle"}</p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleAssignDriver(alert.id, driver.id)}
                                  disabled={isLoading}
                                >
                                  Assign
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {alert.status === "foodbank_accepted" && (!availableDrivers || availableDrivers.length === 0) && (
                        <p className="text-sm text-muted-foreground">No drivers available at the moment</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  // Driver Dashboard
  if (selectedRole === "driver") {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Driver Dashboard</h1>
              <p className="text-muted-foreground">Manage your delivery routes</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fetchDriverAlerts()}
                disabled={isLoading}
                title="Refresh deliveries"
              >
                <RefreshCcw className="w-4 h-4" />
              </Button>
              <Button
                variant={isAvailable ? "default" : "outline"}
                onClick={handleToggleAvailability}
                disabled={isLoading}
              >
                {isAvailable ? "Available" : "Unavailable"}
              </Button>
            <Button variant="outline" onClick={handleReset}>
              <ArrowLeft className="w-4 h-4 mr-2" />
                Logout
            </Button>
            </div>
          </div>

          <NotificationBanner />
          <MessageBanner />

          <Card>
            <CardHeader>
              <CardTitle>Delivery Routes</CardTitle>
              <CardDescription>Your assigned pickup and delivery locations</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && driverAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : driverAlerts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No deliveries assigned yet</p>
              ) : (
                <div className="space-y-4">
                  {driverAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">Alert #{alert.id.slice(0, 8)}</span>
                            <Badge variant={getStatusBadgeVariant(alert.status)}>
                              {alert.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-foreground">
                              <span className="font-medium">Pickup:</span> {alert.restaurant_address || "Address not provided"}
                        </p>
                        <p className="text-foreground">
                              <span className="font-medium">Items:</span>{" "}
                              {alert.food_items && alert.food_items.length > 0
                                ? alert.food_items.map(item => `${item.quantity}x ${item.name}`).join(", ")
                                : "No items listed"}
                        </p>
                      </div>
                    </div>
                  </div>

                      {alert.status === "driver_assigned" && (
                        <Button
                          className="w-full"
                          onClick={() => handleUpdateStatus(alert.id, "picked_up")}
                          disabled={isLoading}
                        >
                          Mark as Picked Up
                        </Button>
                      )}

                      {alert.status === "picked_up" && (
                        <Button
                          className="w-full"
                          variant="secondary"
                          onClick={() => handleUpdateStatus(alert.id, "in_transit")}
                          disabled={isLoading}
                        >
                          Start Delivery
                        </Button>
                      )}

                      {alert.status === "in_transit" && (
                    <Button
                      className="w-full"
                          variant="default"
                          onClick={() => handleUpdateStatus(alert.id, "delivered")}
                          disabled={isLoading}
                        >
                          Mark as Delivered
                    </Button>
                  )}
                </div>
              ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                <p className="text-muted-foreground text-center px-4">
                  Map with GPS tracking coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
