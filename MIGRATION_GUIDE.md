# Migration Guide — Schema v2 + Supabase Auth

## What changed and why

| Layer | Before | After |
|---|---|---|
| User storage | `public.users` (username + bcrypt hash) | `auth.users` (Supabase Auth) + `public.profiles` (username) |
| Sign-in lookup | `getUserByUsername` → verify bcrypt | `profiles` username→email lookup → `supabase.auth.signInWithPassword` |
| Password reset | Generate weak temp password | Supabase sends a secure reset email |
| FKs | `→ auth.users(id)` (broken — inserts failed) | `→ profiles(id)` (profiles.id = auth.users.id, always) |
| Notifications | Missing from Drizzle schema | Added |

---

## Step 1 — Install new dependency

```bash
npm install @supabase/supabase-js
```

---

## Step 2 — Set environment variables

Add these to your `.env` / Replit Secrets / Railway variables:

```
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SESSION_SECRET=your-random-secret-string
```

**Where to find them:**
- `DATABASE_URL` → Supabase Dashboard → Settings → Database → Connection pooling → Transaction mode
- `SUPABASE_URL` → Project Settings → API → Project URL
- `SUPABASE_SERVICE_ROLE_KEY` → Project Settings → API → `service_role` key (secret — never expose client-side)

---

## Step 3 — Run the SQL migration

Open **Supabase Dashboard → SQL Editor** and run the contents of `SCHEMA_MIGRATION.sql`.

This:
- Creates `public.profiles` table
- Rewires FKs on all data tables from `auth.users` → `profiles`
- Enables RLS (your service role key bypasses it automatically)

---

## Step 4 — Replace the 6 changed files

Copy from this fixed project into yours:

```
shared/schema.ts                          ← profiles table, notifications, updated auth schemas
server/config.ts                          ← adds SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
server/db.ts                              ← adds supabaseAdmin client
server/storage.ts                         ← profiles instead of users, notifications added
server/routes.ts                          ← auth uses Supabase, forgot-password sends real email
client/src/components/auth-dialog.tsx     ← forgot-password now email-only (no username)
```

---

## How auth works now

```
SIGN UP
  User: username + email + password
  → Server validates uniqueness against profiles table
  → supabase.auth.admin.createUser({email, password})  ← creates auth.users row
  → INSERT INTO profiles (id=auth_user.id, username, email)
  → Session: userId = auth.users.id

SIGN IN  (username-based, UX unchanged)
  User: username + password
  → SELECT email FROM profiles WHERE username = ?
  → supabase.auth.signInWithPassword({email, password})  ← validates credentials
  → Session: userId = profiles.id

FORGOT PASSWORD
  User: email only
  → supabase.auth.resetPasswordForEmail(email)  ← Supabase sends reset link
  → Always returns success (prevents email enumeration)
```

---

## Checklist

- [ ] `npm install @supabase/supabase-js`
- [ ] Three env vars set (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] `SCHEMA_MIGRATION.sql` run in Supabase SQL Editor
- [ ] 6 files replaced
- [ ] App restarts cleanly (watch server logs for `✅ Supabase Admin client ready`)
