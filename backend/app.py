from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
    
    # Disable strict slashes to prevent redirects
    app.url_map.strict_slashes = False
    
    # Enable CORS for React frontend with all necessary permissions
    CORS(app, 
         resources={r"/api/*": {"origins": ["http://localhost:3000", "http://localhost:3000/"]}},
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         supports_credentials=True)
    
    # Initialize SocketIO for real-time features
    socketio = SocketIO(app, 
                       cors_allowed_origins="http://localhost:3000",
                       cors_credentials=True)
    
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
    from routes.auth_routes import auth_bp
    
    app.register_blueprint(restaurant_bp, url_prefix='/api/restaurants')
    app.register_blueprint(foodbank_bp, url_prefix='/api/foodbanks')
    app.register_blueprint(driver_bp, url_prefix='/api/drivers')
    app.register_blueprint(alert_bp, url_prefix='/api/alerts')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'IdeaVolution API is running!'}
    
    return app, socketio

if __name__ == '__main__':
    app, socketio = create_app()
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
