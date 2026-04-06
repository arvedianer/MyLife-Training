-- Profiles: add all missing columns for full cross-device profile restore
-- Columns that already exist: id, avatar_color, athlete_score, streak,
--   goal, level, training_days, equipment, is_coach

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name             text,
  ADD COLUMN IF NOT EXISTS age              int,
  ADD COLUMN IF NOT EXISTS body_weight      numeric,        -- always in kg
  ADD COLUMN IF NOT EXISTS height           int,            -- cm
  ADD COLUMN IF NOT EXISTS training_weekdays jsonb,         -- int[] [0=Mo..6=So]
  ADD COLUMN IF NOT EXISTS secondary_goal   text,
  ADD COLUMN IF NOT EXISTS weight_unit      text NOT NULL DEFAULT 'kg',
  ADD COLUMN IF NOT EXISTS profile_created_at bigint;       -- Unix timestamp (ms)

-- Allow users to update their own profile
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'profiles_update_own'
  ) THEN
    CREATE POLICY "profiles_update_own" ON public.profiles
      FOR UPDATE TO authenticated USING (id = auth.uid());
  END IF;
END $$;

-- Allow users to insert their own profile row (needed for first OAuth login)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'profiles_insert_own'
  ) THEN
    CREATE POLICY "profiles_insert_own" ON public.profiles
      FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
  END IF;
END $$;
