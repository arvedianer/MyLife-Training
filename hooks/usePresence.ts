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
      const name = typeof payload.username === 'string' ? payload.username : null;
      if (name) {
        setTypingUser(name);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTypingUser(null), 3000);
      }
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
