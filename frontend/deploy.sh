#!/bin/bash

# Set production environment variables
export VITE_API_URL="https://web-based-attendance-management-system.onrender.com"
export NODE_ENV="production"

# Build the project
echo "Building the project with production API URL: $VITE_API_URL"
npm run build

# Deploy to Cloudflare Pages
echo "Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=attendance-management-frontend

echo "Deployment completed!"
