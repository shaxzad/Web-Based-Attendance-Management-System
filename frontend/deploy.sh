#!/bin/bash

# Build the project
echo "Building the project..."
npm run build

# Deploy to Cloudflare Pages
echo "Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist

echo "Deployment completed!"
