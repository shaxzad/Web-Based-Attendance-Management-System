#!/bin/bash

# Script to commit and push Render.com deployment changes

set -e

echo "🚀 Committing Render.com deployment changes..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository. Please run 'git init' first."
    exit 1
fi

# Add all the new Render.com files
echo "📁 Adding Render.com configuration files..."
git add render.yaml
git add .render-buildpacks
git add backend/runtime.txt
git add RENDER_DEPLOYMENT.md
git add scripts/deploy-render.sh
git add scripts/commit-render-changes.sh

# Check if there are any changes to commit
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ No changes to commit. All files are already up to date."
    exit 0
fi

# Commit the changes
echo "💾 Committing changes..."
git commit -m "Add Render.com deployment configuration

- Add render.yaml for service configuration
- Add .render-buildpacks for Python buildpack
- Add backend/runtime.txt for Python version specification
- Add RENDER_DEPLOYMENT.md with detailed deployment guide
- Add deployment scripts for Render.com

This enables deployment to Render.com with proper build and runtime configuration."

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  Warning: No remote origin found."
    echo "   Please add your GitHub repository:"
    echo "   git remote add origin https://github.com/yourusername/your-repo.git"
    echo ""
    echo "   Then push manually:"
    echo "   git push origin main"
    exit 0
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Successfully committed and pushed Render.com deployment changes!"
echo ""
echo "🎯 Next steps:"
echo "1. Go to your Render.com dashboard"
echo "2. Create a new Web Service"
echo "3. Connect your GitHub repository"
echo "4. Follow the instructions in RENDER_DEPLOYMENT.md"
echo ""
echo "📚 For detailed instructions, see: RENDER_DEPLOYMENT.md"
