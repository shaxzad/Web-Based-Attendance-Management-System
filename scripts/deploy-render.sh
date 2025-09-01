#!/bin/bash

# Render.com Docker Deployment Script
# This script helps deploy the Attendance Management System to Render.com using Docker

set -e

echo "🚀 Starting Render.com Docker deployment..."

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found. Please run this script from the project root."
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: Git repository not initialized. Please run 'git init' first."
    exit 1
fi

# Check if changes are committed
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes. Please commit them before deploying."
    echo "   Run: git add . && git commit -m 'Update for Render Docker deployment'"
    read -p "   Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if remote is set up
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ Error: No remote origin found. Please add your GitHub repository:"
    echo "   git remote add origin https://github.com/yourusername/your-repo.git"
    exit 1
fi

echo "📋 Docker deployment checklist:"
echo "   ✅ render.yaml configuration file exists"
echo "   ✅ backend/Dockerfile exists"
echo "   ✅ backend/start.sh exists (production startup script)"
echo "   ✅ backend/start-dev.sh exists (development startup script)"

echo ""
echo "🔧 Next steps for Docker deployment:"
echo "1. Push your code to GitHub:"
echo "   git push origin main"
echo ""
echo "2. In your Render.com dashboard:"
echo "   - Create a new Web Service"
echo "   - Connect your GitHub repository"
echo "   - Set Environment to: Docker"
echo "   - Root Directory: . (project root, not backend)"
echo "   - Build Command: (Render will use Dockerfile automatically)"
echo "   - Start Command: ./backend/start.sh (already set in render.yaml)"
echo ""
echo "3. Render.com will automatically:"
echo "   - Detect your Dockerfile"
echo "   - Build the Docker image"
echo "   - Run migrations on startup (via start.sh)"
echo "   - Start your application"
echo ""
echo "4. Environment variables are configured in render.yaml:"
echo "   - DATABASE_URL (automatically from database)"
echo "   - ENVIRONMENT=production"
echo "   - PYTHONPATH=/app"
echo ""
echo "5. Deploy the service"
echo ""
echo "📚 For more information, see: https://render.com/docs/deploy-docker"

echo ""
echo "🎯 Ready to deploy with Docker! Follow the steps above to complete your Render.com deployment."
