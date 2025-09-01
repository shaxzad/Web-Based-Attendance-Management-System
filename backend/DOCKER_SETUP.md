# Docker Setup Guide

## Overview
This backend now uses Docker for consistent development and production environments.

## Prerequisites
- Docker Desktop installed and running
- Docker Compose (usually comes with Docker Desktop)

## Local Development

### Quick Start
```bash
cd backend
./scripts/dev.sh
```

### Manual Commands
```bash
# Build and start services
docker compose up --build -d

# View logs
docker compose logs -f backend
docker compose logs -f postgres

# Stop services
docker compose down

# Restart backend only
docker compose restart backend
```

### Access Points
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: localhost:5432
- **Health Check**: http://localhost:8000/health

## Production Deployment

### Render.com Setup
1. **Service Type**: Web Service
2. **Environment**: Docker
3. **Build Command**: `docker build -t attendance-backend .`
4. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

### Environment Variables
- `DATABASE_URL`: Automatically set from Render PostgreSQL service
- `ENVIRONMENT`: production
- `PYTHONPATH`: /app

## GitHub Actions Auto-Deploy

### Setup Required
1. **RENDER_TOKEN**: Create in Render.com dashboard
2. **RENDER_SERVICE_ID**: Your service ID from Render

### Secrets to Add
```bash
# In GitHub repository settings > Secrets and variables > Actions
RENDER_TOKEN=your_render_api_token
RENDER_SERVICE_ID=your_service_id
```

### Auto-Deploy Triggers
- Push to `develop` branch
- Changes in `backend/` directory
- Automatic testing before deployment

## Docker Commands Reference

### Development
```bash
# Start development environment
./scripts/dev.sh

# View running containers
docker compose ps

# Execute commands in running container
docker compose exec backend bash
docker compose exec postgres psql -U postgres -d attendance_db

# View container logs
docker compose logs -f [service_name]
```

### Production
```bash
# Build production image
docker build -t attendance-backend:latest .

# Run production container
docker run -p 8000:8000 \
  -e DATABASE_URL=your_db_url \
  -e ENVIRONMENT=production \
  attendance-backend:latest
```

## Troubleshooting

### Common Issues
1. **Port already in use**: Change ports in docker-compose.yml
2. **Database connection failed**: Wait for postgres health check
3. **Permission denied**: Ensure scripts are executable

### Reset Everything
```bash
# Stop and remove everything
docker compose down -v
docker system prune -f

# Start fresh
./scripts/dev.sh
```

## Benefits of Docker Setup

✅ **Consistent environments** (local = production)
✅ **Easy dependency management**
✅ **No Python version conflicts**
✅ **Automatic deployment on merge**
✅ **Isolated services**
✅ **Easy scaling and migration**
