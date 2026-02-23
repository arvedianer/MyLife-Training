-- MY LIFE Training App — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────
create table public.profiles (
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

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────
-- WORKOUT SESSIONS
-- ─────────────────────────────────────────
create table public.sessions (
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

create policy "Users can manage own sessions"
  on public.sessions for all
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- SESSION EXERCISES
-- ─────────────────────────────────────────
create table public.session_exercises (
  id           uuid primary key default uuid_generate_v4(),
  session_id   uuid references public.sessions on delete cascade not null,
  user_id      uuid references auth.users on delete cascade not null,
  exercise_id  text not null,
  exercise_name text not null,
  sets         jsonb not null default '[]',  -- [{weight, reps, completed}]
  created_at   timestamptz not null default now()
);

alter table public.session_exercises enable row level security;

create policy "Users can manage own session exercises"
  on public.session_exercises for all
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- PERSONAL RECORDS
-- ─────────────────────────────────────────
create table public.personal_records (
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

create policy "Users can manage own PRs"
  on public.personal_records for all
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- CUSTOM SPLITS
-- ─────────────────────────────────────────
create table public.custom_splits (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users on delete cascade not null,
  name         text not null,
  days_per_week int not null,
  days         jsonb not null default '[]',  -- [{name, exerciseIds[]}]
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.custom_splits enable row level security;

create policy "Users can manage own splits"
  on public.custom_splits for all
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
create index sessions_user_id_date on public.sessions (user_id, date desc);
create index session_exercises_session_id on public.session_exercises (session_id);
create index personal_records_user_exercise on public.personal_records (user_id, exercise_id);
create index custom_splits_user_id on public.custom_splits (user_id);
