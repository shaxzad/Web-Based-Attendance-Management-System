#!/bin/bash

# Wait for database to be ready
echo "Waiting for database to be ready..."
python -m app.backend_pre_start

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Start the application with hot-reload for development
echo "Starting application with hot-reload..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
