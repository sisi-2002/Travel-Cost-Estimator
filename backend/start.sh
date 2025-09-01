#!/bin/bash

echo "🚀 Starting TripCraft Backend..."
echo

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "Virtual environment created!"
    echo
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install requirements if needed
if [ ! -d "venv/lib/python*/site-packages/fastapi" ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
    echo "Dependencies installed!"
    echo
fi

# Start the server
echo "Starting server..."
python start.py
