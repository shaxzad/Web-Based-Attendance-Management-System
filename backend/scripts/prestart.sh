#! /usr/bin/env bash

set -e
set -x

echo "Starting prestart script..."

# Check Python version
echo "Checking Python version..."
python --version
if [[ $(python -c "import sys; print(sys.version_info[:2] >= (3, 12))") == "False" ]]; then
    echo "Warning: Python 3.12+ is recommended for compatibility with psycopg-binary"
    echo "Current version: $(python --version)"
fi

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
    echo "Running alembic: $*"
    
    # Try uv run first
    if command -v uv &> /dev/null; then
        echo "Using uv run for alembic..."
        uv run python -m alembic "$@"
    else
        echo "uv not available, using python -m alembic directly..."
        python -m alembic "$@"
    fi
}

# Let the DB start
echo "Waiting for database to be ready..."
run_python "app/backend_pre_start.py"

# Run migrations
echo "Running database migrations..."
run_alembic upgrade head

# Create initial data in DB
echo "Creating initial data..."
run_python "app/initial_data.py"

echo "Prestart script completed successfully ✅"
