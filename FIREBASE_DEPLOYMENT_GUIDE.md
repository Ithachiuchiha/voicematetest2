# Firebase Deployment Guide for Voice Mate

## Prerequisites

### 1. Google Account Setup
- Create a Google account if you don't have one
- Go to [Firebase Console](https://console.firebase.google.com/)
- Sign in with your Google account

### 2. Install Firebase CLI
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Verify installation
firebase --version
```

## Step 1: Create Firebase Project

### 1.1 Create New Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `voice-mate-app` (or your preferred name)
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Required Services
1. In your Firebase project dashboard:
   - Click "Hosting" in the left sidebar
   - Click "Get started"
   - Click "Functions" in the left sidebar
   - Click "Get started"

## Step 2: Initialize Firebase in Your Project

### 2.1 Login to Firebase
```bash
# Login to Firebase (opens browser)
firebase login
```

### 2.2 Initialize Firebase Project
```bash
# Run in your project root directory
firebase init

# Select the following options:
# ◉ Functions: Configure a Cloud Functions directory
# ◉ Hosting: Configure files for Firebase Hosting
# 
# Choose existing project: voice-mate-app
# 
# Functions setup:
# - Language: JavaScript
# - ESLint: No
# - Install dependencies: Yes
# 
# Hosting setup:
# - Public directory: dist/public
# - Single-page app: Yes
# - Overwrite index.html: No
```

## Step 3: Configure Project Files

### 3.1 Update firebase.json
Replace the generated `firebase.json` with:
```json
{
  "hosting": {
    "public": "dist/public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**",
        "headers": [
          {
            "key": "Cross-Origin-Embedder-Policy",
            "value": "unsafe-none"
          },
          {
            "key": "Cross-Origin-Opener-Policy",
            "value": "same-origin-allow-popups"
          }
        ]
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
```

### 3.2 Update functions/package.json
```json
{
  "name": "voice-mate-functions",
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": "18"
  },
  "main": "index.js",
  "dependencies": {
    "express": "^4.19.2",
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.7.0",
    "zod": "^3.23.8",
    "cors": "^2.8.5"
  }
}
```

### 3.3 Update functions/index.js
```javascript
import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';

const app = express();

// Enable CORS for all routes
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// In-memory storage for Firebase Functions
class MemStorage {
  constructor() {
    this.diaryEntries = new Map();
    this.tasks = new Map();
    this.scheduleItems = new Map();
    this.currentDiaryId = 1;
    this.currentTaskId = 1;
    this.currentScheduleId = 1;
  }

  async getDiaryEntriesByDate(date) {
    return Array.from(this.diaryEntries.values())
      .filter(entry => entry.date === date)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async createDiaryEntry(entry) {
    const id = this.currentDiaryId++;
    const newEntry = {
      ...entry,
      id,
      timestamp: new Date(),
    };
    this.diaryEntries.set(id, newEntry);
    return newEntry;
  }

  async deleteDiaryEntry(id) {
    this.diaryEntries.delete(id);
  }

  async getAllTasks() {
    return Array.from(this.tasks.values());
  }

  async createTask(task) {
    const id = this.currentTaskId++;
    const newTask = {
      ...task,
      id,
      createdAt: new Date(),
      completedAt: null,
    };
    this.tasks.set(id, newTask);
    return newTask;
  }

  async updateTask(id, updates) {
    const existingTask = this.tasks.get(id);
    if (!existingTask) throw new Error('Task not found');
    
    const updatedTask = { ...existingTask, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id) {
    this.tasks.delete(id);
  }

  async getAllScheduleItems() {
    return Array.from(this.scheduleItems.values());
  }

  async createScheduleItem(item) {
    const id = this.currentScheduleId++;
    const newItem = {
      ...item,
      id,
    };
    this.scheduleItems.set(id, newItem);
    return newItem;
  }

  async updateScheduleItem(id, updates) {
    const existingItem = this.scheduleItems.get(id);
    if (!existingItem) throw new Error('Schedule item not found');
    
    const updatedItem = { ...existingItem, ...updates };
    this.scheduleItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteScheduleItem(id) {
    this.scheduleItems.delete(id);
  }
}

const storage = new MemStorage();

// API Routes
app.get('/api/diary/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const entries = await storage.getDiaryEntriesByDate(date);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch diary entries' });
  }
});

app.post('/api/diary', async (req, res) => {
  try {
    const newEntry = await storage.createDiaryEntry(req.body);
    res.json(newEntry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create diary entry' });
  }
});

app.delete('/api/diary/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteDiaryEntry(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete diary entry' });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await storage.getAllTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const newTask = await storage.createTask(req.body);
    res.json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updatedTask = await storage.updateTask(id, req.body);
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteTask(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

app.get('/api/schedule', async (req, res) => {
  try {
    const items = await storage.getAllScheduleItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schedule items' });
  }
});

app.post('/api/schedule', async (req, res) => {
  try {
    const newItem = await storage.createScheduleItem(req.body);
    res.json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create schedule item' });
  }
});

app.patch('/api/schedule/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updatedItem = await storage.updateScheduleItem(id, req.body);
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update schedule item' });
  }
});

