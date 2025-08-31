# Deployment Troubleshooting Guide

This guide helps resolve common deployment issues, especially with Alembic migrations and virtual environment setup on Render.com.

## Issues Fixed

### 1. Virtual Environment Path Mismatch

**Problem**: Warning about `VIRTUAL_ENV=/opt/render/project/src/.venv` not matching the project environment path `.venv`

**Solution**: The `render.yaml` has been updated to properly set the virtual environment path:

```yaml
buildCommand: |
  pip install uv
  uv sync --frozen
  # Fix virtual environment path for Render
  export VIRTUAL_ENV=/opt/render/project/src/backend/.venv
  export PATH="$VIRTUAL_ENV/bin:$PATH"
```

### 2. Alembic Migration Issues

**Problem**: `alembic upgrade head` fails during deployment

**Solution**: The `render.yaml` now uses `scripts/prestart.sh` which includes proper error handling and fallback mechanisms:

```yaml
startCommand: |
  # Set up environment for start command
  export VIRTUAL_ENV=/opt/render/project/src/backend/.venv
  export PATH="$VIRTUAL_ENV/bin:$PATH"
  # Run prestart script (includes migrations)
  bash scripts/prestart.sh
  # Start the application
  uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Key Changes Made

1. **Fixed Virtual Environment Path**: Set `VIRTUAL_ENV=/opt/render/project/src/backend/.venv` in both build and start commands
2. **Added Prestart Script**: Uses `scripts/prestart.sh` which includes fallback mechanisms for running migrations
3. **Fallback Mechanisms**: The prestart script tries `uv run` first, then falls back to direct Python execution
4. **Proper Environment Setup**: Ensures the virtual environment is properly activated before running commands

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
# Using uv (recommended)
uv run python -m alembic upgrade head

# Using Python directly
python -m alembic upgrade head

# Check current status
uv run python -m alembic current
```

## File Permissions

The prestart script is now executable:
```bash
chmod +x scripts/prestart.sh
```

## What the Prestart Script Does

1. **Environment Setup**: Handles virtual environment path for different environments
2. **Database Wait**: Waits for database to be ready using `backend_pre_start.py`
3. **Migrations**: Runs `alembic upgrade head` with fallback mechanisms
4. **Initial Data**: Creates initial data using `initial_data.py`

The script includes proper error handling and will work whether `uv` is available or not.
