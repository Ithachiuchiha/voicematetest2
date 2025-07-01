# Firebase Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. Can't Create Tasks, Diary Entries, or Schedule Items

**Problem**: After deploying to Firebase, you can see the app but can't create any new data.

**Causes & Solutions**:

#### A. Function Not Deployed Properly
```bash
# Check if functions are deployed
firebase functions:list

# If no functions listed, deploy functions
firebase deploy --only functions
```

#### B. API Routes Not Working
```bash
# Check function logs for errors
firebase functions:log

# Look for errors in the logs
firebase functions:log --only api
```

#### C. CORS Issues
The `functions/index.js` already includes CORS setup, but if you still have issues:

1. Check browser console for CORS errors
2. Ensure the function has proper CORS headers
3. Try accessing the function URL directly

#### D. Missing Function Dependencies
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 2. Function URL Testing

**Test your API endpoints directly**:

1. Get your function URL from Firebase Console
2. Test each endpoint:

```bash
# Replace YOUR_PROJECT_ID with your actual project ID

# Test GET diary entries
curl "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/api/api/diary/2025-01-01"

# Test POST diary entry
curl -X POST "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/api/api/diary" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test entry", "date": "2025-01-01"}'

# Test GET tasks
curl "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/api/api/tasks"

# Test POST task
curl -X POST "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/api/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test task", "description": "Test", "status": "not_started", "priority": "medium"}'
```

### 3. Deployment Checklist

Before deploying, ensure:

- [ ] `npm run build` runs successfully
- [ ] `dist/public` directory exists with built files
- [ ] `functions/package.json` has all dependencies
- [ ] `firebase.json` has correct configuration
- [ ] Firebase project is initialized

### 4. Complete Redeployment Steps

If nothing works, try a complete redeployment:

```bash
# 1. Clean build
rm -rf dist node_modules
npm install
npm run build

# 2. Clean functions
cd functions
rm -rf node_modules
npm install
cd ..

# 3. Redeploy everything
firebase deploy
```

### 5. Debugging Firebase Functions

#### Enable Debug Logging
The functions already have logging enabled. To view logs:

```bash
# View all function logs
firebase functions:log

# View logs for specific function
firebase functions:log --only api

# Follow logs in real-time
firebase functions:log --only api --streaming
```

#### Check Function Status
```bash
# List all functions
firebase functions:list

# Get function details
firebase functions:config:get
```

### 6. Browser Developer Tools

Check your browser's developer tools:

1. **Console Tab**: Look for JavaScript errors
2. **Network Tab**: Check if API calls are failing
3. **Application Tab**: Check if service worker is working

### 7. Firebase Console Debugging

In Firebase Console:

1. Go to **Functions** → **Logs**
2. Look for error messages
3. Check **Usage** tab for function invocations
4. Verify **Configuration** is correct

### 8. Common Error Messages

#### "Failed to fetch"
- **Cause**: Network issues or CORS problems
- **Solution**: Check browser console for specific error

#### "Function not found"
- **Cause**: Function not deployed or incorrect name
- **Solution**: Verify function name in `firebase.json` matches exported function

#### "Internal server error"
- **Cause**: Error in function code
- **Solution**: Check function logs for specific error details

### 9. Verify Firebase Configuration

Ensure your `firebase.json` is correct:

```json
{
  "hosting": {
    "public": "dist/public",
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
```

### 10. Test Local vs Deployed

**Local Testing**:
```bash
# Test local functions
firebase emulators:start --only functions,hosting

# Test on localhost:5000
```

**Deployed Testing**:
- Use your Firebase hosting URL
- Check Firebase Console for live function URLs

### 11. Data Persistence Issue

**Problem**: Data doesn't persist between function calls

**Cause**: Firebase Functions are stateless, in-memory storage resets

**Solutions**:
1. **Upgrade to Firestore** (recommended for production)
2. **Use Firebase Realtime Database**
3. **Accept that data resets** (current setup)

### 12. Firestore Upgrade (Optional)

If you want persistent data:

```bash
# Initialize Firestore
firebase init firestore

# Update functions to use Firestore
# (Requires code changes in functions/index.js)
```

### 13. Step-by-Step Debugging

1. **Check if app loads**: Does the main page load?
2. **Check console**: Any JavaScript errors?
3. **Check network**: Do API calls reach the server?
4. **Check function logs**: Are functions receiving requests?
5. **Check function responses**: Are functions returning data?

### 14. Getting Help

If you're still stuck:

1. **Check Firebase Console** → Functions → Logs
2. **Copy exact error messages**
3. **Test API endpoints directly** using curl
4. **Verify build output** in `dist/public`

### 15. Contact Support

When asking for help, provide:
- Exact error messages
- Firebase project ID
- Steps you've already tried
- Browser console output
- Function logs output

---

## Quick Fix Commands

```bash
# Complete rebuild and redeploy
rm -rf dist && npm run build && firebase deploy

# Redeploy only functions
firebase deploy --only functions

# View function logs
firebase functions:log --only api

# Test function locally
firebase emulators:start --only functions
```