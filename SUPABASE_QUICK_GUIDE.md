# Quick Supabase Setup (2 Steps)

## Step 1: Get Your Database URL (2 minutes)

1. Go to **supabase.com** → Sign up (free)
2. Create project: `voice-mate-app`
3. Settings → Database → Copy "Connection pooling" URL
4. Replace `[YOUR-PASSWORD]` with your database password

## Step 2: Deploy (1 command)

```bash
bash supabase-deploy.sh
```

**That's it!** The script will:
- Ask for your DATABASE_URL
- Let you choose deployment platform (Railway/Render/Replit)
- Build and deploy everything automatically
- Set up your database connection

## What You Get

- ✅ Real PostgreSQL database (data never disappears)
- ✅ All voice features work exactly the same
- ✅ Free hosting with 50,000 monthly users
- ✅ Better performance than Firebase
- ✅ No payment required

## Deployment Options

The script gives you 3 choices:

1. **Railway** - Automated deployment (recommended)
2. **Render** - Creates config file for GitHub deployment
3. **Replit** - Adds DATABASE_URL to your current setup

## Example DATABASE_URL

```
postgresql://postgres.abc123:yourpassword@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

Your app works exactly the same, but with a real database that persists data forever!