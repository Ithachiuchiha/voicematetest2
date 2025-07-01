#!/bin/bash

echo "🔥 Deploying Voice Mate to Firebase..."

# Build the project
echo "📦 Building project..."
npm run build

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "⚠️  Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Initialize Firebase project (if not already done)
if [ ! -f ".firebaserc" ]; then
    echo "🚀 Initializing Firebase project..."
    firebase init
fi

# Deploy to Firebase
echo "🚀 Deploying to Firebase Hosting and Functions..."
firebase deploy

echo "✅ Deployment complete!"
echo "🌐 Your Voice Mate app is now live on Firebase!"