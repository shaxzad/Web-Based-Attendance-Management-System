#!/bin/bash

# Cloudflare Setup and Deployment Script
# This script helps set up the initial configuration and deploy to Cloudflare Pages

set -e

echo "🔧 Cloudflare Setup and Deployment Script"

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

# Function to run setup
run_setup() {
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
        echo "./scripts/setup-cloudflare.sh deploy"
    else
        print_status "You are logged in to Cloudflare"
        echo ""
        print_status "Ready to deploy! Run:"
        echo "./scripts/setup-cloudflare.sh deploy"
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
}

# Function to run deployment
run_deploy() {
    echo "🚀 Starting Cloudflare Pages deployment..."

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
}

# Main script logic
case "${1:-setup}" in
    "setup")
        run_setup
        ;;
    "deploy")
        run_deploy "${2:-production}"
        ;;
    "staging")
        run_deploy "staging"
        ;;
    *)
        echo "Usage: $0 [setup|deploy|staging]"
        echo ""
        echo "Commands:"
        echo "  setup    - Run initial setup (default)"
        echo "  deploy   - Deploy to production"
        echo "  staging  - Deploy to staging"
        echo ""
        echo "Examples:"
        echo "  $0              # Run setup"
        echo "  $0 setup        # Run setup"
        echo "  $0 deploy       # Deploy to production"
        echo "  $0 staging      # Deploy to staging"
        exit 1
        ;;
esac
