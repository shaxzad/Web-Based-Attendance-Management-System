# Production Deployment Guide

This guide provides instructions for deploying the Attendance Management System to production with optimized performance and security.

## Prerequisites

- Docker and Docker Compose installed
- Domain name configured with DNS
- SSL certificates (Let's Encrypt recommended)
- Traefik reverse proxy (optional but recommended)

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```bash
# Application Settings
PROJECT_NAME=Attendance Management System
ENVIRONMENT=production
DOMAIN=your-domain.com
FRONTEND_HOST=https://your-domain.com

# Security
SECRET_KEY=your-super-secret-key-here-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=11520

# Database Configuration
POSTGRES_SERVER=db
POSTGRES_PORT=5432
POSTGRES_USER=attendance_user
POSTGRES_PASSWORD=your-strong-database-password-here
POSTGRES_DB=attendance_db

# Redis Configuration
REDIS_PASSWORD=your-strong-redis-password-here

# Email Configuration
SMTP_TLS=true
SMTP_SSL=false
SMTP_PORT=587
SMTP_HOST=smtp.your-provider.com
SMTP_USER=your-email@your-domain.com
SMTP_PASSWORD=your-email-password
EMAILS_FROM_EMAIL=noreply@your-domain.com
EMAILS_FROM_NAME=Attendance System

# First Superuser
FIRST_SUPERUSER=admin@your-domain.com
FIRST_SUPERUSER_PASSWORD=your-strong-admin-password-here

# CORS Settings
BACKEND_CORS_ORIGINS=["https://your-domain.com","https://www.your-domain.com"]

# Docker Configuration
DOCKER_IMAGE_BACKEND=attendance-system-backend
DOCKER_IMAGE_FRONTEND=attendance-system-frontend
TAG=latest
STACK_NAME=attendance-system
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong, unique passwords for each service
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers enabled

## Deployment Steps

### 1. Build and Deploy

```bash
# Make deployment script executable
chmod +x scripts/deploy-prod.sh

# Deploy to production
./scripts/deploy-prod.sh
```

### 2. Manual Deployment (Alternative)

```bash
# Build images
docker build -t attendance-system-backend:latest ./backend
docker build -t attendance-system-frontend:latest ./frontend

# Deploy with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Verify Deployment

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Health checks
curl -f http://localhost:8000/health
curl -f http://localhost:80
```

## Production Optimizations

### Backend Optimizations

- Multi-stage Docker builds
- Non-root user execution
- Security headers middleware
- Compression enabled
- Rate limiting
- Caching with Redis
- Resource limits configured
- Health checks enabled

### Frontend Optimizations

- Code splitting and lazy loading
- Asset compression
- Cache optimization
- Security headers
- Non-root user execution
- Alpine Linux base image

### Database Optimizations

- Connection pooling
- Query optimization
- Regular backups
- Monitoring and alerting

## Monitoring and Maintenance

### Health Checks

The application includes health checks for all services:

- Backend: `http://localhost:8000/health`
- Frontend: `http://localhost:80`
- Database: PostgreSQL health check
- Redis: Redis health check

### Logging

Logs are available for all services:

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Backup Strategy

1. **Database Backups**: Configure automated PostgreSQL backups
2. **File Backups**: Backup fingerprint data and logs
3. **Configuration Backups**: Backup environment files and configurations

### Updates and Maintenance

1. **Regular Updates**: Keep dependencies updated
2. **Security Patches**: Apply security updates promptly
3. **Performance Monitoring**: Monitor resource usage
4. **Capacity Planning**: Scale resources as needed

## Troubleshooting

### Common Issues

1. **Service Not Starting**: Check logs and environment variables
2. **Database Connection Issues**: Verify database credentials and network
3. **SSL Certificate Issues**: Ensure certificates are valid and properly configured
4. **Performance Issues**: Monitor resource usage and optimize configurations

### Debug Commands

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View detailed logs
docker-compose -f docker-compose.prod.yml logs -f [service-name]

# Access container shell
docker-compose -f docker-compose.prod.yml exec backend bash

# Check resource usage
docker stats

# Verify network connectivity
docker-compose -f docker-compose.prod.yml exec backend ping db
```

## Security Best Practices

1. **Network Security**: Use firewalls and VPNs
2. **Access Control**: Implement proper authentication and authorization
3. **Data Encryption**: Encrypt data at rest and in transit
4. **Regular Audits**: Conduct security audits regularly
5. **Incident Response**: Have a plan for security incidents

## Performance Tuning

1. **Database Optimization**: Optimize queries and indexes
2. **Caching**: Use Redis for session and data caching
3. **CDN**: Use CDN for static assets
4. **Load Balancing**: Implement load balancing for high availability
5. **Monitoring**: Use monitoring tools to track performance

## Support

For issues and support:

1. Check the logs for error messages
2. Review the troubleshooting section
3. Check the GitHub issues page
4. Contact the development team

## License

This project is licensed under the MIT License. See the LICENSE file for details.
