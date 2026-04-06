-- Add is_coach column to profiles table for Coach Arved bot identification
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_coach boolean NOT NULL DEFAULT false;

-- Grant coach role to existing coach accounts (none currently, but scaffold RLS)
-- No specific rows to update — Coach Arved is a virtual profile in lib/forum.ts
