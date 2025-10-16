import firebase_admin
from firebase_admin import credentials, firestore
import os

class FirebaseConfig:
    _db = None
    
    @classmethod
    def initialize_app(cls):
        if not firebase_admin._apps:
            # For development, you'll need to download the service account key
            # from Firebase Console and set the path in .env
            cred_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
            
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                # Fallback for development - use default credentials
                # This works if you're logged in with Firebase CLI
                firebase_admin.initialize_app()
    
    @classmethod
    def get_db(cls):
        if cls._db is None:
            cls.initialize_app()
            cls._db = firestore.client()
        return cls._db

# Initialize on import
db = FirebaseConfig.get_db()
