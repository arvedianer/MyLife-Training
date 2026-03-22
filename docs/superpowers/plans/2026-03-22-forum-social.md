# Forum Social Layer — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full social chat layer — General Chat, DMs, Gruppen, Profil-Sheets, Online-Präsenz, Workout-Karten teilen und Badge-System.

**Architecture:** Supabase Realtime für Live-Nachrichten und Presence. 4 neue DB-Tabellen (`profiles`, `friendships`, `channels`, `messages`) mit RLS. Neuer Forum-Tab in der BottomNav (ersetzt Übungen-Tab, da Übungen über den Workout-Flow erreichbar sind). Realtime-Subscriptions in dedizierten Hooks. Typing Indicator und Online-Status via Supabase Presence (nicht persistiert).

**Tech Stack:** Next.js 14, TypeScript strict, Supabase Realtime + Postgres, Zustand (unread counts), Framer Motion (Animationen), lucide-react Icons, date-fns

---

## File Map

| File | Aktion | Verantwortung |
|------|--------|---------------|
| `supabase/migrations/20260322000000_forum.sql` | Create | 4 Tabellen + RLS Policies |
| `types/forum.ts` | Create | TypeScript-Typen: Profile, Channel, Message, Friendship |
| `lib/forum.ts` | Create | Supabase Query-Funktionen (getChannels, sendMessage, etc.) |
| `hooks/useChannel.ts` | Create | Realtime-Subscription für einen Channel |
| `hooks/usePresence.ts` | Create | Online-Presence tracking + Typing Indicator broadcast |
| `store/forumStore.ts` | Create | Zustand-Store für unread counts + channel cache |
| `components/forum/MessageBubble.tsx` | Create | Text-Nachrichten Bubble (eigene rechts, fremde links) |
| `components/forum/WorkoutCardMessage.tsx` | Create | Workout-Karte als Chat-Nachricht |
| `components/forum/ProfileSheet.tsx` | Create | Bottom Sheet: Profil + Freund hinzufügen + DM starten |
| `components/forum/TypingIndicator.tsx` | Create | Animierte "tippt..." Anzeige |
| `components/forum/ChannelListItem.tsx` | Create | Einzelner Eintrag in der Forum-Home-Liste |
| `app/(tabs)/forum/page.tsx` | Create | Forum-Startseite (General + DMs + Gruppen Liste) |
| `app/(tabs)/forum/[channelId]/page.tsx` | Create | Chat-Screen (alle Channel-Typen) |
| `app/(tabs)/forum/new-group/page.tsx` | Create | Neue Gruppe erstellen |
| `components/layout/BottomNav.tsx` | Modify | Forum-Tab hinzufügen (ersetzt Übungen) |
| `app/workout/summary/page.tsx` | Modify | "Im Forum teilen" Button + Share-Flow |
| `app/auth/signup/page.tsx` | Modify | Profil in `profiles`-Tabelle anlegen bei Signup |

---

## Chunk 1: Foundation — DB, Types, Lib, Navigation

### Task 1: Datenbank-Migration

**Files:**
- Create: `supabase/migrations/20260322000000_forum.sql`

- [ ] **Step 1: Migration-Datei anlegen**

Erstelle `supabase/migrations/20260322000000_forum.sql` mit folgendem Inhalt:

```sql
-- profiles: öffentliches Profil, 1:1 mit auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      text UNIQUE NOT NULL,
  avatar_color  text NOT NULL DEFAULT '#4DFFED',
  athlete_score int  NOT NULL DEFAULT 0,
  streak        int  NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- friendships: pending oder accepted
CREATE TABLE IF NOT EXISTS public.friendships (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status     text NOT NULL CHECK (status IN ('pending', 'accepted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_a, user_b)
);

-- channels: general (1 global), dm (2 Teilnehmer), group (3+)
CREATE TABLE IF NOT EXISTS public.channels (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type         text NOT NULL CHECK (type IN ('general', 'dm', 'group')),
  name         text,              -- nur für group
  participants uuid[] NOT NULL DEFAULT '{}',  -- leer für general
  created_by   uuid REFERENCES public.profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- messages: alle Nachrichten aller Kanäle
CREATE TABLE IF NOT EXISTS public.messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  sender_id  uuid NOT NULL REFERENCES public.profiles(id),
  content    text NOT NULL DEFAULT '',
  type       text NOT NULL CHECK (type IN ('text', 'workout_card')) DEFAULT 'text',
  metadata   jsonb,   -- für workout_card: { sessionId, exercises, volume, score, durationSeconds, muscleSets }
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed: einen globalen General-Channel anlegen
INSERT INTO public.channels (type, name) VALUES ('general', 'General') ON CONFLICT DO NOTHING;

-- RLS aktivieren
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages    ENABLE ROW LEVEL SECURITY;

-- profiles: jeder angemeldete User darf alle lesen, nur eigenes schreiben
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- friendships: lesbar wenn man beteiligt ist
CREATE POLICY "friendships_select" ON public.friendships FOR SELECT TO authenticated
  USING (user_a = auth.uid() OR user_b = auth.uid());
CREATE POLICY "friendships_insert" ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (user_a = auth.uid());
CREATE POLICY "friendships_update" ON public.friendships FOR UPDATE TO authenticated
  USING (user_a = auth.uid() OR user_b = auth.uid());

-- channels: general für alle; dm/group nur für Teilnehmer
CREATE POLICY "channels_select" ON public.channels FOR SELECT TO authenticated
  USING (type = 'general' OR auth.uid() = ANY(participants));
CREATE POLICY "channels_insert" ON public.channels FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = ANY(participants) OR type = 'general');

-- messages: lesbar wenn User Zugang zum Channel hat
CREATE POLICY "messages_select" ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.channels c
      WHERE c.id = channel_id
        AND (c.type = 'general' OR auth.uid() = ANY(c.participants))
    )
  );
CREATE POLICY "messages_insert" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.channels c
      WHERE c.id = channel_id
        AND (c.type = 'general' OR auth.uid() = ANY(c.participants))
    )
  );

-- Realtime für messages aktivieren
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
```

- [ ] **Step 2: Migration anwenden**

Nutze das Supabase MCP-Tool `apply_migration` mit `project_id: wxwkxgqoqttatlblvmae` und dem SQL aus Step 1 als `query`.

Oder alternativ via Supabase Dashboard → SQL Editor → Inhalt einfügen → Run.

- [ ] **Step 3: Verify**

Prüfe in Supabase Dashboard → Table Editor dass die 4 Tabellen existieren und der General-Channel eingetragen ist.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260322000000_forum.sql
git commit -m "feat: forum DB schema — profiles, friendships, channels, messages + RLS"
```

---

### Task 2: TypeScript-Typen

**Files:**
- Create: `types/forum.ts`

- [ ] **Step 1: Datei erstellen**

```typescript
// types/forum.ts

