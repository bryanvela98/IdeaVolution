# MealResQ 🍽️ ➡️ 🏪

**Food Distribution Management System for RBC Hackathon**

Connecting restaurants, food banks, and drivers to reduce food waste and help communities.

## 🎯 Problem We Solve

Every day, restaurants have leftover food that could help people in need. Our platform automates the entire process:

1. **Restaurants** create alerts for leftover food
2. **Food banks** get notified and can accept within 10 minutes
3. **Drivers** are assigned to pick up and deliver the food
4. **Real-time tracking** ensures efficient delivery

## 🏗️ Architecture

- **Backend**: Flask + Firebase (Real-time notifications, Auto-escalation)
- **Frontend**: React (Real-time UI updates)
- **Database**: Firebase Firestore (Real-time sync)
- **Notifications**: WebSocket (Instant alerts)

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
chmod +x setup.sh
./setup.sh
source venv/bin/activate
python app.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## 📱 Core Features

### For Restaurants

- ✅ Create food alerts with item lists
- ✅ Track pickup status
- ✅ Auto-notification to food banks

### For Food Banks

- ✅ Receive real-time alerts
- ✅ 10-minute response window
- ✅ Auto-escalation if no response
- ✅ Capacity management

### For Drivers

- ✅ Receive delivery requests
- ✅ Real-time navigation
- ✅ Status updates (pickup → delivery)
- ✅ Availability management

## 🔄 Workflow

```
Restaurant → Food Alert → Food Bank (10 min timer)
    ↓
Food Bank Accepts → Driver Notification
    ↓
Driver Accepts → Pickup → Delivery → Complete
```

## 🛠️ Tech Stack

**Backend:**

- Flask (Python web framework)
- Firebase Admin SDK
- WebSocket (real-time)
- Flask-SocketIO

**Frontend:**

- React
- Socket.io-client
- Material-UI/Tailwind

**Database:**

- Firebase Firestore

## 📊 API Endpoints

See `backend/README.md` for detailed API documentation.

## 🔮 Future Enhancements

- GPS tracking integration
- Mobile apps (React Native)
- Analytics dashboard
- Multi-language support
- Payment integration for drivers

**Core MVP Features:**

- [x] Restaurant alert creation
- [x] Food bank notifications
- [x] Driver assignment
- [x] Real-time status updates
- [x] Auto-escalation system

**Nice-to-have (later on):**

- [ ] Advanced geo-location
- [ ] SMS notifications
- [ ] Analytics dashboard


**Making food distribution efficient, one delivery at a time! 🚚💨**
