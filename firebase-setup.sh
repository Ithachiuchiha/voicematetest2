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
    echo "Next steps:"
    echo "1. Open Firebase Console to get your live URL"
    echo "2. Test all features on the live site"
    echo "3. Share your app with others!"
    echo ""
    echo "To get your URLs:"
    echo "firebase hosting:channel:list"
else
    print_error "Deployment failed"
    exit 1
fi