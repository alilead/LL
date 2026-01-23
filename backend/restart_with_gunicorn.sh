#!/bin/bash

# Kill any existing uvicorn or gunicorn processes
pkill -f uvicorn || true
pkill -f gunicorn || true

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Start with Gunicorn (better for production)
# -w: number of worker processes
# -k: worker class to use (uvicorn worker for ASGI)
# -b: bind address
# --access-logfile: access log file
# --error-logfile: error log file
# --timeout: worker timeout in seconds
gunicorn main:app \
    -w 4 \
    -k uvicorn.workers.UvicornWorker \
    -b 0.0.0.0:8000 \
    --access-logfile logs/access.log \
    --error-logfile logs/error.log \
    --timeout 120 \
    --reload

echo "Server started with Gunicorn on port 8000" 