export interface ForumProfile {
  id: string;
  username: string;
  avatarColor: string;
  athleteScore: number;
  streak: number;
  createdAt: string;
}

export type ChannelType = 'general' | 'dm' | 'group';

export interface Channel {
  id: string;
  type: ChannelType;
  name: string | null;
  participants: string[];
  createdBy: string | null;
  createdAt: string;
  // Client-seitig angereichert:
  lastMessage?: Message | null;
  unreadCount?: number;
  otherUser?: ForumProfile | null;  // für DM: der andere Teilnehmer
}

export type MessageType = 'text' | 'workout_card';

export interface WorkoutCardMetadata {
  sessionId: string;
  exercises: Array<{ nameDE: string; sets: number; maxWeight: number }>;
  totalVolume: number;         // kg
  durationSeconds: number;
  score?: number;              // 0-100
  muscleSets?: Record<string, number>;
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  type: MessageType;
  metadata?: WorkoutCardMetadata | null;
  createdAt: string;
  // Client-seitig angereichert:
  sender?: ForumProfile;
}

export type FriendshipStatus = 'pending' | 'accepted';

export interface Friendship {
  id: string;
  userA: string;
  userB: string;
  status: FriendshipStatus;
  createdAt: string;
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add types/forum.ts
git commit -m "feat: forum TypeScript types — Profile, Channel, Message, Friendship"
```

---

### Task 3: lib/forum.ts — Query-Funktionen

**Files:**
- Create: `lib/forum.ts`

- [ ] **Step 1: Datei erstellen**

```typescript
// lib/forum.ts
import { supabase } from '@/lib/supabase';
import type { Channel, ForumProfile, Message, Friendship } from '@/types/forum';

// ── Profil ──────────────────────────────────────────────

export async function getMyProfile(): Promise<ForumProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return data ? mapProfile(data) : null;
}

export async function getProfile(userId: string): Promise<ForumProfile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data ? mapProfile(data) : null;
}

export async function createProfile(userId: string, username: string): Promise<void> {
  const colors = ['#4DFFED', '#FF9F0A', '#FF6B6B', '#A8FF78', '#78C5FF'];
  const avatarColor = colors[Math.floor(Math.random() * colors.length)];
  await supabase.from('profiles').insert({ id: userId, username, avatar_color: avatarColor });
}

export async function updateProfileScore(userId: string, athleteScore: number, streak: number): Promise<void> {
  await supabase.from('profiles').update({ athlete_score: athleteScore, streak }).eq('id', userId);
}

// ── Channels ─────────────────────────────────────────────

export async function getGeneralChannelId(): Promise<string | null> {
  const { data } = await supabase
    .from('channels')
    .select('id')
    .eq('type', 'general')
    .single();
  return data?.id ?? null;
}

export async function getMyChannels(userId: string): Promise<Channel[]> {
  const { data } = await supabase
    .from('channels')
    .select('*')
    .or(`type.eq.general,participants.cs.{${userId}}`);
  return (data ?? []).map(mapChannel);
}

export async function createDMChannel(userId: string, otherId: string): Promise<string> {
  // Prüfe ob DM bereits existiert
  const { data: existing } = await supabase
    .from('channels')
    .select('id')
    .eq('type', 'dm')
    .contains('participants', [userId, otherId]);
  if (existing && existing.length > 0) return existing[0].id;
  // Neu anlegen
  const { data } = await supabase
    .from('channels')
    .insert({ type: 'dm', participants: [userId, otherId], created_by: userId })
    .select('id')
    .single();
  return data!.id;
}

export async function createGroupChannel(userId: string, name: string, members: string[]): Promise<string> {
  const participants = [...new Set([userId, ...members])];
  const { data } = await supabase
    .from('channels')
    .insert({ type: 'group', name, participants, created_by: userId })
    .select('id')
    .single();
  return data!.id;
}

// ── Messages ─────────────────────────────────────────────

export async function getMessages(channelId: string, limit = 50): Promise<Message[]> {
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })
    .limit(limit);
  return (data ?? []).map(mapMessage);
}

export async function sendTextMessage(channelId: string, senderId: string, content: string): Promise<void> {
  await supabase.from('messages').insert({
    channel_id: channelId,
    sender_id: senderId,
    content,
    type: 'text',
  });
}

export async function sendWorkoutCard(
  channelId: string,
  senderId: string,
  metadata: Record<string, unknown>,
  caption = ''
): Promise<void> {
  await supabase.from('messages').insert({
    channel_id: channelId,
    sender_id: senderId,
    content: caption,
    type: 'workout_card',
    metadata,
  });
}

// ── Friendships ───────────────────────────────────────────

