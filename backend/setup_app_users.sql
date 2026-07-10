-- Run this SQL in your Supabase Dashboard → SQL Editor
-- This creates the custom app_users table used by SafeSphere auth
-- (completely independent of Supabase Auth — no emails, no rate limits)

CREATE TABLE IF NOT EXISTS public.app_users (
  id           UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  email        TEXT         NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  full_name    TEXT         DEFAULT '',
  phone        TEXT         DEFAULT '',
  created_at   TIMESTAMPTZ  DEFAULT now()
);

-- Allow your backend (using the anon/publishable key) to read/write
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Policy: allow all inserts (registration)
CREATE POLICY "Allow insert for all" ON public.app_users
  FOR INSERT WITH CHECK (true);

-- Policy: allow select by email (login lookup)
CREATE POLICY "Allow select by email" ON public.app_users
  FOR SELECT USING (true);
