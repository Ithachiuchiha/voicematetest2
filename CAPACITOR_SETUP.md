# Voice Mate - Capacitor Android Build Guide

This guide will help you convert the Voice Mate PWA into an Android APK using Capacitor.

## Prerequisites

Before starting, ensure you have:

- Node.js 18+ installed
- Android Studio installed with Android SDK
- Java Development Kit (JDK) 11 or higher
- Gradle (usually comes with Android Studio)

## Step 1: Install Capacitor

```bash
# Install Capacitor CLI globally
npm install -g @capacitor/cli

# Install Capacitor core and Android platform
npm install @capacitor/core @capacitor/android

# Install required Capacitor plugins
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/keyboard
npm install @capacitor/local-notifications @capacitor/push-notifications
npm install @capacitor/haptics @capacitor/device @capacitor/network
npm install @capacitor/storage @capacitor/filesystem @capacitor/camera
npm install @capacitor/microphone
```

## Step 2: Build the Web App

```bash
# Build the production version of your web app
npm run build
```

## Step 3: Initialize Capacitor

```bash
# Initialize Capacitor (run only once)
npx cap init "Voice Mate" "com.voicemate.app" --web-dir=dist/public

# Add Android platform
npx cap add android
```

## Step 4: Configure Android

The `capacitor.config.ts` file has been pre-configured with all necessary settings for Voice Mate.

### Key Configuration Features:
- **App ID**: `com.voicemate.app`
- **Splash Screen**: Pink theme with 3-second display
- **Status Bar**: Light content with pink background
- **Notifications**: Local notifications enabled with custom sound support
- **Permissions**: Microphone, storage, camera, and notification permissions
- **Keyboard**: Optimized for mobile input

## Step 5: Sync and Build

```bash
# Copy web assets and sync with native project
npx cap sync android

# Open Android Studio to build APK
npx cap open android
```

## Step 6: Android Studio Build Process

1. **Open Project**: Android Studio will open with your Capacitor project
2. **Sync Gradle**: Wait for Gradle sync to complete
3. **Build APK**: 
   - Go to `Build > Build Bundle(s) / APK(s) > Build APK(s)`
   - Or use: `./gradlew assembleDebug` in terminal

## Step 7: Generate Signed APK (Production)

For Google Play Store release:

1. **Create Keystore**:
```bash
keytool -genkey -v -keystore voice-mate-key.keystore -alias voice-mate -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configure Signing** in `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('../../voice-mate-key.keystore')
            storePassword 'your-store-password'
            keyAlias 'voice-mate'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

3. **Build Release APK**:
```bash
cd android
./gradlew assembleRelease
```

## Required Android Files

### 1. AndroidManifest.xml Permissions
- `RECORD_AUDIO`: Voice recording functionality
- `POST_NOTIFICATIONS`: Local notifications
- `INTERNET`: API communication
- `VIBRATE`: Haptic feedback
- `WAKE_LOCK`: Background operations

### 2. App Icons
Place app icons in:
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` (72x72)
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` (48x48)
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` (96x96)
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` (144x144)
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192x192)

### 3. Splash Screen Resources
Place splash screen images in:
- `android/app/src/main/res/drawable/splash.png`
- Various density folders for different screen sizes

## Testing

### Debug APK Testing
1. Enable USB Debugging on Android device
2. Connect device to computer
3. Run: `npx cap run android`

### Physical Device Installation
1. Transfer APK to device
2. Enable "Install from Unknown Sources"
3. Install APK file

## Troubleshooting

### Common Issues:

1. **Gradle Build Failure**:
   ```bash
   cd android
   ./gradlew clean
   ./gradlew build
   ```

2. **Permission Denied Errors**:
   ```bash
   chmod +x android/gradlew
   ```

3. **Java Version Issues**:
   - Ensure JDK 11+ is installed
   - Set JAVA_HOME environment variable

4. **Android SDK Issues**:
   - Install required SDK versions in Android Studio
   - Update build tools to latest version

### Useful Commands:

```bash
# Clean and rebuild
npx cap sync android --force

# Check Capacitor installation
npx cap doctor

# View connected devices
npx cap run android --list

# Live reload during development
npx cap run android --livereload --external
```

## File Locations

After building, your APK will be located at:
- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `android/app/build/outputs/apk/release/app-release.apk`

## Next Steps

1. Test the APK thoroughly on various Android devices
2. Optimize app size and performance
3. Submit to Google Play Store (requires signed release APK)
4. Set up continuous integration for automated builds

For more detailed information, refer to the [Official Capacitor Documentation](https://capacitorjs.com/docs/android).