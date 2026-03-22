-- Forum Social Layer Migration
-- profiles already exists — just add forum-specific columns

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_color text NOT NULL DEFAULT '#4DFFED';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS athlete_score int NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak int NOT NULL DEFAULT 0;

-- Add public read policy (forum needs all users visible to each other)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_select_public'
  ) THEN
    CREATE POLICY "profiles_select_public" ON public.profiles
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- friendships: pending oder accepted
CREATE TABLE IF NOT EXISTS public.friendships (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status     text NOT NULL CHECK (status IN ('pending', 'accepted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_a, user_b)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'friendships_select') THEN
    CREATE POLICY "friendships_select" ON public.friendships FOR SELECT TO authenticated
      USING (user_a = auth.uid() OR user_b = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'friendships_insert') THEN
    CREATE POLICY "friendships_insert" ON public.friendships FOR INSERT TO authenticated
      WITH CHECK (user_a = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'friendships_update') THEN
    CREATE POLICY "friendships_update" ON public.friendships FOR UPDATE TO authenticated
      USING (user_a = auth.uid() OR user_b = auth.uid());
  END IF;
END $$;

-- channels: general (1 global), dm, group
CREATE TABLE IF NOT EXISTS public.channels (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type         text NOT NULL CHECK (type IN ('general', 'dm', 'group')),
  name         text,
  participants uuid[] NOT NULL DEFAULT '{}',
  created_by   uuid REFERENCES public.profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'channels' AND policyname = 'channels_select') THEN
    CREATE POLICY "channels_select" ON public.channels FOR SELECT TO authenticated
      USING (type = 'general' OR auth.uid() = ANY(participants));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'channels' AND policyname = 'channels_insert') THEN
    CREATE POLICY "channels_insert" ON public.channels FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = ANY(participants) OR type = 'general');
  END IF;
END $$;

-- Seed: Global General-Channel
INSERT INTO public.channels (type, name) VALUES ('general', 'General') ON CONFLICT DO NOTHING;

-- messages
CREATE TABLE IF NOT EXISTS public.messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  sender_id  uuid NOT NULL REFERENCES public.profiles(id),
  content    text NOT NULL DEFAULT '',
  type       text NOT NULL CHECK (type IN ('text', 'workout_card')) DEFAULT 'text',
  metadata   jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'messages_select') THEN
    CREATE POLICY "messages_select" ON public.messages FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.channels c
          WHERE c.id = channel_id
            AND (c.type = 'general' OR auth.uid() = ANY(c.participants))
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'messages_insert') THEN
    CREATE POLICY "messages_insert" ON public.messages FOR INSERT TO authenticated
      WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
          SELECT 1 FROM public.channels c
          WHERE c.id = channel_id
            AND (c.type = 'general' OR auth.uid() = ANY(c.participants))
        )
      );
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS messages_channel_created ON public.messages (channel_id, created_at ASC);
CREATE INDEX IF NOT EXISTS channels_participants ON public.channels USING GIN (participants);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
