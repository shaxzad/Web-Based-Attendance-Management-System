# Deployment Troubleshooting Guide

This guide helps resolve common deployment issues, especially with Alembic migrations on Render.com.

## Issues Fixed

### 1. "alembic: command not found" Error

**Problem**: `bash: line 1: alembic: command not found`

**Root Cause**: Dependencies not properly installed due to version mismatch with `zklib`

**Solution**: 
1. Use `python -m alembic` instead of direct `alembic` commands
2. Fixed `zklib` version from `0.1.0` to `0.1.1` (the version that actually exists on PyPI)
3. Use `uv sync --frozen` for consistent dependency installation

### 2. Version Mismatch Issue

**Problem**: `zklib==0.1.0` doesn't exist on PyPI, only `zklib==0.1.1`

**Why it worked locally**: 
- Your local environment already had `zklib==0.1.1` installed
- `uv sync --frozen` locally used existing packages
- Render tried to install exactly `zklib==0.1.0` which doesn't exist

**Solution**: Updated both `requirements.txt` and `pyproject.toml` to use `zklib==0.1.1`

## Key Changes Made

1. **Fixed Version Mismatch**: Changed `zklib==0.1.0` to `zklib==0.1.1`
2. **Restored All Dependencies**: All ZKTeco dependencies are now included
3. **Enhanced Error Handling**: Added fallback mechanisms in prestart script
4. **Better Logging**: Added more detailed logging for debugging

## Current Configuration

### render.yaml
```yaml
buildCommand: |
  pip install uv
  echo "Installing dependencies with uv..."
  uv sync --frozen
  echo "Verifying alembic installation..."
  python -c "import alembic; print('Alembic is available ✅')"
  echo "Build completed successfully ✅"

startCommand: |
  echo "Starting application..."
  # Run prestart script (includes migrations)
  bash scripts/prestart.sh
  # Start the application
  uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### scripts/prestart.sh
```bash
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
```

## Required Environment Variables

Make sure these are set in Render:
- `POSTGRES_SERVER`
- `POSTGRES_USER` 
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`
- `ENVIRONMENT` (should be "production")

## Manual Migration Commands (if needed)

If automatic migrations fail, you can run them manually in Render's shell:

```bash
# ✅ Correct way
uv run python -m alembic upgrade head

# Check current status
uv run python -m alembic current

# Check migration history
uv run python -m alembic history
```

## Why This Works

1. **`uv sync --frozen`**: Consistent dependency installation across environments
2. **`python -m alembic`**: Ensures Alembic runs in the correct Python environment
3. **Fallback Mechanisms**: Script handles cases where `uv` might not be available
4. **Correct Versions**: All dependencies use versions that actually exist on PyPI

## Dependencies

All dependencies are properly declared with correct versions:
```
alembic==1.12.1
fastapi==0.114.2
zklib==0.1.1  # Fixed from 0.1.0
# ... other dependencies
```

The `uv sync --frozen` command will install all dependencies including Alembic.

## Why It Worked Locally But Failed on Render

1. **Local Environment**: Already had `zklib==0.1.1` installed
2. **Render Environment**: Fresh install tried to install `zklib==0.1.0` (which doesn't exist)
3. **Version Resolution**: Local `uv sync` used existing packages, Render failed on missing version
4. **Platform Differences**: macOS vs Linux environment differences
