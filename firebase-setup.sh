#!/bin/bash

echo "🔥 Firebase Setup & Deployment Script for Voice Mate"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Firebase CLI is installed
print_status "Checking Firebase CLI installation..."
if ! command -v firebase &> /dev/null; then
    print_warning "Firebase CLI not found. Installing globally..."
    npm install -g firebase-tools
    if [ $? -eq 0 ]; then
        print_success "Firebase CLI installed successfully"
    else
        print_error "Failed to install Firebase CLI"
        exit 1
    fi
else
    print_success "Firebase CLI is already installed"
fi

# Check if user is logged in
print_status "Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    print_warning "Not logged in to Firebase. Please login..."
    firebase login
    if [ $? -ne 0 ]; then
        print_error "Firebase login failed"
        exit 1
    fi
else
    print_success "Already logged in to Firebase"
fi

# Check if Firebase project is initialized
if [ ! -f ".firebaserc" ]; then
    print_warning "Firebase not initialized. Starting initialization..."
    echo ""
    echo "Please follow these steps:"
    echo "1. Select 'Use an existing project' OR 'Create a new project'"
    echo "2. Choose or create your project"
    echo "3. For Functions: Select JavaScript, decline ESLint, install dependencies"
    echo "4. For Hosting: Use 'dist/public' as public directory, configure as SPA"
    echo ""
    firebase init
    
    if [ $? -ne 0 ]; then
        print_error "Firebase initialization failed"
        exit 1
    fi
else
    print_success "Firebase project already initialized"
fi

# Build the project
print_status "Building the Voice Mate project..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi

print_success "Project built successfully"

# Install function dependencies
print_status "Installing Firebase Functions dependencies..."
cd functions
npm install
cd ..

if [ $? -ne 0 ]; then
    print_error "Failed to install function dependencies"
    exit 1
fi

print_success "Function dependencies installed"

# Deploy to Firebase
print_status "Deploying to Firebase..."
firebase deploy

if [ $? -eq 0 ]; then
    print_success "Deployment completed successfully!"
    echo ""
    echo "🎉 Your Voice Mate app is now live!"
    echo ""
    
    # Get project ID and show URLs
    PROJECT_ID=$(cat .firebaserc 2>/dev/null | grep -o '"default": "[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$PROJECT_ID" ]; then
        echo "Your app URLs:"
        echo "📱 Web App: https://$PROJECT_ID.web.app"
        echo "🔧 Functions: https://us-central1-$PROJECT_ID.cloudfunctions.net/api"
        echo ""
    fi
    
    echo "Next steps:"
    echo "1. Test your app at the URL above"
    echo "2. Try creating tasks and diary entries"
    echo "3. If something doesn't work, run: bash test-firebase-api.sh"
    echo "4. Check logs with: firebase functions:log --only api"
    echo ""
    
    # Test the deployment
    print_status "Testing API endpoints..."
    if [ ! -z "$PROJECT_ID" ]; then
        echo "Running quick API test..."
        chmod +x test-firebase-api.sh
        ./test-firebase-api.sh
    fi
    
else
    print_error "Deployment failed"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check your internet connection"
    echo "2. Verify Firebase login: firebase login"
    echo "3. Try deploying functions only: firebase deploy --only functions"
    echo "4. Check the troubleshooting guide: FIREBASE_TROUBLESHOOTING.md"
    exit 1
fi