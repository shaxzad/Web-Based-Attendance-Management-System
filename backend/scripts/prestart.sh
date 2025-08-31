#! /usr/bin/env bash

set -e
set -x

# Handle virtual environment path for different environments
if [ -n "$VIRTUAL_ENV" ]; then
    echo "Using existing VIRTUAL_ENV: $VIRTUAL_ENV"
else
    # Set virtual environment path for Render
    if [ -d "/opt/render/project/src/backend/.venv" ]; then
        export VIRTUAL_ENV="/opt/render/project/src/backend/.venv"
        export PATH="$VIRTUAL_ENV/bin:$PATH"
        echo "Set VIRTUAL_ENV to: $VIRTUAL_ENV"
    elif [ -d ".venv" ]; then
        export VIRTUAL_ENV="$(pwd)/.venv"
        export PATH="$VIRTUAL_ENV/bin:$PATH"
        echo "Set VIRTUAL_ENV to: $VIRTUAL_ENV"
    fi
fi

# Let the DB start
echo "Waiting for database to be ready..."
if command -v uv &> /dev/null; then
    uv run python app/backend_pre_start.py
else
    python app/backend_pre_start.py
fi

# Run migrations
echo "Running database migrations..."
if command -v uv &> /dev/null; then
    uv run python -m alembic upgrade head
else
    python -m alembic upgrade head
fi

# Create initial data in DB
echo "Creating initial data..."
if command -v uv &> /dev/null; then
    uv run python app/initial_data.py
else
    python app/initial_data.py
fi

echo "Prestart script completed successfully"