export async function getFriendships(userId: string): Promise<Friendship[]> {
  const { data } = await supabase
    .from('friendships')
    .select('*')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`);
  return (data ?? []).map(mapFriendship);
}

export async function sendFriendRequest(fromId: string, toId: string): Promise<void> {
  await supabase.from('friendships').insert({ user_a: fromId, user_b: toId, status: 'pending' });
}

export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
}

// ── Mapper ───────────────────────────────────────────────

function mapProfile(r: Record<string, unknown>): ForumProfile {
  return {
    id: r.id as string,
    username: r.username as string,
    avatarColor: r.avatar_color as string,
    athleteScore: r.athlete_score as number,
    streak: r.streak as number,
    createdAt: r.created_at as string,
  };
}

function mapChannel(r: Record<string, unknown>): Channel {
  return {
    id: r.id as string,
    type: r.type as Channel['type'],
    name: r.name as string | null,
    participants: r.participants as string[],
    createdBy: r.created_by as string | null,
    createdAt: r.created_at as string,
  };
}

function mapMessage(r: Record<string, unknown>): Message {
  return {
    id: r.id as string,
    channelId: r.channel_id as string,
    senderId: r.sender_id as string,
    content: r.content as string,
    type: r.type as Message['type'],
    metadata: r.metadata as Message['metadata'],
    createdAt: r.created_at as string,
  };
}

function mapFriendship(r: Record<string, unknown>): Friendship {
  return {
    id: r.id as string,
    userA: r.user_a as string,
    userB: r.user_b as string,
    status: r.status as Friendship['status'],
    createdAt: r.created_at as string,
  };
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/forum.ts
git commit -m "feat: lib/forum — Supabase query functions for profiles, channels, messages, friendships"
```

---

### Task 4: Profil bei Signup anlegen

**Files:**
- Modify: `app/auth/signup/page.tsx`

- [ ] **Step 1: Signup-Seite lesen**

Lies `app/auth/signup/page.tsx` um die aktuelle Submit-Logik zu verstehen.

- [ ] **Step 2: createProfile nach Signup einfügen**

Nach dem erfolgreichen `supabase.auth.signUp()` Call, direkt danach:

```typescript
import { createProfile } from '@/lib/forum';

// Nach signUp({ email, password }) — benutze die email-Prefix als username-Vorschlag:
if (data.user) {
  const defaultUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
  await createProfile(data.user.id, defaultUsername);
}
```

Username wird aus der E-Mail abgeleitet (Teil vor @, Sonderzeichen → Underscore). User kann es später in Settings ändern (Phase 2).

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add app/auth/signup/page.tsx
git commit -m "feat: create forum profile on signup — username derived from email"
```

---

### Task 5: Forum-Tab in der Navigation

**Files:**
- Modify: `components/layout/BottomNav.tsx`
- Create: `store/forumStore.ts`

- [ ] **Step 1: forumStore anlegen**

```typescript
// store/forumStore.ts
import { create } from 'zustand';

interface ForumStore {
  totalUnread: number;
  unreadByChannel: Record<string, number>;
  setUnread: (channelId: string, count: number) => void;
  clearUnread: (channelId: string) => void;
}

export const useForumStore = create<ForumStore>((set) => ({
  totalUnread: 0,
  unreadByChannel: {},
  setUnread: (channelId, count) =>
    set((state) => {
      const updated = { ...state.unreadByChannel, [channelId]: count };
      const total = Object.values(updated).reduce((sum, n) => sum + n, 0);
      return { unreadByChannel: updated, totalUnread: total };
    }),
  clearUnread: (channelId) =>
    set((state) => {
      const updated = { ...state.unreadByChannel };
      delete updated[channelId];
      const total = Object.values(updated).reduce((sum, n) => sum + n, 0);
      return { unreadByChannel: updated, totalUnread: total };
    }),
}));
```

- [ ] **Step 2: Forum-Tab in BottomNav**

In `components/layout/BottomNav.tsx`:

1. Import hinzufügen:
```typescript
import { Home, BarChart2, Dumbbell, Layers, Plus, MessageCircle } from 'lucide-react';
import { useForumStore } from '@/store/forumStore';
```

2. In der Komponente:
```typescript
const totalUnread = useForumStore((s) => s.totalUnread);
```

3. Den rechten Bereich ändern — Übungen-Tab durch Forum ersetzen:
```typescript
{/* Right tabs */}
<NavTab
  href="/forum"
  icon={
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <MessageCircle size={22} color={isActive('/forum') ? colors.accent : colors.textDisabled} />
      {totalUnread > 0 && (
        <div style={{
          position: 'absolute', top: -4, right: -6,
          backgroundColor: colors.danger,
          borderRadius: '10px',
          minWidth: '16px', height: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 3px',
        }}>
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        </div>
      )}
    </div>
  }
  label="Forum"
  active={isActive('/forum')}
/>
<NavTab href="/stats" icon={<BarChart2 size={22} color={isActive('/stats') ? colors.accent : colors.textDisabled} />} label="Stats" active={isActive('/stats')} />
```

- [ ] **Step 3: Forum-Placeholder-Seite anlegen** (damit Routing nicht bricht)

```typescript
// app/(tabs)/forum/page.tsx  — PLACEHOLDER, wird in Task 6 ersetzt
export default function ForumPage() {
  return <div style={{ padding: 24, color: '#fff' }}>Forum lädt...</div>;
}
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add store/forumStore.ts components/layout/BottomNav.tsx app/(tabs)/forum/page.tsx
git commit -m "feat: forum tab in BottomNav with unread badge — replaces Übungen tab"
```

---

## Chunk 2: Core Chat — Home, Chat-Screen, Komponenten

### Task 6: TypingIndicator + ProfileSheet (vor ChatScreen anlegen)

**Files:**
- Create: `components/forum/TypingIndicator.tsx`
- Create: `components/forum/ProfileSheet.tsx`

> Diese Komponenten werden von Task 8 (Chat-Screen) importiert — sie müssen zuerst existieren.

- [ ] **Step 1: TypingIndicator Komponente**

```typescript
// components/forum/TypingIndicator.tsx
'use client';

import { motion } from 'framer-motion';
import { colors, typography } from '@/constants/tokens';

interface TypingIndicatorProps {
  name: string;
}

export function TypingIndicator({ name }: TypingIndicatorProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: colors.textMuted,
            }}
          />
        ))}
      </div>
      <span style={{ ...typography.label, color: colors.textMuted, fontSize: '11px' }}>
        {name} tippt...
      </span>
    </div>
  );
}
```

- [ ] **Step 2: ProfileSheet Komponente**

```typescript
// components/forum/ProfileSheet.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, MessageCircle } from 'lucide-react';
import { colors, typography, radius, spacing } from '@/constants/tokens';
import type { ForumProfile } from '@/types/forum';
import { sendFriendRequest, createDMChannel } from '@/lib/forum';
import { useRouter } from 'next/navigation';

interface ProfileSheetProps {
  profile: ForumProfile;
  currentUserId: string;
  onClose: () => void;
  isFriend?: boolean;
}

