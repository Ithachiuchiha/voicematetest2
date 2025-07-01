#!/bin/bash

# Voice Mate - Android Build Preparation Script
# This script automates the setup process for converting the PWA to Android APK

set -e  # Exit on any error

echo "🚀 Voice Mate - Android Build Preparation"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install JDK 11+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install Capacitor CLI globally if not installed
if ! command -v cap &> /dev/null; then
    echo "📦 Installing Capacitor CLI globally..."
    npm install -g @capacitor/cli
else
    echo "✅ Capacitor CLI already installed"
fi

# Install Capacitor dependencies
echo "📦 Installing Capacitor core packages..."
npm install @capacitor/core @capacitor/android

echo "📦 Installing Capacitor plugins..."
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/keyboard
npm install @capacitor/local-notifications @capacitor/push-notifications
npm install @capacitor/haptics @capacitor/device @capacitor/network
npm install @capacitor/storage @capacitor/filesystem @capacitor/camera

# Build the web application
echo "🏗️  Building web application..."
npm run build

# Initialize Capacitor if not already done
if [ ! -f "capacitor.config.ts" ]; then
    echo "⚙️  Initializing Capacitor..."
    npx cap init "Voice Mate" "com.voicemate.app" --web-dir=dist/public
else
    echo "✅ Capacitor already initialized"
fi

# Add Android platform if not already added
if [ ! -d "android" ]; then
    echo "📱 Adding Android platform..."
    npx cap add android
else
    echo "✅ Android platform already added"
fi

# Sync web assets with native project
echo "🔄 Syncing web assets with Android project..."
npx cap sync android

echo ""
echo "🎉 Setup Complete! Next steps:"
echo "1. Open Android Studio: npx cap open android"
echo "2. Wait for Gradle sync to complete"
echo "3. Build APK: Build > Build Bundle(s) / APK(s) > Build APK(s)"
echo ""
echo "📁 Your APK will be located at:"
echo "   android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "📚 For detailed instructions, see:"
echo "   - CAPACITOR_SETUP.md"
echo "   - APP_DEPLOYMENT_GUIDE.md"
echo "   - DEPENDENCIES_DOCUMENTATION.md"
echo ""
echo "✨ Voice Mate Android preparation complete!"