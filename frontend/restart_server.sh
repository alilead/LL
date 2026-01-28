#!/bin/bash

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Kill any existing uvicorn processes
pkill -f uvicorn

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
