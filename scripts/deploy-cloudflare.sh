#!/bin/bash

# Cloudflare Pages Deployment Script
# This script builds and deploys the frontend to Cloudflare Pages

set -e

echo "🚀 Starting Cloudflare Pages deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler CLI is not installed. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if user is logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    print_error "You are not logged in to Cloudflare. Please run:"
    echo "wrangler login"
    exit 1
fi

# Navigate to frontend directory
cd frontend

print_status "Installing dependencies..."
npm install

print_status "Building the application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Build failed - dist directory not found"
    exit 1
fi

print_status "Build completed successfully!"

# Determine deployment environment
ENVIRONMENT=${1:-production}

if [ "$ENVIRONMENT" = "staging" ]; then
    print_status "Deploying to staging environment..."
    npm run deploy:cloudflare:staging
else
    print_status "Deploying to production environment..."
    npm run deploy:cloudflare
fi

print_status "Deployment completed successfully! 🎉"

# Return to root directory
cd ..

print_status "Next steps:"
echo "1. Check your Cloudflare Pages dashboard for the deployment status"
echo "2. Configure your backend API URL in the frontend environment"
echo "3. Set up custom domain if needed"
echo "4. Test your application"
