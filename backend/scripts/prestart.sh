#! /usr/bin/env bash

set -e
set -x

# Let the DB start
echo "Waiting for database to be ready..."
uv run python app/backend_pre_start.py

# Run migrations
echo "Running database migrations..."
uv run python -m alembic upgrade head

# Create initial data in DB
echo "Creating initial data..."
uv run python app/initial_data.py

echo "Prestart script completed successfully"
