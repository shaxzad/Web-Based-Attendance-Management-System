#!/bin/bash

# Production Deployment Script
# This script deploys the application to production with proper security and optimization

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="attendance-system"
DOMAIN="${DOMAIN:-example.com}"
TAG="${TAG:-latest}"
ENVIRONMENT="production"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if required environment variables are set
check_env_vars() {
    log "Checking environment variables..."
    
    required_vars=(
        "POSTGRES_PASSWORD"
        "POSTGRES_USER"
        "POSTGRES_DB"
        "SECRET_KEY"
        "FIRST_SUPERUSER"
        "FIRST_SUPERUSER_PASSWORD"
        "DOMAIN"
        "FRONTEND_HOST"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    log "All required environment variables are set"
}

# Check if Docker is running
check_docker() {
    log "Checking Docker status..."
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running or not accessible"
    fi
    log "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    log "Checking Docker Compose..."
    if ! command -v docker-compose > /dev/null 2>&1; then
        error "Docker Compose is not installed"
    fi
    log "Docker Compose is available"
}

# Build images
build_images() {
    log "Building Docker images..."
    
    # Build backend
    log "Building backend image..."
    docker build -t "${STACK_NAME}-backend:${TAG}" ./backend
    
    # Build frontend
    log "Building frontend image..."
    docker build -t "${STACK_NAME}-frontend:${TAG}" ./frontend
    
    log "All images built successfully"
}

# Deploy application
deploy() {
    log "Deploying application to production..."
    
    # Set environment variables for docker-compose
    export DOCKER_IMAGE_BACKEND="${STACK_NAME}-backend"
    export DOCKER_IMAGE_FRONTEND="${STACK_NAME}-frontend"
    export STACK_NAME="${STACK_NAME}"
    export TAG="${TAG}"
    export ENVIRONMENT="${ENVIRONMENT}"
    
    # Deploy using production docker-compose
    docker-compose -f docker-compose.prod.yml up -d
    
    log "Application deployed successfully"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    # Wait for services to be ready
    sleep 30
    
    # Check backend health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log "Backend is healthy"
    else
        warn "Backend health check failed"
    fi
    
    # Check frontend health
    if curl -f http://localhost:80 > /dev/null 2>&1; then
        log "Frontend is healthy"
    else
        warn "Frontend health check failed"
    fi
    
    log "Health checks completed"
}

# Cleanup old images
cleanup() {
    log "Cleaning up old images..."
    
    # Remove dangling images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    log "Cleanup completed"
}

# Main deployment process
main() {
    log "Starting production deployment..."
    
    check_env_vars
    check_docker
    check_docker_compose
    build_images
    deploy
    health_check
    cleanup
    
    log "Production deployment completed successfully!"
    log "Application is available at: https://${DOMAIN}"
    log "API is available at: https://api.${DOMAIN}"
}

# Run main function
main "$@"
