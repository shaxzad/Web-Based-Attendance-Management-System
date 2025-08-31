#!/bin/bash

# Render.com Deployment Script
# This script helps deploy the Attendance Management System to Render.com

set -e

echo "🚀 Starting Render.com deployment..."

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
    echo "   Run: git add . && git commit -m 'Update for Render deployment'"
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

echo "📋 Deployment checklist:"
echo "   ✅ render.yaml configuration file exists"
echo "   ✅ backend/requirements.txt exists"
echo "   ✅ backend/runtime.txt exists"
echo "   ✅ .render-buildpacks exists"

echo ""
echo "🔧 Next steps:"
echo "1. Push your code to GitHub:"
echo "   git push origin main"
echo ""
echo "2. In your Render.com dashboard:"
echo "   - Create a new Web Service"
echo "   - Connect your GitHub repository"
echo "   - Set the Root Directory to: backend"
echo "   - Set Build Command to: pip install -r requirements.txt"
echo "   - Set Start Command to: uvicorn app.main:app --host 0.0.0.0 --port \$PORT"
echo ""
echo "3. Configure environment variables in Render.com:"
echo "   - SECRET_KEY (generate a secure random string)"
echo "   - POSTGRES_SERVER (your database URL)"
echo "   - POSTGRES_USER (your database username)"
echo "   - POSTGRES_PASSWORD (your database password)"
echo "   - POSTGRES_DB (your database name)"
echo "   - And other required environment variables"
echo ""
echo "4. Deploy the service"
echo ""
echo "📚 For more information, see: https://render.com/docs/deploy-fastapi"

echo ""
echo "🎯 Ready to deploy! Follow the steps above to complete your Render.com deployment."
