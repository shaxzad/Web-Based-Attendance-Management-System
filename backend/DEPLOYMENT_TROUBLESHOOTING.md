# Deployment Troubleshooting Guide

This guide helps resolve common deployment issues, especially with Alembic migrations on Render.com.

## Issues Fixed

### 1. "alembic: command not found" Error

**Problem**: `bash: line 1: alembic: command not found`

**Root Cause**: Trying to run `alembic` directly instead of using `python -m alembic`

**Solution**: Use `python -m alembic` instead of direct `alembic` commands:

```bash
# ❌ Wrong - this fails on Render
alembic upgrade head

# ✅ Correct - this works everywhere
python -m alembic upgrade head
```

### 2. Virtual Environment Path Issues

**Problem**: Complex PATH manipulation and virtual environment setup

**Solution**: Simplified approach using `uv run` which handles the environment automatically:

```yaml
buildCommand: |
  pip install uv
  uv sync --frozen
  echo "Verifying alembic installation..."
  python -c "import alembic; print('Alembic is available ✅')"
```

## Key Changes Made

1. **Simplified Build Command**: Removed manual PATH hacks, let `uv` handle the environment
2. **Correct Alembic Usage**: Use `python -m alembic` instead of direct `alembic` commands
3. **Consistent uv run**: All Python commands use `uv run` for consistent environment
4. **Cleaner Prestart Script**: Simplified with proper error handling

## Current Configuration

### render.yaml
```yaml
buildCommand: |
  pip install uv
  uv sync --frozen
  echo "Verifying alembic installation..."
  python -c "import alembic; print('Alembic is available ✅')"

startCommand: |
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

1. **`uv run`**: Automatically activates the virtual environment and runs commands
2. **`python -m alembic`**: Ensures Alembic runs in the correct Python environment
3. **Simplified PATH**: No manual environment variable manipulation needed
4. **Consistent Environment**: Same approach for all Python commands

## Dependencies

Alembic is properly declared in `pyproject.toml`:
```toml
dependencies = [
    "alembic<2.0.0,>=1.12.1",
    # ... other dependencies
]
```

The `uv sync --frozen` command will install all dependencies including Alembic.
