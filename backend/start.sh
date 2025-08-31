#!/bin/bash
set -e

echo "Starting application..."

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Set Python path
export PYTHONPATH=/opt/render/project/src/backend

# Run database migrations
echo "Running database migrations..."
python -m alembic upgrade head

# Start the application
echo "Starting uvicorn server..."
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
