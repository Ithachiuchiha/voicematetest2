-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- Run ONCE on your new schema to add the profiles table
-- and rewire FKs from auth.users → profiles
-- ============================================================

-- 1. Create public.profiles (bridges auth.users ↔ app data)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    text        NOT NULL UNIQUE,
  email       text        NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Rewire diary_entries FK: auth.users → profiles
ALTER TABLE public.diary_entries
  DROP CONSTRAINT IF EXISTS diary_entries_user_id_fkey,
  ADD  CONSTRAINT diary_entries_user_id_fkey
       FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Rewire tasks FK
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_user_id_fkey,
  ADD  CONSTRAINT tasks_user_id_fkey
       FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. Rewire schedule_items FK
ALTER TABLE public.schedule_items
  DROP CONSTRAINT IF EXISTS schedule_items_user_id_fkey,
  ADD  CONSTRAINT schedule_items_user_id_fkey
       FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 5. Rewire notifications FK (if table exists)
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey,
  ADD  CONSTRAINT notifications_user_id_fkey
       FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 6. RLS: allow service role full access (your Express server uses service role key)
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications    ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically — no extra policies needed for server-side.
-- Add client-side RLS policies only if you ever use the anon/user JWT directly.
