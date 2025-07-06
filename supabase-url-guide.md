# Get Your Supabase Database URL

You provided: `https://iyrsvlmnhqvwnbeifdqi.supabase.co`

But we need the **DATABASE CONNECTION STRING**, not the project URL.

## Steps to Get the Correct URL:

1. **Go to your Supabase project**: https://iyrsvlmnhqvwnbeifdqi.supabase.co
2. **Go to Settings** (gear icon in sidebar)
3. **Click on "Database"** in the settings menu
4. **Scroll down to "Connection string"**
5. **Select "Connection pooling"** (recommended for production)
6. **Copy the PostgreSQL URL** - it should look like:

```
postgresql://postgres.iyrsvlmnhqvwnbeifdqi:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

7. **Replace `[YOUR-PASSWORD]`** with your actual database password
8. **The final URL should start with `postgresql://`**

## What You Need:
- A connection string starting with `postgresql://`
- Contains `pooler.supabase.com` (for connection pooling)
- Has your actual password (not `[YOUR-PASSWORD]`)

## Example Format:
```
postgresql://postgres.iyrsvlmnhqvwnbeifdqi:your_actual_password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

Once you have this correct PostgreSQL connection string, I'll update the SUPABASE_DATABASE_URL secret.