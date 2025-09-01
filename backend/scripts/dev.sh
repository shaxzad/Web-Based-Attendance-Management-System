#!/bin/bash

set -e

echo "🚀 Starting development environment..."

# Build and start services
docker compose up --build -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker compose ps

echo "✅ Development environment is ready!"
echo "🌐 Backend: http://localhost:8000"
echo "🗄️  Database: localhost:5432"
echo ""
echo "📝 Useful commands:"
echo "  docker compose logs -f backend    # View backend logs"
echo "  docker compose logs -f postgres   # View database logs"
echo "  docker compose down               # Stop services"
echo "  docker compose restart backend    # Restart backend only"