app.delete('/api/schedule/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteScheduleItem(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete schedule item' });
  }
});

export const api = onRequest(app);
```

## Step 4: Build and Deploy

### 4.1 Build Your Project
```bash
# Build the React frontend
npm run build
```

### 4.2 Install Function Dependencies
```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Go back to root
cd ..
```

### 4.3 Deploy to Firebase
```bash
# Deploy both hosting and functions
firebase deploy

# Or deploy individually:
# firebase deploy --only hosting
# firebase deploy --only functions
```

## Step 5: Verify Deployment

### 5.1 Check URLs
After deployment, Firebase will provide:
- **Hosting URL**: `https://voice-mate-app.web.app`
- **Function URL**: `https://us-central1-voice-mate-app.cloudfunctions.net/api`

### 5.2 Test Your Application
1. Open the hosting URL in your browser
2. Test voice recognition functionality
3. Create a few diary entries and tasks
4. Verify all features work correctly

## Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain
1. In Firebase Console, go to Hosting
2. Click "Add custom domain"
3. Enter your domain name
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning

## Troubleshooting

### Common Issues and Solutions

#### 1. Build Errors
```bash
# Clear cache and rebuild
rm -rf dist node_modules
npm install
npm run build
```

#### 2. Function Deployment Errors
```bash
# Check function logs
firebase functions:log

# Redeploy functions only
firebase deploy --only functions
```

#### 3. CORS Issues
- The functions/index.js already includes CORS configuration
- If you still have issues, check browser console for specific errors

#### 4. Voice Recognition Not Working
- Ensure your Firebase domain uses HTTPS (automatic)
- Check browser permissions for microphone access
- Test in Chrome/Edge (best support for Web Speech API)

## Environment Variables (Optional)

### For Production Database
If you want to use a real database instead of in-memory storage:

1. Set up Firebase Firestore:
```bash
firebase init firestore
```

2. Update functions to use Firestore:
```javascript
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

initializeApp();
const db = getFirestore();
```

## Monitoring and Analytics

### 5.1 Enable Analytics
1. Go to Firebase Console > Analytics
2. Enable Google Analytics for your project
3. View usage statistics and performance metrics

### 5.2 Monitor Functions
1. Go to Firebase Console > Functions
2. View execution logs and performance
3. Monitor usage and costs

## Costs and Limits

### Free Tier Includes:
- **Hosting**: 10GB storage, 1GB transfer/month
- **Functions**: 2M invocations/month, 400K GB-seconds/month
- **Storage**: 1GB for Firestore (if used)

Your Voice Mate app will easily stay within free limits for personal use.

## Maintenance

### Regular Tasks:
1. **Monitor usage** in Firebase Console
2. **Update dependencies** monthly
3. **Deploy updates** with `firebase deploy`
4. **Backup data** if using Firestore

## Security Best Practices

1. **Enable App Check** for production
2. **Set up Security Rules** for Firestore (if used)
3. **Use Environment Variables** for sensitive data
4. **Monitor authentication** and access patterns

---

## Quick Deploy Script

Save this as `deploy.sh` for one-command deployment:

```bash
#!/bin/bash
echo "Building and deploying Voice Mate to Firebase..."

# Build project
npm run build

# Install function dependencies
cd functions && npm install && cd ..

# Deploy to Firebase
firebase deploy

echo "Deployment complete! Check Firebase Console for live URL."
```

Make it executable: `chmod +x deploy.sh`
Run with: `./deploy.sh`