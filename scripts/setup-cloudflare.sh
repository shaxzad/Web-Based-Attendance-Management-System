#!/bin/bash

# Cloudflare Setup Script
# This script helps set up the initial configuration for Cloudflare deployment

set -e

echo "🔧 Setting up Cloudflare deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_step "1. Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Node.js and npm are installed"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_warning "Wrangler CLI is not installed. Installing now..."
    npm install -g wrangler
    print_status "Wrangler CLI installed successfully"
else
    print_status "Wrangler CLI is already installed"
fi

print_step "2. Setting up frontend environment..."

# Create frontend .env file if it doesn't exist
if [ ! -f "frontend/.env" ]; then
    print_status "Creating frontend .env file..."
    cat > frontend/.env << EOF
# Frontend Environment Variables
VITE_API_URL=http://localhost:8000
VITE_APP_NAME="Attendance Management System"
EOF
    print_status "Frontend .env file created"
else
    print_status "Frontend .env file already exists"
fi

print_step "3. Installing frontend dependencies..."

cd frontend
npm install
cd ..

print_step "4. Testing frontend build..."

cd frontend
npm run build
cd ..

if [ -d "frontend/dist" ]; then
    print_status "Frontend build test successful!"
else
    print_error "Frontend build failed"
    exit 1
fi

print_step "5. Cloudflare login check..."

if ! wrangler whoami &> /dev/null; then
    print_warning "You are not logged in to Cloudflare."
    echo "Please run the following command to login:"
    echo "wrangler login"
    echo ""
    echo "After logging in, you can run:"
    echo "./scripts/deploy-cloudflare.sh"
else
    print_status "You are logged in to Cloudflare"
    echo ""
    print_status "Ready to deploy! Run:"
    echo "./scripts/deploy-cloudflare.sh"
fi

print_step "6. Backend deployment options..."

echo ""
echo "For the backend, you have several options:"
echo ""
echo "Option 1: Railway (Recommended for testing)"
echo "  - Install Railway CLI: npm install -g @railway/cli"
echo "  - Login: railway login"
echo "  - Deploy: cd backend && railway up"
echo ""
echo "Option 2: Render"
echo "  - Connect your GitHub repository"
echo "  - Create a new Web Service"
echo "  - Configure build and start commands"
echo ""
echo "Option 3: Heroku"
echo "  - Install Heroku CLI"
echo "  - Create a new app"
echo "  - Deploy using git push heroku main"
echo ""

print_status "Setup completed! 🎉"
