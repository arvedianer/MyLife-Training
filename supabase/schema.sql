-- MY LIFE Training App — Supabase Schema (Idempotent Version)
-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  username    text unique not null,
  goal        text,         -- 'muscle' | 'strength' | 'endurance' | 'weight_loss' | 'health'
  level       text,         -- 'beginner' | 'intermediate' | 'advanced'
  training_days int,        -- 2-6
  equipment   text,         -- 'full_gym' | 'home_basic' | 'bodyweight_only'
  weight_unit text not null default 'kg',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can view own profile') then
    create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can update own profile') then
    create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can insert own profile') then
    create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
  end if;
end $$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end $$;


-- ─────────────────────────────────────────
-- WORKOUT SESSIONS
-- ─────────────────────────────────────────
create table if not exists public.sessions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users on delete cascade not null,
  date         text not null,        -- 'YYYY-MM-DD'
  split_name   text,
  duration     int not null default 0,   -- seconds
  total_volume numeric not null default 0,
  notes        text,
  created_at   timestamptz not null default now()
);

alter table public.sessions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'sessions' and policyname = 'Users can manage own sessions') then
    create policy "Users can manage own sessions" on public.sessions for all using (auth.uid() = user_id);
  end if;
end $$;

-- ─────────────────────────────────────────
-- SESSION EXERCISES
-- ─────────────────────────────────────────
create table if not exists public.session_exercises (
  id           uuid primary key default uuid_generate_v4(),
  session_id   uuid references public.sessions on delete cascade not null,
  user_id      uuid references auth.users on delete cascade not null,
  exercise_id  text not null,
  exercise_name text not null,
  sets         jsonb not null default '[]',  -- [{weight, reps, completed}]
  created_at   timestamptz not null default now()
);

alter table public.session_exercises enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'session_exercises' and policyname = 'Users can manage own session exercises') then
    create policy "Users can manage own session exercises" on public.session_exercises for all using (auth.uid() = user_id);
  end if;
end $$;

-- ─────────────────────────────────────────
-- PERSONAL RECORDS
-- ─────────────────────────────────────────
create table if not exists public.personal_records (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users on delete cascade not null,
  exercise_id  text not null,
  weight       numeric not null,
  reps         int not null,
  date         text not null,   -- 'YYYY-MM-DD'
  session_id   uuid references public.sessions on delete set null,
  created_at   timestamptz not null default now(),
  unique(user_id, exercise_id)
);

alter table public.personal_records enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'personal_records' and policyname = 'Users can manage own PRs') then
    create policy "Users can manage own PRs" on public.personal_records for all using (auth.uid() = user_id);
  end if;
end $$;

-- ─────────────────────────────────────────
-- CUSTOM SPLITS
-- ─────────────────────────────────────────
create table if not exists public.custom_splits (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users on delete cascade not null,
  name         text not null,
  days_per_week int not null,
  days         jsonb not null default '[]',  -- [{name, exerciseIds[]}]
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.custom_splits enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'custom_splits' and policyname = 'Users can manage own splits') then
    create policy "Users can manage own splits" on public.custom_splits for all using (auth.uid() = user_id);
  end if;
end $$;

-- ─────────────────────────────────────────
-- COMMUNITY EXERCISES
-- ─────────────────────────────────────────
create table if not exists public.community_exercises (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  name_de          text not null,
  primary_muscle   text not null,
  secondary_muscles text[] not null default '{}',
  equipment        text[] not null,
  category         text not null,
  default_sets     int not null default 3,
  default_reps     int not null default 10,
  default_weight   numeric not null default 0,
  rep_range_min    int not null default 8,
  rep_range_max    int not null default 12,
  rest_seconds     int not null default 90,
  science_note     text not null default '',
  is_public        boolean not null default true,
  created_by       uuid references auth.users on delete cascade not null,
  created_at       timestamptz not null default now()
);

-- ADD COLUMN IF NOT EXISTS in case the table existed without it
alter table public.community_exercises add column if not exists is_public boolean not null default true;

alter table public.community_exercises enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'community_exercises' and policyname = 'Anyone can read community exercises') then
    create policy "Anyone can read community exercises" on public.community_exercises for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'community_exercises' and policyname = 'Users can insert own community exercises') then
    create policy "Users can insert own community exercises" on public.community_exercises for insert with check (auth.uid() = created_by);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'community_exercises' and policyname = 'Users can update own community exercises') then
    create policy "Users can update own community exercises" on public.community_exercises for update using (auth.uid() = created_by) with check (auth.uid() = created_by);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'community_exercises' and policyname = 'Users can delete own community exercises') then
    create policy "Users can delete own community exercises" on public.community_exercises for delete using (auth.uid() = created_by);
  end if;
end $$;

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
create index if not exists sessions_user_id_date on public.sessions (user_id, date desc);
create index if not exists session_exercises_session_id on public.session_exercises (session_id);
create index if not exists personal_records_user_exercise on public.personal_records (user_id, exercise_id);
create index if not exists custom_splits_user_id on public.custom_splits (user_id);
create index if not exists community_exercises_created_by on public.community_exercises (created_by);

-- ─────────────────────────────────────────
-- AI INTERACTIONS (Groq Coach logging)
-- ─────────────────────────────────────────
create table if not exists public.ai_interactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  session_id  uuid references public.sessions on delete set null,
  trigger_type text not null, -- 'device_busy' | 'pain' | 'time_crunch' | 'post_workout'
  user_input  text,
  ai_response jsonb,
  tokens_used int,
  model       text default 'llama-3.1-70b-versatile',
  created_at  timestamptz default now()
);

alter table public.ai_interactions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'ai_interactions' and policyname = 'ai_interactions_own') then
    create policy "ai_interactions_own" on public.ai_interactions for all using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists ai_interactions_user_id on public.ai_interactions (user_id, created_at desc);

-- ─────────────────────────────────────────
-- EQUIPMENT NOTES (per-exercise user notes)
-- ─────────────────────────────────────────
create table if not exists public.equipment_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  exercise_id text not null,
  note        text not null,
  updated_at  timestamptz default now(),
  unique(user_id, exercise_id)
);

alter table public.equipment_notes enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'equipment_notes' and policyname = 'equipment_notes_own') then
    create policy "equipment_notes_own" on public.equipment_notes for all using (auth.uid() = user_id);
  end if;
end $$;
