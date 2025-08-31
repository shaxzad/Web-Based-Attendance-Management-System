#!/bin/bash
set -e

echo "Starting build process..."

# Install uv
echo "Installing uv..."
pip install uv

# Sync dependencies
echo "Syncing dependencies..."
uv sync --frozen

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Set Python path
export PYTHONPATH=/opt/render/project/src/backend

# Verify alembic is available
echo "Verifying alembic installation..."
python -c "import alembic; print('Alembic is available')" || echo "Alembic import failed"

# Build completed - migrations will be run during startup
echo "Build completed - database migrations will be run during startup"

echo "Build completed successfully!"
