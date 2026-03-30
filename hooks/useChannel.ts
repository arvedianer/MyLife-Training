'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getMessages, sendTextMessage } from '@/lib/forum';
import { useForumStore } from '@/store/forumStore';
import type { Message } from '@/types/forum';

export function useChannel(channelId: string | null, currentUserId?: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!channelId) return;
    setLoading(true);
    getMessages(channelId).then((msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
  }, [channelId]);

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
          if (!currentUserId || newMsg.senderId !== currentUserId) {
            const { setUnread, unreadByChannel } = useForumStore.getState();
            setUnread(newMsg.channelId, (unreadByChannel[newMsg.channelId] ?? 0) + 1);
          }
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
