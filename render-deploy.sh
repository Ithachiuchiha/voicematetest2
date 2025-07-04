#!/bin/bash

echo "🚀 Voice Mate - Render Deployment Setup"
echo "======================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Use existing DATABASE_URL from environment
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL not found in environment"
    echo "Please make sure your database is set up in Replit"
    exit 1
fi

print_success "Using existing DATABASE_URL from Replit"

# Step 1: Build the project
print_status "Building Voice Mate project..."
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed"
    exit 1
fi

print_success "Project built successfully"

# Step 2: Create render.yaml for Render deployment
print_status "Creating render.yaml configuration..."

cat > render.yaml << EOF
services:
  - type: web
    name: voice-mate-app
    env: node
    plan: free
    region: oregon
    buildCommand: cd dist && npm install --production
    startCommand: cd dist && node index.js
    envVars:
      - key: DATABASE_URL
        value: $DATABASE_URL
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
    autoDeploy: false
EOF

# Step 3: Update the production package.json
print_status "Creating production package.json..."

cat > dist/package.json << EOF
{
  "name": "voice-mate-production",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.9.0",
    "bcryptjs": "^2.4.3",
    "connect-pg-simple": "^9.0.1",
    "drizzle-orm": "^0.30.0",
    "express": "^4.19.0",
    "express-rate-limit": "^7.2.0",
    "express-session": "^1.18.0",
    "memorystore": "^1.6.7",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "ws": "^8.16.0",
    "zod": "^3.22.4"
  }
}
EOF

print_success "Render deployment configuration created!"

echo ""
echo "✅ Your Voice Mate app is ready for Render deployment!"
echo ""
echo "Next steps:"
echo "1. Go to render.com and create an account"
echo "2. Click 'New +' → 'Web Service'"
echo "3. Connect your GitHub repository"
echo "4. Render will automatically detect and use the render.yaml file"
echo "5. Your DATABASE_URL is already configured in the file"
echo ""
echo "Files created:"
echo "- render.yaml (Render deployment configuration)"
echo "- dist/package.json (Production dependencies)"
echo "- dist/index.js (Optimized backend server)"
echo "- dist/public/ (Optimized frontend)"
echo ""
echo "🎉 Your Voice Mate app will deploy with database support!"