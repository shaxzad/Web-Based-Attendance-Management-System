#!/bin/bash

# Log environment variables for debugging
echo "Environment variables:"
echo "ENVIRONMENT: $ENVIRONMENT"
echo "FRONTEND_HOST: $FRONTEND_HOST"
echo "BACKEND_CORS_ORIGINS: $BACKEND_CORS_ORIGINS"

# Wait for database to be ready
echo "Waiting for database to be ready..."
python -m app.backend_pre_start

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Start the application
echo "Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
