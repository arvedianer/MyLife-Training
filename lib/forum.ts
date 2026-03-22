import { supabase } from '@/lib/supabase';
import type { Channel, ForumProfile, Message, Friendship } from '@/types/forum';

// ── Profile ──────────────────────────────────────────────

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

export async function upsertProfile(userId: string, username: string): Promise<void> {
  const avatarColors = ['#4DFFED', '#FF9F0A', '#FF6B6B', '#A8FF78', '#78C5FF'];
  const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
  await supabase.from('profiles').upsert(
    { id: userId, username, avatar_color: avatarColor },
    { onConflict: 'id', ignoreDuplicates: true }
  );
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
  const { data: existing } = await supabase
    .from('channels')
    .select('id')
    .eq('type', 'dm')
    .contains('participants', [userId, otherId]);
  if (existing && existing.length > 0) return existing[0].id;
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

export async function deleteMessage(messageId: string): Promise<void> {
  await supabase.from('messages').delete().eq('id', messageId);
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

// ── Mappers ───────────────────────────────────────────────

function mapProfile(r: Record<string, unknown>): ForumProfile {
  return {
    id: r.id as string,
    username: r.username as string,
    avatarColor: (r.avatar_color as string) ?? '#4DFFED',
    athleteScore: (r.athlete_score as number) ?? 0,
    streak: (r.streak as number) ?? 0,
    createdAt: r.created_at as string,
  };
}

function mapChannel(r: Record<string, unknown>): Channel {
  return {
    id: r.id as string,
    type: r.type as Channel['type'],
    name: r.name as string | null,
    participants: (r.participants as string[]) ?? [],
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
