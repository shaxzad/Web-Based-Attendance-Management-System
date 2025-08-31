#! /usr/bin/env bash

set -e
set -x

echo "Starting prestart script..."

# Function to run Python commands with fallback
run_python() {
    local script="$1"
    echo "Running: $script"
    
    # Try uv run first
    if command -v uv &> /dev/null; then
        echo "Using uv run..."
        uv run python "$script"
    else
        echo "uv not available, using python directly..."
        python "$script"
    fi
}

# Function to run alembic commands with fallback
run_alembic() {
    local command="$1"
    echo "Running alembic: $command"
    
    # Try uv run first
    if command -v uv &> /dev/null; then
        echo "Using uv run for alembic..."
        uv run python -m alembic "$command"
    else
        echo "uv not available, using python -m alembic directly..."
        python -m alembic "$command"
    fi
}

# Let the DB start
echo "Waiting for database to be ready..."
run_python "app/backend_pre_start.py"

# Run migrations
echo "Running database migrations..."
run_alembic "upgrade head"

# Create initial data in DB
echo "Creating initial data..."
run_python "app/initial_data.py"

echo "Prestart script completed successfully ✅"
