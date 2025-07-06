# 🎯 How to Find Your Database Connection String

## You're currently providing: ❌
```
https://iyrsvlmnhqvwnbeifdqi.supabase.co
```
**This is your PROJECT URL (for the dashboard)**

## I need this instead: ✅
```
postgresql://postgres.iyrsvlmnhqvwnbeifdqi:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```
**This is your DATABASE CONNECTION STRING (for code)**

---

## 📋 Step-by-Step Instructions:

### 1. Open Supabase Dashboard
- Go to: https://iyrsvlmnhqvwnbeifdqi.supabase.co

### 2. Navigate to Database Settings
- Look at the LEFT SIDEBAR
- Click the ⚙️ **Settings** icon (at the bottom)
- In settings menu, click **"Database"**

### 3. Find Connection String Section
- Scroll down until you see **"Connection string"**
- You'll see TWO tabs:
  - "Direct connection" 
  - **"Connection pooling"** ← Click this one

### 4. Copy the PostgreSQL URL
- You'll see a text box with a URL starting with `postgresql://`
- It will look like: `postgresql://postgres.iyrsvlmnhqvwnbeifdqi:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

### 5. Replace the Password
- Replace `[YOUR-PASSWORD]` with your actual database password
- The password is the one you set when creating your Supabase project

---

## 🔍 What to Look For:
- ✅ Starts with `postgresql://`
- ✅ Contains `pooler.supabase.com`
- ✅ Has your real password (not `[YOUR-PASSWORD]`)
- ✅ Ends with `/postgres`

## ❌ Common Mistakes:
- Using the project URL (starts with `https://`)
- Using the direct connection instead of connection pooling
- Leaving `[YOUR-PASSWORD]` placeholder text
- Copying from the wrong section

---

## 📱 If You Can't Find It:
The connection string is specifically in:
**Settings → Database → Connection string → Connection pooling tab**

It's NOT in:
- Project settings
- API settings  
- Your project URL
- Authentication settings