export function ProfileSheet({ profile, currentUserId, onClose, isFriend = false }: ProfileSheetProps) {
  const router = useRouter();
  const [friendSent, setFriendSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddFriend = async () => {
    setLoading(true);
    try {
      await sendFriendRequest(currentUserId, profile.id);
      setFriendSent(true);
    } catch {
      // Anfrage existiert bereits oder anderer Fehler — ignorieren
    } finally {
      setLoading(false);
    }
  };

  const handleDM = async () => {
    setLoading(true);
    const channelId = await createDMChannel(currentUserId, profile.id);
    onClose();
    router.push(`/forum/${channelId}`);
  };

  const tierLabel =
    profile.athleteScore >= 800 ? 'Elite' :
    profile.athleteScore >= 600 ? 'Athlet' :
    profile.athleteScore >= 400 ? 'Fortgeschrittener' :
    profile.athleteScore >= 200 ? 'Aufsteiger' : 'Einsteiger';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100 }}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
          backgroundColor: colors.bgCard,
          borderRadius: `${radius['2xl']}px ${radius['2xl']}px 0 0`,
          padding: spacing[5], maxWidth: 480, margin: '0 auto',
        }}
      >
        <button onClick={onClose} style={{
          position: 'absolute', top: spacing[4], right: spacing[4],
          background: 'none', border: 'none', cursor: 'pointer',
        }}>
          <X size={20} color={colors.textMuted} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: spacing[4] }}>
          <div style={{
            width: 72, height: 72, borderRadius: radius.full,
            backgroundColor: profile.avatarColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, color: colors.bgPrimary, marginBottom: spacing[2],
          }}>
            {profile.username[0].toUpperCase()}
          </div>
          <div style={{ ...typography.h3, color: colors.textPrimary }}>{profile.username}</div>
          <div style={{ ...typography.bodySm, color: colors.textMuted, marginTop: 2 }}>
            {tierLabel} · {profile.athleteScore} Punkte · {profile.streak} Tage Streak
          </div>
        </div>

        {profile.id !== currentUserId && (
          <div style={{ display: 'flex', gap: spacing[3] }}>
            <button
              onClick={handleAddFriend}
              disabled={isFriend || friendSent || loading}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: spacing[3], borderRadius: radius.xl,
                backgroundColor: (isFriend || friendSent) ? colors.bgHighest : colors.accentBg,
                border: `1px solid ${(isFriend || friendSent) ? colors.border : colors.accent + '40'}`,
                color: (isFriend || friendSent) ? colors.textMuted : colors.accent,
                fontSize: 14, fontWeight: 600, cursor: (isFriend || friendSent) ? 'default' : 'pointer',
              }}
            >
              <UserPlus size={16} />
              {isFriend ? 'Befreundet' : friendSent ? 'Anfrage gesendet' : 'Freund hinzufügen'}
            </button>
            <button
              onClick={handleDM}
              disabled={loading}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: spacing[3], borderRadius: radius.xl,
                backgroundColor: colors.bgHighest, border: `1px solid ${colors.border}`,
                color: colors.textSecondary, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <MessageCircle size={16} />
              Nachricht
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/forum/TypingIndicator.tsx components/forum/ProfileSheet.tsx
git commit -m "feat: TypingIndicator + ProfileSheet components"
```

---

### Task 7: useChannel Hook (Realtime)

**Files:**
- Create: `hooks/useChannel.ts`

- [ ] **Step 1: Hook erstellen**

```typescript
// hooks/useChannel.ts
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getMessages, sendTextMessage } from '@/lib/forum';
import type { Message } from '@/types/forum';

export function useChannel(channelId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Initiales Laden
  useEffect(() => {
    if (!channelId) return;
    setLoading(true);
    getMessages(channelId).then((msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
  }, [channelId]);

  // Realtime-Subscription
  useEffect(() => {
    if (!channelId) return;

    const ch = supabase
      .channel(`chat:${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const newMsg: Message = {
            id: row.id as string,
            channelId: row.channel_id as string,
            senderId: row.sender_id as string,
            content: row.content as string,
            type: row.type as Message['type'],
            metadata: row.metadata as Message['metadata'],
            createdAt: row.created_at as string,
          };
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [channelId]);

  const send = useCallback(async (senderId: string, content: string) => {
    if (!channelId || !content.trim()) return;
    await sendTextMessage(channelId, senderId, content.trim());
  }, [channelId]);

  return { messages, loading, send };
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add hooks/useChannel.ts
git commit -m "feat: useChannel hook — Realtime subscription + message history"
```

---

### Task 7: Forum-Home-Seite

**Files:**
- Create: `app/(tabs)/forum/page.tsx` (ersetzt Placeholder)
- Create: `components/forum/ChannelListItem.tsx`

- [ ] **Step 1: ChannelListItem Komponente**

```typescript
// components/forum/ChannelListItem.tsx
'use client';

import Link from 'next/link';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import type { Channel } from '@/types/forum';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface ChannelListItemProps {
  channel: Channel;
  unreadCount: number;
}

export function ChannelListItem({ channel, unreadCount }: ChannelListItemProps) {
  const displayName =
    channel.type === 'general' ? '🌍 General Chat' :
    channel.type === 'dm' ? (channel.otherUser?.username ?? 'Direktnachricht') :
    `🏋️ ${channel.name}`;

  const subtitle =
    channel.lastMessage
      ? channel.lastMessage.content || (channel.lastMessage.type === 'workout_card' ? '🏋️ Workout geteilt' : '')
      : 'Noch keine Nachrichten';

  const timeAgo = channel.lastMessage
    ? formatDistanceToNow(parseISO(channel.lastMessage.createdAt), { locale: de, addSuffix: false })
    : '';

  return (
    <Link
      href={`/forum/${channel.id}`}
      style={{
        display: 'flex', alignItems: 'center', gap: spacing[3],
        padding: `${spacing[3]} ${spacing[4]}`,
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.xl,
        textDecoration: 'none',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: radius.full, flexShrink: 0,
        backgroundColor: channel.otherUser?.avatarColor ?? colors.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px', fontWeight: 700, color: colors.bgPrimary,
      }}>
        {channel.type === 'general' ? '🌍' :
         channel.type === 'group' ? '🏋️' :
         (channel.otherUser?.username?.[0] ?? '?').toUpperCase()}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...typography.body, color: colors.textPrimary, fontWeight: 600, marginBottom: 2 }}>
          {displayName}
        </div>
        <div style={{
          ...typography.bodySm, color: colors.textMuted,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {subtitle}
        </div>
      </div>

      {/* Right: Zeit + Badge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        {timeAgo && (
          <span style={{ ...typography.label, color: colors.textDisabled, fontSize: '10px' }}>{timeAgo}</span>
        )}
        {unreadCount > 0 && (
          <div style={{
            backgroundColor: colors.danger, borderRadius: '10px',
            minWidth: 18, height: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
          }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Forum-Home Seite**

```typescript
// app/(tabs)/forum/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { getMyChannels, getGeneralChannelId } from '@/lib/forum';
import { useForumStore } from '@/store/forumStore';
import { ChannelListItem } from '@/components/forum/ChannelListItem';
import { supabase } from '@/lib/supabase';
import type { Channel } from '@/types/forum';

export default function ForumPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const unreadByChannel = useForumStore((s) => s.unreadByChannel);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      getMyChannels(user.id).then((chs) => {
        // General immer zuerst
        const sorted = [
          ...chs.filter((c) => c.type === 'general'),
          ...chs.filter((c) => c.type === 'dm'),
          ...chs.filter((c) => c.type === 'group'),
        ];
        setChannels(sorted);
        setLoading(false);
      });
    });
  }, []);

  const handleNewGroup = () => router.push('/forum/new-group');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ padding: spacing[4], maxWidth: 480, margin: '0 auto' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[5] }}>
        <h1 style={{
          fontFamily: 'var(--font-barlow)', fontSize: 28, fontWeight: 700, color: colors.textPrimary,
        }}>
          Forum
        </h1>
        <button
          onClick={handleNewGroup}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            backgroundColor: colors.accentBg, border: `1px solid ${colors.accent}40`,
            borderRadius: radius.full, padding: '8px 14px',
            color: colors.accent, fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Gruppe
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: colors.textMuted, paddingTop: 40 }}>
          Lädt...
        </div>
      )}

      {/* Channel-Liste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
        {channels.map((ch) => (
          <ChannelListItem
            key={ch.id}
            channel={ch}
            unreadCount={unreadByChannel[ch.id] ?? 0}
          />
        ))}
      </div>

      {!loading && channels.length <= 1 && (
        <p style={{ ...typography.bodySm, color: colors.textMuted, textAlign: 'center', marginTop: 24 }}>
          Noch keine Chats — schreib im General oder starte eine Direktnachricht über ein Profil.
        </p>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/forum/ChannelListItem.tsx app/(tabs)/forum/page.tsx
git commit -m "feat: forum home page — General/DM/Gruppen Liste mit unread badges"
```

---

### Task 8: Chat-Screen

**Files:**
- Create: `app/(tabs)/forum/[channelId]/page.tsx`
- Create: `components/forum/MessageBubble.tsx`
- Create: `components/forum/WorkoutCardMessage.tsx`

- [ ] **Step 1: MessageBubble Komponente**

```typescript
// components/forum/MessageBubble.tsx
'use client';

import { colors, typography, radius, spacing } from '@/constants/tokens';
import type { Message, ForumProfile } from '@/types/forum';
import { format, parseISO } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  sender: ForumProfile | null;
  isOwn: boolean;
  onAvatarPress?: () => void;
}

export function MessageBubble({ message, sender, isOwn, onAvatarPress }: MessageBubbleProps) {
  const time = format(parseISO(message.createdAt), 'HH:mm');

  return (
    <div style={{
      display: 'flex',
      flexDirection: isOwn ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: spacing[2],
      marginBottom: spacing[2],
    }}>
      {/* Avatar */}
      {!isOwn && (
        <button
          onClick={onAvatarPress}
          style={{
            width: 32, height: 32, borderRadius: radius.full, flexShrink: 0,
            backgroundColor: sender?.avatarColor ?? colors.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, color: colors.bgPrimary,
            border: 'none', cursor: 'pointer',
          }}
        >
          {(sender?.username?.[0] ?? '?').toUpperCase()}
        </button>
      )}

      {/* Bubble */}
      <div style={{ maxWidth: '72%' }}>
        {!isOwn && sender && (
          <div style={{ ...typography.label, color: colors.textMuted, marginBottom: 2, paddingLeft: 4 }}>
            {sender.username}
          </div>
        )}
        <div style={{
          backgroundColor: isOwn ? colors.accent : colors.bgCard,
          border: isOwn ? 'none' : `1px solid ${colors.border}`,
          borderRadius: isOwn
            ? `${radius.xl}px ${radius.xl}px 4px ${radius.xl}px`
            : `${radius.xl}px ${radius.xl}px ${radius.xl}px 4px`,
          padding: `${spacing[2]} ${spacing[3]}`,
        }}>
          <p style={{
            ...typography.body,
            color: isOwn ? colors.bgPrimary : colors.textPrimary,
            margin: 0, wordBreak: 'break-word',
          }}>
            {message.content}
          </p>
        </div>
        <div style={{ ...typography.label, color: colors.textDisabled, fontSize: '10px', paddingLeft: 4, marginTop: 2 }}>
          {time}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: WorkoutCardMessage Komponente**

