# Voice Mate - Android Build Troubleshooting Guide

## Common Build Issues and Solutions

### 1. Android Gradle Plugin (AGP) Version Compatibility

**Error**: `The project is using an incompatible version (AGP 8.7.2) of the Android Gradle plugin. Latest supported version is AGP 8.5.0`

**Solution**: This error occurs when the Android Gradle Plugin version is newer than what your Android Studio version supports.

#### Quick Fix Applied:
```bash
# Files modified:
android/build.gradle - Changed AGP from 8.7.2 to 8.5.0
android/gradle/wrapper/gradle-wrapper.properties - Changed Gradle from 8.11.1 to 8.7
android/variables.gradle - Changed SDK versions from 35 to 34
```

#### Manual Fix Steps:
1. **Update android/build.gradle**:
```gradle
dependencies {
    classpath 'com.android.tools.build:gradle:8.5.0'  // Changed from 8.7.2
}
```

2. **Update android/gradle/wrapper/gradle-wrapper.properties**:
```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.7-all.zip
```

3. **Update android/variables.gradle**:
```gradle
ext {
    compileSdkVersion = 34  // Changed from 35
    targetSdkVersion = 34   // Changed from 35
}
```

### 2. AGP and Gradle Version Compatibility Matrix

| Android Studio Version | AGP Version | Gradle Version | Compile SDK |
|------------------------|-------------|----------------|-------------|
| Iguana 2023.2.1        | 8.3.0-8.4.0 | 8.6           | 34          |
| Jellyfish 2023.3.1     | 8.4.0-8.5.0 | 8.7           | 34          |
| Koala 2024.1.1         | 8.5.0-8.6.0 | 8.7-8.8       | 34          |
| Ladybug 2024.2.1       | 8.6.0-8.7.0 | 8.9           | 35          |

### 3. Other Common Android Build Issues

#### SDK Not Found
**Error**: `SDK location not found`

**Solution**:
1. Create `android/local.properties` file:
```properties
sdk.dir=/path/to/your/Android/Sdk
```

2. Or set environment variable:
```bash
export ANDROID_HOME=/path/to/your/Android/Sdk
export ANDROID_SDK_ROOT=/path/to/your/Android/Sdk
```

#### Java Version Issues
**Error**: `Unsupported Java version` or `JDK version not supported`

**Solution**:
1. Ensure you have JDK 11 or 17 installed
2. Set JAVA_HOME environment variable:
```bash
export JAVA_HOME=/path/to/jdk-11
```

#### Memory Issues
**Error**: `OutOfMemoryError` during build

**Solution**:
Add to `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.configureondemand=true
```

#### Dependency Resolution Issues
**Error**: `Could not resolve dependency` or `Failed to resolve`

**Solution**:
1. Clean and rebuild:
```bash
cd android
./gradlew clean
./gradlew build
```

2. Update repositories in `android/build.gradle`:
```gradle
allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url 'https://www.jitpack.io' }
    }
}
```

### 4. Capacitor-Specific Issues

#### Capacitor Plugin Compatibility
**Error**: Plugin version incompatibilities

**Solution**:
1. Check all Capacitor packages are same major version:
```bash
npm list | grep @capacitor
```

2. Update all Capacitor packages together:
```bash
npm install @capacitor/core@latest @capacitor/android@latest @capacitor/cli@latest
```

#### Web Assets Not Syncing
**Error**: App shows old content or white screen

**Solution**:
```bash
npm run build
npx cap copy android
npx cap sync android
```

### 5. Build Process Checklist

Before building in Android Studio:

- [ ] Node.js dependencies installed (`npm install`)
- [ ] Web app built (`npm run build`)
- [ ] Capacitor synced (`npx cap sync android`)
- [ ] Android SDK installed and configured
- [ ] Java JDK 11+ installed
- [ ] Android Studio updated to compatible version
- [ ] Gradle wrapper executable (`chmod +x android/gradlew`)

### 6. Clean Build Process

If you encounter persistent issues, try a complete clean build:

```bash
# Clean everything
rm -rf node_modules
rm -rf android/app/build
rm -rf android/build
rm -rf android/.gradle

# Reinstall and rebuild
npm install
npm run build
npx cap sync android

# Clean Android project
cd android
./gradlew clean
cd ..

# Open in Android Studio
npx cap open android
```

### 7. Version Verification Commands

Check your current versions:

```bash
# Node and npm versions
node --version
npm --version

# Java version
java -version
javac -version

# Android SDK
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --version

# Gradle version (in android directory)
cd android && ./gradlew --version

# Capacitor version
npx cap --version
```

### 8. Android Studio Configuration

#### Required SDK Components:
- Android SDK Platform-Tools
- Android SDK Build-Tools (latest)
- Android SDK Platform (API 34)
- Android Emulator (if testing on emulator)

#### Recommended Settings:
1. **File > Settings > Build > Gradle**
   - Use Gradle from: 'gradle-wrapper.properties' file
   - Gradle JVM: Use JDK 11 or 17

2. **File > Settings > Languages & Frameworks > Android SDK**
   - Verify SDK Location is set correctly
   - Install missing components if highlighted

### 9. Testing Your Build

#### Debug Build (Testing):
```bash
cd android
./gradlew assembleDebug
```
APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Release Build (Production):
```bash
cd android
./gradlew assembleRelease
```
APK location: `android/app/build/outputs/apk/release/app-release.apk`

### 10. Getting Help

If issues persist:

1. **Check Android Studio Build Output**
   - View > Tool Windows > Build
   - Look for specific error messages

2. **Gradle Console Output**
   - View detailed error messages in Gradle console

3. **Capacitor Community**
   - [Capacitor GitHub Issues](https://github.com/ionic-team/capacitor/issues)
   - [Capacitor Discord](https://discord.gg/UPYYRhtyzp)

4. **Android Developer Resources**
   - [Android Studio Troubleshooting](https://developer.android.com/studio/troubleshoot)
   - [Gradle Build Issues](https://docs.gradle.org/current/userguide/troubleshooting.html)

### 11. Version Update Strategy

To avoid future compatibility issues:

1. **Stay on Stable Versions**
   - Don't immediately update to latest Android Studio beta
   - Wait for stable AGP releases

2. **Update Process**
   - Update Android Studio first
   - Then update AGP version
   - Finally update Gradle wrapper

3. **Test After Updates**
   - Always test builds after version updates
   - Keep backups of working configurations

This troubleshooting guide should help resolve most Android build issues you might encounter with Voice Mate.