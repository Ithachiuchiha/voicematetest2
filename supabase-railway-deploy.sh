#!/bin/bash

# Deploy Voice Mate to Railway with Supabase Database
echo "🚄 Deploying Voice Mate to Railway with Supabase"
echo "================================================"

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

# Check if Railway CLI is installed
print_status "Checking Railway CLI..."
if ! command -v railway &> /dev/null; then
    print_warning "Railway CLI not found. Installing..."
    npm install -g @railway/cli
    if [ $? -eq 0 ]; then
        print_success "Railway CLI installed successfully"
    else
        print_error "Failed to install Railway CLI"
        exit 1
    fi
else
    print_success "Railway CLI is installed"
fi

# Check if user is logged in
print_status "Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    print_warning "Not logged in to Railway. Please login..."
    railway login
    if [ $? -ne 0 ]; then
        print_error "Railway login failed"
        exit 1
    fi
else
    print_success "Already logged in to Railway"
fi

# Build the project
print_status "Building Voice Mate project..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi

print_success "Project built successfully"

# Initialize Railway project
print_status "Initializing Railway project..."
railway init

if [ $? -ne 0 ]; then
    print_error "Railway initialization failed"
    exit 1
fi

print_success "Railway project initialized"

# Deploy to Railway
print_status "Deploying to Railway..."
railway up

if [ $? -eq 0 ]; then
    print_success "Deployment completed successfully!"
    echo ""
    echo "🎉 Your Voice Mate app is now live on Railway!"
    echo ""
    echo "Next steps:"
    echo "1. Go to your Railway dashboard"
    echo "2. Add your DATABASE_URL environment variable:"
    echo "   railway variables set DATABASE_URL=postgresql://..."
    echo "3. Your app will automatically restart with the database"
    echo ""
    echo "To set your Supabase DATABASE_URL:"
    echo "railway variables set DATABASE_URL=\"YOUR_SUPABASE_URL\""
    echo ""
    echo "To view your deployed app:"
    echo "railway open"
else
    print_error "Deployment failed"
    exit 1
fi