```typescript
// components/forum/WorkoutCardMessage.tsx
'use client';

import { colors, typography, radius, spacing } from '@/constants/tokens';
import type { Message, ForumProfile } from '@/types/forum';
import { format, parseISO } from 'date-fns';

interface WorkoutCardMessageProps {
  message: Message;
  sender: ForumProfile | null;
  isOwn: boolean;
  onAvatarPress?: () => void;
}

export function WorkoutCardMessage({ message, sender, isOwn, onAvatarPress }: WorkoutCardMessageProps) {
  const meta = message.metadata;
  const time = format(parseISO(message.createdAt), 'HH:mm');
  const volumeTons = meta ? Math.round(meta.totalVolume / 100) / 10 : 0;
  const durationMin = meta ? Math.round(meta.durationSeconds / 60) : 0;

  return (
    <div style={{
      display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row',
      alignItems: 'flex-end', gap: spacing[2], marginBottom: spacing[2],
    }}>
      {/* Avatar */}
      {!isOwn && (
        <button
          onClick={onAvatarPress}
          style={{
            width: 32, height: 32, borderRadius: radius.full, flexShrink: 0,
            backgroundColor: sender?.avatarColor ?? colors.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, color: colors.bgPrimary,
            border: 'none', cursor: 'pointer',
          }}
        >
          {(sender?.username?.[0] ?? '?').toUpperCase()}
        </button>
      )}

      {/* Card */}
      <div style={{ maxWidth: '80%' }}>
        {!isOwn && sender && (
          <div style={{ ...typography.label, color: colors.textMuted, marginBottom: 2, paddingLeft: 4 }}>
            {sender.username}
          </div>
        )}
        <div style={{
          backgroundColor: colors.bgCard,
          border: `1px solid ${colors.accent}40`,
          borderRadius: radius.xl, overflow: 'hidden',
          minWidth: 220,
        }}>
          {/* Header */}
          <div style={{
            padding: `${spacing[2]} ${spacing[3]}`,
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex', alignItems: 'center', gap: spacing[2],
          }}>
            <span style={{ fontSize: 16 }}>🏋️</span>
            <div>
              <div style={{ ...typography.label, color: colors.accent, fontWeight: 700 }}>
                {sender?.username ?? 'Training'}
              </div>
              <div style={{ ...typography.label, color: colors.textMuted, fontSize: '10px' }}>
                {format(parseISO(message.createdAt), 'dd.MM.yy · HH:mm')}
              </div>
            </div>
            {meta?.score && (
              <div style={{ marginLeft: 'auto', ...typography.mono, color: colors.success, fontWeight: 700 }}>
                {meta.score}/100
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 1, backgroundColor: colors.border,
          }}>
            {[
              { label: 'Volumen', value: `${volumeTons}t` },
              { label: 'Dauer', value: `${durationMin}min` },
            ].map(({ label, value }) => (
              <div key={label} style={{
                backgroundColor: colors.bgCard,
                padding: `${spacing[2]} ${spacing[3]}`, textAlign: 'center',
              }}>
                <div style={{ ...typography.mono, color: colors.textPrimary, fontWeight: 700 }}>{value}</div>
                <div style={{ ...typography.label, color: colors.textMuted, fontSize: '10px' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Übungen */}
          {meta?.exercises && meta.exercises.length > 0 && (
            <div style={{ padding: `${spacing[2]} ${spacing[3]}` }}>
              {meta.exercises.slice(0, 3).map((ex, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ ...typography.bodySm, color: colors.textSecondary }}>{ex.nameDE}</span>
                  <span style={{ ...typography.bodySm, color: colors.textMuted }}>
                    {ex.sets}× {ex.maxWeight > 0 ? `${ex.maxWeight}kg` : 'EG'}
                  </span>
                </div>
              ))}
              {meta.exercises.length > 3 && (
                <div style={{ ...typography.label, color: colors.textMuted, marginTop: 2 }}>
                  +{meta.exercises.length - 3} weitere
                </div>
              )}
            </div>
          )}

          {/* Caption */}
          {message.content && (
            <div style={{
              padding: `${spacing[1]} ${spacing[3]} ${spacing[2]}`,
              borderTop: `1px solid ${colors.border}`,
            }}>
              <p style={{ ...typography.bodySm, color: colors.textMuted, margin: 0 }}>{message.content}</p>
            </div>
          )}
        </div>
        <div style={{ ...typography.label, color: colors.textDisabled, fontSize: '10px', paddingLeft: 4, marginTop: 2 }}>
          {time}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Chat-Screen**

```typescript
// app/(tabs)/forum/[channelId]/page.tsx
'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { useChannel } from '@/hooks/useChannel';
import { MessageBubble } from '@/components/forum/MessageBubble';
import { WorkoutCardMessage } from '@/components/forum/WorkoutCardMessage';
import { ProfileSheet } from '@/components/forum/ProfileSheet';
import { TypingIndicator } from '@/components/forum/TypingIndicator';
import { getProfile } from '@/lib/forum';
import { useForumStore } from '@/store/forumStore';
import { supabase } from '@/lib/supabase';
import type { ForumProfile } from '@/types/forum';

