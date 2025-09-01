#!/bin/bash

# Build the project
echo "Building the project..."
npm run build

# Deploy to Cloudflare Pages
echo "Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=attendance-management-frontend

echo "Deployment completed!"

echo "Deployment completed!"
