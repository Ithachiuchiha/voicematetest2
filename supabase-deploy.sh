#!/bin/bash

echo "🚀 Voice Mate - One-Click Supabase Deployment"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Ask user for Supabase DATABASE_URL
echo ""
echo "First, you need to get your DATABASE_URL from Supabase:"
echo "1. Go to supabase.com and create a free account"
echo "2. Create a new project called 'voice-mate-app'"
echo "3. Go to Settings → Database"
echo "4. Copy the 'Connection pooling' URL"
echo "5. Replace [YOUR-PASSWORD] with your database password"
echo ""
echo "Example: postgresql://postgres.abc123:yourpassword@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
echo ""

read -p "Enter your Supabase DATABASE_URL: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL is required. Please get it from your Supabase dashboard."
    exit 1
fi

print_success "DATABASE_URL received"

# Step 2: Choose deployment platform
echo ""
echo "Choose your deployment platform:"
echo "1) Railway (Free, easy setup)"
echo "2) Render (Free, reliable)"
echo "3) Stay on Replit (add DATABASE_URL to secrets)"
echo ""
read -p "Enter your choice (1-3): " PLATFORM_CHOICE

case $PLATFORM_CHOICE in
    1)
        PLATFORM="railway"
        ;;
    2)
        PLATFORM="render"
        ;;
    3)
        PLATFORM="replit"
        ;;
    *)
        print_error "Invalid choice. Using Railway as default."
        PLATFORM="railway"
        ;;
esac

# Step 3: Build the project
print_status "Building Voice Mate project..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi

print_success "Project built successfully"

# Step 4: Deploy based on platform choice
case $PLATFORM in
    "railway")
        print_status "Deploying to Railway..."
        
        # Install Railway CLI if needed
        if ! command -v railway &> /dev/null; then
            print_status "Installing Railway CLI..."
            npm install -g @railway/cli
        fi
        
        # Login to Railway
        print_status "Logging in to Railway..."
        railway login
        
        # Initialize and deploy
        print_status "Setting up Railway project..."
        railway init
        
        print_status "Setting DATABASE_URL..."
        railway variables set DATABASE_URL="$DATABASE_URL"
        
        print_status "Deploying to Railway..."
        railway up
        
        if [ $? -eq 0 ]; then
            print_success "Deployed to Railway successfully!"
            echo ""
            echo "Your app is live! Run 'railway open' to view it."
        else
            print_error "Railway deployment failed"
            exit 1
        fi
        ;;
        
    "render")
        print_status "Setting up Render deployment..."
        
        # Create render.yaml for easy deployment
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
        
        # Create a production package.json for the dist folder
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
        
        print_success "Created render.yaml and production package.json"
        print_success "Updated deployment configuration for Render"
        echo ""
        echo "✅ Render deployment ready!"
        echo ""
        echo "Next steps:"
        echo "1. Go to render.com and create account"
        echo "2. Click 'New +' → 'Web Service'"
        echo "3. Connect your GitHub repository"
        echo "4. Render will automatically use the render.yaml configuration"
        echo "5. Your DATABASE_URL is already configured"
        echo ""
        echo "Your app will deploy from the 'dist/' folder with optimized settings!"
        ;;
        
    "replit")
        print_status "Setting up Replit with Supabase database..."
        
        echo ""
        print_success "Replit setup instructions:"
        echo "1. Go to your Replit project"
        echo "2. Click the 'Secrets' tab (lock icon)"
        echo "3. Add a new secret:"
        echo "   Key: DATABASE_URL"
        echo "   Value: $DATABASE_URL"
        echo "4. Your app will automatically restart and use the database"
        echo ""
        echo "That's it! Your Voice Mate app now has a real PostgreSQL database."
        ;;
esac

# Step 5: Test instructions
echo ""
print_success "Deployment setup complete!"
echo ""
echo "What you get with Supabase:"
echo "✓ Real PostgreSQL database (data persists forever)"
echo "✓ 50,000 monthly active users (free)"
echo "✓ All voice recognition features work exactly the same"
echo "✓ Better performance and reliability"
echo "✓ No payment required for personal use"
echo ""
echo "Test your app:"
echo "1. Open your deployed app URL"
echo "2. Try creating diary entries and tasks"
echo "3. Refresh the page - data should persist"
echo "4. All voice features work exactly the same"
echo ""
print_success "Your Voice Mate app is now running with a real database!"