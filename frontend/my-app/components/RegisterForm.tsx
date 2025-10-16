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
      const registerData: any = {
        email: formData.email,
        password: formData.password,
        role: role,
        name: formData.name,
        address: formData.address,
      };

      if (formData.phone) {
        registerData.phone = formData.phone;
      }

      if (role === "driver" && formData.vehicleType) {
        registerData.vehicle_type = formData.vehicleType;
      }

      if (role === "foodbank" && formData.capacity) {
        registerData.capacity = parseInt(formData.capacity);
      }

      const response = await authAPI.register(registerData);
      
      // Auto-login after registration
      const loginResponse = await authAPI.login({
        email: formData.email,
        password: formData.password,
      });

      onSuccess(response.uid, loginResponse.token);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
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
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password,
      });

      // Extract uid from token or use a default
      // In a real app, you'd decode the JWT token
      const uid = response.uid || "user_id";
      onSuccess(uid, response.token);
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleTitle = () => {
    switch (role) {
      case "restaurant":
        return "Restaurant";
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
                <Label htmlFor="name">{role === "driver" ? "Full Name" : "Organization Name"} *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={role === "driver" ? "John Doe" : "Your Organization"}
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

