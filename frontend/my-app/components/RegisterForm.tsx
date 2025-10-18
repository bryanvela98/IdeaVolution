"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserRole } from "@/lib/types"
import { authAPI } from "@/lib/api"
import { ArrowLeft, Loader2 } from "lucide-react"

interface RegisterFormProps {
  role: UserRole;
  onSuccess: (uid: string, token: string) => void;
  onBack: () => void;
}

export default function RegisterForm({ role, onSuccess, onBack }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    address: "",
    phone: "",
    vehicleType: "", // for drivers
    capacity: "", // for food banks
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  const handleRegister = async () => {
    setError(null);

    // Validation
    if (!formData.email || !formData.password || !formData.name || !formData.address) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Create profile based on role using the appropriate endpoint
      let response;
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      const profileData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || "(000) 000-0000",
        address: formData.address,
      };

      if (role === "restaurant") {
        // POST /api/restaurants
        profileData.contact_person = formData.name;
        response = await fetch(`${API_BASE}/restaurants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData)
        });
      } else if (role === "foodbank") {
        // POST /api/foodbanks
        profileData.contact_person = formData.name;
        if (formData.capacity) {
          profileData.capacity = parseInt(formData.capacity);
        }
        response = await fetch(`${API_BASE}/foodbanks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData)
        });
      } else if (role === "driver") {
        // POST /api/drivers
        profileData.license_number = `DL${Date.now()}`;
        profileData.vehicle_type = formData.vehicleType || "Car";
        response = await fetch(`${API_BASE}/drivers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData)
        });
      }

      if (!response || !response.ok) {
        const errorData = await response?.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create profile');
      }

      const data = await response.json();
      
      // Extract the ID from response
      let userId;
      if (role === "restaurant" && data.restaurant) {
        userId = data.restaurant.id;
      } else if (role === "foodbank" && data.foodbank) {
        userId = data.foodbank.id;
      } else if (role === "driver" && data.driver) {
        userId = data.driver.id;
      } else {
        userId = `${role}_${Date.now()}`;
      }

      // Store user data in localStorage for persistence
      const userData = {
        uid: userId,
        email: formData.email,
        role: role,
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        vehicleType: formData.vehicleType,
        capacity: formData.capacity,
      };
      
      localStorage.setItem('userData', JSON.stringify(userData));

      // Generate mock token (backend doesn't have auth yet)
      const mockToken = `token_${userId}`;

      // Auto-login and open dashboard
      onSuccess(userId, mockToken);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please make sure backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setError(null);

    if (!formData.email || !formData.password) {
      setError("Please enter email and password");
      return;
    }

    setIsLoading(true);

    try {
      // For now, check localStorage for saved user data
      const savedUserData = localStorage.getItem('userData');
      
      if (savedUserData) {
        const userData = JSON.parse(savedUserData);
        
        // Simple check: if email matches, allow login
        if (userData.email === formData.email) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const mockToken = `mock_token_${Date.now()}`;
          onSuccess(userData.uid, mockToken);
          return;
        }
      }
      
      // If no matching user found
      setError("No account found. Please register first.");
      
      // NOTE: When backend is ready, uncomment this code:
      /*
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password,
      });

      const uid = response.uid || "user_id";
      onSuccess(uid, response.token);
      */
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleTitle = () => {
    switch (role) {
      case "restaurant":
        return "Donor";
      case "foodbank":
        return "Food Bank";
      case "driver":
        return "Driver";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <Button variant="ghost" size="sm" onClick={onBack} className="w-fit mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Change Role
          </Button>
          <CardTitle className="text-2xl">
            {showLogin ? `${getRoleTitle()} Login` : `${getRoleTitle()} Registration`}
          </CardTitle>
          <CardDescription>
            {showLogin
              ? "Enter your credentials to continue"
              : "Create your account to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isLoading}
            />
          </div>

          {!showLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{role === "driver" ? "Full Name" : role === "restaurant" ? "Donor Name" : "Organization Name"} *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={role === "driver" ? "John Doe" : role === "restaurant" ? "Joe's Restaurant" : "Your Organization"}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="123 Main St, Halifax, NS"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(902) 555-0123"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              {role === "driver" && (
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Vehicle Type</Label>
                  <Input
                    id="vehicleType"
                    type="text"
                    placeholder="e.g., Van, Truck, Car"
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    disabled={isLoading}
                  />
                </div>
              )}

              {role === "foodbank" && (
                <div className="space-y-2">
                  <Label htmlFor="capacity">Storage Capacity (servings)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="e.g., 1000"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    disabled={isLoading}
                  />
                </div>
              )}
            </>
          )}

          <Button 
            className="w-full" 
            onClick={showLogin ? handleLogin : handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {showLogin ? "Logging in..." : "Creating account..."}
              </>
            ) : (
              showLogin ? "Login" : "Create Account"
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setShowLogin(!showLogin);
                setError(null);
              }}
              className="text-sm text-primary hover:underline"
              disabled={isLoading}
            >
              {showLogin ? "Need an account? Register" : "Already have an account? Login"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

