from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'ideavolution')
    
    # Enable CORS for React frontend
    CORS(app, origins=["http://localhost:3000"])
    
    # Initialize SocketIO for real-time features
    socketio = SocketIO(app, cors_allowed_origins="http://localhost:3000")
    
    # Initialize notification service
    from services.notification_service import init_notification_service
    init_notification_service(socketio)
    
    # Register WebSocket handlers
    from websocket.handlers import register_socketio_handlers
    register_socketio_handlers(socketio)
    
    # Register blueprints
    from routes.restaurant_routes import restaurant_bp
    from routes.foodbank_routes import foodbank_bp
    from routes.driver_routes import driver_bp
    from routes.alert_routes import alert_bp
    
    app.register_blueprint(restaurant_bp, url_prefix='/api/restaurants')
    app.register_blueprint(foodbank_bp, url_prefix='/api/foodbanks')
    app.register_blueprint(driver_bp, url_prefix='/api/drivers')
    app.register_blueprint(alert_bp, url_prefix='/api/alerts')
    
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'IdeaVolution API is running!'}
    
    @app.route('/api/test-firebase')
    def test_firebase():
        try:
            from config.firebase_config import db
            # Try to access Firestore
            test_ref = db.collection('test').document('connection_test')
            test_ref.set({'test': True, 'timestamp': datetime.now()})
            return {'status': 'success', 'message': 'Firebase connection working!'}
        except Exception as e:
            return {'status': 'error', 'message': f'Firebase connection failed: {str(e)}'}, 500
    
    @app.route('/api/test-simple')
    def test_simple():
        return {
            'status': 'success',
            'message': 'API is working!',
            'timestamp': datetime.now().isoformat(),
            'note': 'This endpoint works without Firebase'
        }
    
    return app, socketio

if __name__ == '__main__':
    app, socketio = create_app()
    socketio.run(app, debug=True, host='0.0.0.0', port=5001)
