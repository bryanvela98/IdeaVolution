# IdeaVolution Backend

Flask + Firebase backend for the food distribution management system.

## Quick Start

```bash
# Run setup script
chmod +x setup.sh
./setup.sh

# Activate virtual environment
source venv/bin/activate

# Start the server
python app.py
```

## API Endpoints

### Health Check

- `GET /api/health` - Check if API is running

### Restaurants

- `POST /api/restaurants` - Create restaurant
- `GET /api/restaurants` - Get all restaurants
- `GET /api/restaurants/{id}` - Get specific restaurant
- `PUT /api/restaurants/{id}` - Update restaurant

### Food Banks

- `POST /api/foodbanks` - Create food bank
- `GET /api/foodbanks` - Get all food banks
- `GET /api/foodbanks/{id}` - Get specific food bank
- `POST /api/foodbanks/nearby` - Find nearby food banks

### Drivers

- `POST /api/drivers` - Create driver
- `GET /api/drivers` - Get all drivers
- `GET /api/drivers/available` - Get available drivers
- `PUT /api/drivers/{id}/availability` - Update driver availability

### Food Alerts

- `POST /api/alerts` - Create food alert
- `GET /api/alerts` - Get all alerts (with filters: status, restaurant_id, foodbank_id, driver_id)
- `GET /api/alerts/{id}` - Get specific alert
- `POST /api/alerts/{id}/accept` - Food bank accepts alert
- `POST /api/alerts/{id}/assign-driver` - Assign driver to alert
- `PUT /api/alerts/{id}/status` - Update alert status

### Utility & Geocoding

- `POST /api/utility/geocode` - Convert address to coordinates
- `POST /api/utility/distance` - Calculate distance between addresses or coordinates
- `POST /api/utility/nearest-foodbanks` - Find nearest food banks to restaurant address

## Real-time Features (WebSocket)

### Events to Send

- `join_restaurant` - Join restaurant room
- `join_foodbank` - Join food bank room
- `join_driver` - Join driver room
- `foodbank_response` - Respond to food alert
- `driver_response` - Respond to delivery request
- `location_update` - Send location updates

### Events to Listen

- `new_food_alert` - New food available
- `delivery_request` - New delivery request
- `driver_location_update` - Driver location updates

## Environment Setup

1. Create Firebase project
2. Download service account key
3. Update `.env` file:
   ```
   FIREBASE_PROJECT_ID=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-key.json
   SECRET_KEY=your-secret-key
   ```

## Project Structure

```
backend/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── config/
│   └── firebase_config.py # Firebase configuration
├── models/
│   └── models.py         # Data models
├── routes/
│   ├── restaurant_routes.py
│   ├── foodbank_routes.py
│   ├── driver_routes.py
│   ├── alert_routes.py
│   └── utility_routes.py    # Geocoding & distance utilities
├── services/
│   ├── notification_service.py  # Real-time notifications & proximity logic
│   └── geocoding_service.py     # Address geocoding & distance calculations
└── websocket/
    └── handlers.py       # WebSocket event handlers
```

## Key Features

✅ **REST API** - Full CRUD operations  
✅ **Real-time notifications** - WebSocket integration  
✅ **Auto-escalation** - 10-minute timer system  
✅ **Firebase integration** - Firestore database  
✅ **CORS enabled** - React frontend ready  
✅ **Geocoding & Distance** - Address-to-coordinate conversion with proximity calculations  
✅ **Smart Food Bank Selection** - Distance-based nearest food bank matching

## Geocoding API Examples

### Geocode Address

```bash
POST /api/utility/geocode
Content-Type: application/json

{
  "address": "5511 Bloomfield St, Halifax, NS, Canada"
}

Response:
{
  "success": true,
  "coordinates": {
    "latitude": 44.659596,
    "longitude": -63.594955
  }
}
```

### Calculate Distance Between Addresses

```bash
POST /api/utility/distance
Content-Type: application/json

{
  "address1": "5511 Bloomfield St, Halifax, NS, Canada",
  "address2": "456 Queen St, Toronto, ON, Canada"
}

Response:
{
  "success": true,
  "distance_km": 1263.87,
  "distance_miles": 785.45,
  "coordinates1": {"latitude": 44.659596, "longitude": -63.594955},
  "coordinates2": {"latitude": 43.648230, "longitude": -79.399458}
}
```

### Find Nearest Food Banks

```bash
POST /api/utility/nearest-foodbanks
Content-Type: application/json

{
  "restaurant_address": "123 Main St, Toronto, ON, Canada",
  "max_results": 3
}

Response:
{
  "success": true,
  "restaurant_address": "123 Main St, Toronto, ON, Canada",
  "nearest_foodbanks": [
    {
      "id": "foodbank_id_1",
      "name": "Toronto Food Bank",
      "address": "456 Queen St, Toronto, ON, Canada",
      "distance_km": 8.97,
      "distance_miles": 5.58,
      ...
    }
  ]
}
```

## Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run in development mode
python app.py

# The server will run on http://localhost:5001
```
