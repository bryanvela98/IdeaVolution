#!/bin/bash

# IdeaVolution Backend Setup Script

echo "🚀 Setting up IdeaVolution Backend..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed. Please install Python 3.8+"
    exit 1
fi

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "✏️  Please edit .env file with your Firebase credentials"
fi

echo "✅ Backend setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Firebase project details"
echo "2. Download Firebase service account key"
echo "3. Run: source venv/bin/activate"
echo "4. Run: python app.py"
echo ""
echo "The API will be available at http://localhost:5000"