export default function ChatPage({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = use(params);
  const router = useRouter();
  const { messages, loading, send } = useChannel(channelId);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Record<string, ForumProfile>>({});
  const [selectedProfile, setSelectedProfile] = useState<ForumProfile | null>(null);
  const [channelMeta, setChannelMeta] = useState<import('@/types/forum').Channel | null>(null);

  // Channel-Metadaten laden (Name, Typ, Teilnehmer)
  useEffect(() => {
    if (!userId || !channelId) return;
    getMyChannels(userId).then((chs) => {
      const meta = chs.find((c) => c.id === channelId) ?? null;
      setChannelMeta(meta);
    });
  }, [channelId, userId]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const clearUnread = useForumStore((s) => s.clearUnread);

  // Eigene User-ID laden
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // Unread beim Öffnen löschen
  useEffect(() => {
    clearUnread(channelId);
  }, [channelId, clearUnread]);

  // Scroll to bottom bei neuen Nachrichten
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sender-Profile nachladen
  useEffect(() => {
    const senderIds = [...new Set(messages.map((m) => m.senderId))].filter(
      (id) => !profiles[id]
    );
    senderIds.forEach((id) => {
      getProfile(id).then((p) => {
        if (p) setProfiles((prev) => ({ ...prev, [id]: p }));
      });
    });
  }, [messages, profiles]);

  const handleSend = async () => {
    if (!userId || !input.trim()) return;
    const text = input;
    setInput('');
    await send(userId, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: colors.bgPrimary }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: spacing[3],
        padding: `${spacing[3]} ${spacing[4]}`,
        backgroundColor: colors.bgSecondary, borderBottom: `1px solid ${colors.border}`,
        flexShrink: 0,
      }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
          <ArrowLeft size={22} color={colors.textSecondary} />
        </button>
        <div>
          <div style={{ ...typography.body, color: colors.textPrimary, fontWeight: 700 }}>
            {/* channelMeta: Channel | null — lade via getMyChannels(userId).find(c => c.id === channelId) in useEffect */}
            {channelMeta?.type === 'general' ? 'General Chat'
              : channelMeta?.type === 'group' ? (channelMeta.name ?? 'Gruppe')
              : (channelMeta?.otherUser?.username ?? 'Direktnachricht')}
          </div>
          <div style={{ ...typography.label, color: colors.textMuted, fontSize: '10px' }}>
            {channelMeta?.type === 'general' ? 'Alle Mitglieder'
              : channelMeta?.type === 'group' ? `${(channelMeta?.participants ?? []).length} Mitglieder`
              : 'Direktnachricht'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: spacing[4] }}>
        {loading && (
          <div style={{ textAlign: 'center', color: colors.textMuted, paddingTop: 40 }}>Lädt...</div>
        )}
        {messages.map((msg) => {
          const sender = profiles[msg.senderId] ?? null;
          const isOwn = msg.senderId === userId;
          const commonProps = { message: msg, sender, isOwn, onAvatarPress: () => setSelectedProfile(sender) };
          return msg.type === 'workout_card'
            ? <WorkoutCardMessage key={msg.id} {...commonProps} />
            : <MessageBubble key={msg.id} {...commonProps} />;
        })}
        {isTyping && <TypingIndicator name={isTyping} />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: spacing[2],
        padding: spacing[3], backgroundColor: colors.bgSecondary,
        borderTop: `1px solid ${colors.border}`, flexShrink: 0,
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nachricht..."
          style={{
            flex: 1, backgroundColor: colors.bgHighest, border: `1px solid ${colors.border}`,
            borderRadius: radius.full, padding: `${spacing[2]} ${spacing[4]}`,
            color: colors.textPrimary, fontSize: 14, outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          style={{
            width: 40, height: 40, borderRadius: radius.full,
            backgroundColor: input.trim() ? colors.accent : colors.bgHighest,
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() ? 'pointer' : 'default', transition: 'background 0.2s',
          }}
        >
          <Send size={16} color={input.trim() ? colors.bgPrimary : colors.textDisabled} />
        </button>
      </div>

      {/* Profil-Sheet */}
      {selectedProfile && (
        <ProfileSheet
          profile={selectedProfile}
          currentUserId={userId ?? ''}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add components/forum/MessageBubble.tsx components/forum/WorkoutCardMessage.tsx app/(tabs)/forum/[channelId]/page.tsx
git commit -m "feat: chat screen with MessageBubble + WorkoutCardMessage components"
```

---

## Chunk 3: Social Features — DMs, Gruppen, Sharing, Presence, Badges

> **Note:** `TypingIndicator` und `ProfileSheet` wurden in Chunk 2 Task 6 erstellt — sie sind hier bereits verfügbar.

### Task 9: Gruppen erstellen (vormals Task 10)

**Files:**
- Create: `app/(tabs)/forum/new-group/page.tsx`

- [ ] **Step 1: Seite erstellen**

**Files:**
- Create: `app/(tabs)/forum/new-group/page.tsx`

- [ ] **Step 1: Seite erstellen**

```typescript
// app/(tabs)/forum/new-group/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { createGroupChannel, getFriendships, getProfile } from '@/lib/forum';
import { supabase } from '@/lib/supabase';
import type { ForumProfile } from '@/types/forum';

export default function NewGroupPage() {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState<ForumProfile[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const friendships = await getFriendships(user.id);
      const accepted = friendships.filter((f) => f.status === 'accepted');
      const profiles = await Promise.all(
        accepted.map((f) => getProfile(f.userA === user.id ? f.userB : f.userA))
      );
      setFriends(profiles.filter(Boolean) as ForumProfile[]);
    });
  }, []);

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleCreate = async () => {
    if (!userId || !groupName.trim() || selected.length === 0) return;
    setCreating(true);
    const channelId = await createGroupChannel(userId, groupName.trim(), selected);
    router.push(`/forum/${channelId}`);
  };

  return (
    <div style={{ padding: spacing[4], maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[5] }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={22} color={colors.textSecondary} />
        </button>
        <h1 style={{ fontFamily: 'var(--font-barlow)', fontSize: 24, fontWeight: 700, color: colors.textPrimary }}>
          Neue Gruppe
        </h1>
      </div>

      {/* Gruppenname */}
      <div style={{ marginBottom: spacing[5] }}>
        <label style={{ ...typography.label, color: colors.textMuted, display: 'block', marginBottom: spacing[2] }}>
          GRUPPENNAME
        </label>
        <input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="z.B. Gym Crew"
          style={{
            width: '100%', backgroundColor: colors.bgHighest,
            border: `1px solid ${colors.border}`, borderRadius: radius.xl,
            padding: `${spacing[3]} ${spacing[4]}`, color: colors.textPrimary, fontSize: 14,
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Freunde auswählen */}
      <div style={{ marginBottom: spacing[5] }}>
        <label style={{ ...typography.label, color: colors.textMuted, display: 'block', marginBottom: spacing[2] }}>
          MITGLIEDER ({selected.length} ausgewählt)
        </label>
        {friends.length === 0 && (
          <p style={{ ...typography.bodySm, color: colors.textMuted }}>
            Noch keine Freunde — füge zuerst Freunde hinzu, indem du im Chat auf ein Profil tippst.
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
          {friends.map((f) => {
            const isSelected = selected.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => toggle(f.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: spacing[3],
                  padding: `${spacing[3]} ${spacing[4]}`,
                  backgroundColor: isSelected ? colors.accentBg : colors.bgCard,
                  border: `1px solid ${isSelected ? colors.accent + '40' : colors.border}`,
                  borderRadius: radius.xl, cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: radius.full,
                  backgroundColor: f.avatarColor, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: colors.bgPrimary,
                }}>
                  {f.username[0].toUpperCase()}
                </div>
                <span style={{ ...typography.body, color: colors.textPrimary }}>{f.username}</span>
                {isSelected && <div style={{ marginLeft: 'auto' }}><X size={14} color={colors.accent} /></div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Erstellen */}
      <button
        onClick={handleCreate}
        disabled={!groupName.trim() || selected.length === 0 || creating}
        style={{
          width: '100%', padding: spacing[4],
          backgroundColor: (!groupName.trim() || selected.length === 0) ? colors.bgHighest : colors.accent,
          border: 'none', borderRadius: radius.xl,
          color: (!groupName.trim() || selected.length === 0) ? colors.textMuted : colors.bgPrimary,
          fontSize: 16, fontWeight: 700, cursor: 'pointer',
        }}
      >
        {creating ? 'Erstelle...' : `Gruppe erstellen (${selected.length + 1} Mitglieder)`}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/forum/new-group/page.tsx
git commit -m "feat: new-group page — Gruppe mit Freunden erstellen"
```

---

### Task 11: Workout-Karte aus Summary teilen

**Files:**
- Modify: `app/workout/summary/page.tsx`

- [ ] **Step 1: summary/page.tsx lesen**

Lies `app/workout/summary/page.tsx` um die Session-Daten zu verstehen (welche Variablen zur Verfügung stehen: `session`, `sessionMuscleSets`, `maxSessionSets`, etc.).

- [ ] **Step 2: Share-State und Modal hinzufügen**

Am Anfang der Komponente folgende State-Variablen hinzufügen:

```typescript
import { useState, useEffect } from 'react';
import { Globe, MessageCircle, Users } from 'lucide-react';
import { sendWorkoutCard, getMyChannels, getGeneralChannelId } from '@/lib/forum';
import { supabase } from '@/lib/supabase';
import type { Channel } from '@/types/forum';

const [shareOpen, setShareOpen] = useState(false);
const [shareChannels, setShareChannels] = useState<Channel[]>([]);
const [shareCaption, setShareCaption] = useState('');
const [shareUserId, setShareUserId] = useState<string | null>(null);
const [sharing, setSharing] = useState(false);

useEffect(() => {
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      setShareUserId(user.id);
      getMyChannels(user.id).then(setShareChannels);
    }
  });
}, []);
```

- [ ] **Step 3: Share-Funktion**

```typescript
const handleShareToChannel = async (channelId: string) => {
  if (!shareUserId || !session) return;
  setSharing(true);
  const exercises = session.exercises.map((ex) => {
    const done = ex.sets.filter((s) => s.isCompleted);
    const maxWeight = done.length > 0 ? Math.max(...done.map((s) => s.weight)) : 0;
    return { nameDE: ex.exercise.nameDE, sets: done.length, maxWeight };
  });
  await sendWorkoutCard(channelId, shareUserId, {
    sessionId: session.id,
    exercises,
    totalVolume: session.totalVolume,
    durationSeconds: session.durationSeconds,
    score: session.score?.total,
    muscleSets: sessionMuscleSets,
  }, shareCaption);
  setSharing(false);
  setShareOpen(false);
  setShareCaption('');
};
```

- [ ] **Step 4: "Im Forum teilen" Button in JSX**

Finde im JSX den Bereich mit den Aktions-Buttons am Ende der Summary-Seite. Füge diesen Button hinzu:

```tsx
import { MessageCircle } from 'lucide-react';

<button
  onClick={() => setShareOpen(true)}
  style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', padding: spacing[3],
    backgroundColor: colors.accentBg, border: `1px solid ${colors.accent}40`,
    borderRadius: radius.xl, color: colors.accent, fontSize: 14, fontWeight: 600,
    cursor: 'pointer', marginTop: spacing[2],
  }}
>
  <MessageCircle size={16} />
  Im Forum teilen
</button>
```

- [ ] **Step 5: Share-Modal in JSX**

Am Ende der Seite (vor dem schließenden `</motion.div>`):

```tsx
{shareOpen && (
  <>
    {/* Backdrop */}
    <div
      onClick={() => setShareOpen(false)}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100 }}
    />
    {/* Sheet */}
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
      backgroundColor: colors.bgCard,
      borderRadius: `${radius['2xl']}px ${radius['2xl']}px 0 0`,
      padding: spacing[5], maxWidth: 480, margin: '0 auto',
    }}>
      <h3 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
        Im Forum teilen
      </h3>
      <input
        value={shareCaption}
        onChange={(e) => setShareCaption(e.target.value)}
        placeholder="Optionale Nachricht dazu..."
        style={{
          width: '100%', backgroundColor: colors.bgHighest, border: `1px solid ${colors.border}`,
          borderRadius: radius.xl, padding: `${spacing[2]} ${spacing[4]}`,
          color: colors.textPrimary, fontSize: 14, outline: 'none',
          marginBottom: spacing[3], boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
        {/* General Chat */}
        <button
          onClick={async () => {
            const genId = await getGeneralChannelId();
            if (genId) handleShareToChannel(genId);
          }}
          disabled={sharing}
          style={{
            display: 'flex', alignItems: 'center', gap: spacing[3],
            padding: `${spacing[3]} ${spacing[4]}`, backgroundColor: colors.bgHighest,
            border: `1px solid ${colors.border}`, borderRadius: radius.xl,
            color: colors.textPrimary, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
          }}
        >
          <Globe size={16} color={colors.textMuted} />
          General Chat
        </button>
        {/* DMs und Gruppen — ohne Emojis, Icons aus lucide-react */}
        {shareChannels.filter((c) => c.type !== 'general').map((ch) => (
          <button
            key={ch.id}
            onClick={() => handleShareToChannel(ch.id)}
            disabled={sharing}
            style={{
              display: 'flex', alignItems: 'center', gap: spacing[3],
              padding: `${spacing[3]} ${spacing[4]}`, backgroundColor: colors.bgHighest,
              border: `1px solid ${colors.border}`, borderRadius: radius.xl,
              color: colors.textPrimary, fontSize: 14, cursor: 'pointer', textAlign: 'left',
            }}
          >
            {ch.type === 'group'
              ? <><Users size={16} color={colors.textMuted} />{ch.name}</>
              : <><MessageCircle size={16} color={colors.textMuted} />{ch.otherUser?.username ?? 'Direktnachricht'}</>}
          </button>
        ))}
      </div>
    </div>
  </>
)}
```

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add app/workout/summary/page.tsx
git commit -m "feat: workout summary — 'Im Forum teilen' button + share modal"
```

---

### Task 12: Presence + Typing Broadcast

**Files:**
- Create: `hooks/usePresence.ts`
- Modify: `app/(tabs)/forum/[channelId]/page.tsx`

- [ ] **Step 1: usePresence Hook**

```typescript
// hooks/usePresence.ts
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export function usePresence(channelId: string | null, userId: string | null, username: string) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!channelId || !userId) return;

    const ch = supabase.channel(`presence:${channelId}`, {
      config: { presence: { key: userId } },
    });

    // Online-Status tracken
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState();
      setOnlineUsers(Object.keys(state));
    });

    // Typing-Events empfangen
    ch.on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload.userId === userId) return;
      setTypingUser(payload.username as string);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingUser(null), 3000);
    });

    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({ userId, username, online_at: new Date().toISOString() });
      }
    });

    channelRef.current = ch;
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      supabase.removeChannel(ch);
    };
  }, [channelId, userId, username]);

  const broadcastTyping = useCallback(() => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, username },
    });
  }, [userId, username]);

  return { onlineUsers, typingUser, broadcastTyping };
}
```

- [ ] **Step 2: In Chat-Screen integrieren**

In `app/(tabs)/forum/[channelId]/page.tsx`:

1. Import hinzufügen:
```typescript
import { usePresence } from '@/hooks/usePresence';
```

2. In der Komponente nach den anderen States:
```typescript
const [myUsername, setMyUsername] = useState('');
// Beim getUser-Call username laden:
// ... setMyUsername(profile?.username ?? '');

const { onlineUsers, typingUser, broadcastTyping } = usePresence(channelId, userId, myUsername);
```

3. Im Input-Feld `onChange` Typing-Broadcast auslösen:
```typescript
onChange={(e) => { setInput(e.target.value); broadcastTyping(); }}
```

4. `isTyping` State durch `typingUser` aus usePresence ersetzen:
```tsx
{typingUser && <TypingIndicator name={typingUser} />}
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add hooks/usePresence.ts app/(tabs)/forum/[channelId]/page.tsx
git commit -m "feat: online presence + typing indicator via Supabase Realtime Presence"
```

---

### Task 13: Unread Badge System

**Files:**
- Modify: `hooks/useChannel.ts`
- Modify: `app/(tabs)/forum/page.tsx`

- [ ] **Step 1: Unread-Tracking in useChannel**

In `hooks/useChannel.ts`, beim Empfang neuer Nachrichten via Realtime, den forumStore updaten:

```typescript
import { useForumStore } from '@/store/forumStore';

// In der postgres_changes subscription, nach dem setMessages:
// Nur zählen wenn der Chat nicht gerade offen ist (wird beim Öffnen gecleart)
const setUnread = useForumStore.getState().setUnread;
setUnread(newMsg.channelId, (useForumStore.getState().unreadByChannel[newMsg.channelId] ?? 0) + 1);
```

- [ ] **Step 2: Channels mit last message auf Forum-Home anreichern**

In `app/(tabs)/forum/page.tsx`, nach dem Laden der Channels, für jeden Channel die letzte Nachricht laden:

```typescript
import { getMessages } from '@/lib/forum';

// Nach setChannels(sorted):
const enriched = await Promise.all(
  sorted.map(async (ch) => {
    const msgs = await getMessages(ch.id, 1);
    return { ...ch, lastMessage: msgs[0] ?? null };
  })
);
setChannels(enriched);
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Final Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully`

- [ ] **Step 5: Commit**

```bash
git add hooks/useChannel.ts app/(tabs)/forum/page.tsx
git commit -m "feat: unread badge system — live count per channel, clears on open"
```

---

## Done

Alle 13 Tasks bilden eine vollständige Social Layer:
- ✅ Datenbankschema (profiles, friendships, channels, messages) + RLS
- ✅ TypeScript-Typen + Query-Lib
- ✅ Forum-Tab mit Unread-Badge in der BottomNav
- ✅ General Chat mit Realtime-Nachrichten
- ✅ DMs (aus Profil-Sheet heraus starten)
- ✅ Gruppen erstellen
- ✅ Profil-Sheet (aus Avatar-Tap)
- ✅ Freunde-System (Anfragen senden/annehmen)
- ✅ Workout-Karten teilen aus der Summary
- ✅ Typing Indicator + Online-Presence via Realtime Presence
- ✅ Unread-Counts persistiert in Zustand
