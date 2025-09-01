# Docker Deployment Troubleshooting Guide

This guide helps resolve common deployment issues with Docker-based deployment on Render.com.

## Current Docker Deployment Setup

### 1. Docker Configuration

**Dockerfile**: `backend/Dockerfile`
- Uses Python 3.12.6-slim
- Includes all dependencies
- Runs as non-root user
- Includes health checks

**Startup Scripts**:
- `start.sh` - Production startup (includes migrations)
- `start-dev.sh` - Development startup (with hot-reload)

**Docker Compose**: `backend/docker-compose.yml`
- Local development environment
- PostgreSQL database
- Automatic health checks

### 2. Render.com Configuration

**render.yaml**:
```yaml
services:
  - type: web
    name: attendance-backend
    env: docker  # Docker environment
    dockerfilePath: ./backend/Dockerfile
    dockerContext: ./backend
    startCommand: ./start.sh  # Production startup script
```

## Common Issues and Solutions

### 1. "start.sh: Permission denied" Error

**Problem**: Startup script not executable

**Solution**: Ensure script is executable in Dockerfile
```dockerfile
# Make startup script executable
RUN chmod +x start.sh
```

### 2. "alembic: command not found" Error

**Problem**: Alembic not available in container

**Solution**: Alembic is installed via requirements.txt and available in the container

### 3. Database Connection Issues

**Problem**: App starts before database is ready

**Solution**: Startup script includes database readiness check
```bash
# Wait for database to be ready
python -m app.backend_pre_start
```

### 4. Migration Failures

**Problem**: Migrations fail on startup

**Solution**: Migrations run automatically via startup script
```bash
# Run database migrations
alembic upgrade head
```

## Deployment Process

### 1. Local Testing
```bash
cd backend
docker compose up --build
```

### 2. Production Deployment
1. Push code to GitHub
2. Render.com automatically:
   - Builds Docker image from Dockerfile
   - Runs startup script (includes migrations)
   - Starts application

### 3. Environment Variables
Configured in render.yaml:
- `DATABASE_URL` - Automatically from database
- `ENVIRONMENT` - Set to production
- `PYTHONPATH` - Set to /app

## Troubleshooting Commands

### Check Container Logs
```bash
# Local
docker compose logs backend

# Production (Render.com dashboard)
# View service logs in Render.com dashboard
```

### Verify Database Connection
```bash
# Check if database is accessible
docker compose exec backend python -m app.backend_pre_start
```

### Test Migrations
```bash
# Run migrations manually if needed
docker compose exec backend alembic upgrade head
```

## Best Practices

1. **Always test locally** with Docker Compose before deploying
2. **Use startup scripts** to ensure proper initialization order
3. **Include health checks** in Dockerfile
4. **Run migrations automatically** on startup
5. **Use environment-specific** startup scripts (dev vs prod)

## Support

For additional help:
- Check Render.com service logs
- Verify Docker image builds successfully
- Ensure all environment variables are set
- Test startup script locally first
