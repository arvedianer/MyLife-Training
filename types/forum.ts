export interface ForumProfile {
  id: string;
  username: string;
  avatarColor: string;
  athleteScore: number;
  streak: number;
  createdAt: string;
  role?: string | null; // e.g. 'cheffe', null for regular users
}

export type ChannelType = 'general' | 'dm' | 'group';

export interface Channel {
  id: string;
  type: ChannelType;
  name: string | null;
  participants: string[];
  createdBy: string | null;
  createdAt: string;
  // Client-side enriched:
  lastMessage?: Message | null;
  unreadCount?: number;
  otherUser?: ForumProfile | null; // for DMs
}

export type MessageType = 'text' | 'workout_card';

export interface WorkoutCardMetadata {
  sessionId: string;
  exercises: Array<{ nameDE: string; sets: number; maxWeight: number }>;
  totalVolume: number;
  durationSeconds: number;
  score?: number;
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
  // Client-side enriched:
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
