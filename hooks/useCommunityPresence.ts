'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface CommunityUser {
  userId: string;
  username: string;
  avatarColor: string;
  status: 'online' | 'training';
  exercise?: string;
  since?: string;
  role?: string | null;
}

export function useCommunityPresence(
  userId: string | null,
  username: string,
  avatarColor: string,
  role?: string | null,
) {
  const [onlineUsers, setOnlineUsers] = useState<CommunityUser[]>([]);
  const [trainingUsers, setTrainingUsers] = useState<CommunityUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const profileRef = useRef({ username, avatarColor, role: role ?? null });

  // Keep profileRef in sync with latest profile values
  useEffect(() => {
    profileRef.current = { username, avatarColor, role: role ?? null };
  }, [username, avatarColor, role]);

  // Effect 1: Subscribe to channel — only re-run when userId changes (not on profile updates)
  useEffect(() => {
    if (!userId) return;

    const ch = supabase.channel('community', {
      config: { presence: { key: userId } },
    });

    const syncPresence = () => {
      const state = ch.presenceState<CommunityUser>();
      const allUsers = Object.values(state).flat();
      setOnlineUsers(allUsers.filter((u) => u.status === 'online'));
      setTrainingUsers(allUsers.filter((u) => u.status === 'training'));
    };

    ch.on('presence', { event: 'sync' }, syncPresence);
    ch.on('presence', { event: 'join' }, syncPresence);
    ch.on('presence', { event: 'leave' }, syncPresence);

    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({
          userId,
          username: profileRef.current.username,
          avatarColor: profileRef.current.avatarColor,
          role: profileRef.current.role,
          status: 'online',
          since: new Date().toISOString(),
        });
      }
    });

    channelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [userId]); // Only userId — profile field changes handled in Effect 2

  // Effect 2: Re-track when profile fields change (does NOT recreate the channel)
  useEffect(() => {
    if (!userId || !channelRef.current) return;
    void channelRef.current.track({
      userId,
      username,
      avatarColor,
      role: role ?? null,
      status: 'online',
      since: new Date().toISOString(),
    });
  }, [userId, username, avatarColor, role]);

  // Function to update own status to 'training'
  const setTraining = useCallback(async (exercise?: string) => {
    if (!channelRef.current || !userId) return;
    await channelRef.current.track({
      userId,
      username,
      avatarColor,
      role: role ?? null,
      status: 'training',
      exercise,
      since: new Date().toISOString(),
    });
  }, [userId, username, avatarColor, role]);

  const setOnline = useCallback(async () => {
    if (!channelRef.current || !userId) return;
    await channelRef.current.track({
      userId,
      username,
      avatarColor,
      role: role ?? null,
      status: 'online',
      since: new Date().toISOString(),
    });
  }, [userId, username, avatarColor, role]);

  return { onlineUsers, trainingUsers, setTraining, setOnline };
}
