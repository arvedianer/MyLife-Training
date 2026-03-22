'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { useChannel } from '@/hooks/useChannel';
import { MessageBubble } from '@/components/forum/MessageBubble';
import { WorkoutCardMessage } from '@/components/forum/WorkoutCardMessage';
import { ProfileSheet } from '@/components/forum/ProfileSheet';
import { TypingIndicator } from '@/components/forum/TypingIndicator';
import { getProfile, getMyChannels, getMyProfile } from '@/lib/forum';
import { usePresence } from '@/hooks/usePresence';
import { useForumStore } from '@/store/forumStore';
import { supabase } from '@/lib/supabase';
import type { ForumProfile, Channel } from '@/types/forum';

export default function ChatPage({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = use(params);
  const router = useRouter();
  const { messages, loading, send } = useChannel(channelId);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState('');
  const [profiles, setProfiles] = useState<Record<string, ForumProfile>>({});
  const [selectedProfile, setSelectedProfile] = useState<ForumProfile | null>(null);
  const [channelMeta, setChannelMeta] = useState<Channel | null>(null);
  const { onlineUsers, typingUser, broadcastTyping } = usePresence(channelId, userId, myUsername);
  const bottomRef = useRef<HTMLDivElement>(null);
  const clearUnread = useForumStore((s) => s.clearUnread);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        const profile = await getMyProfile();
        setMyUsername(profile?.username ?? '');
      }
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    getMyChannels(userId).then((chs) => {
      const meta = chs.find((c) => c.id === channelId) ?? null;
      setChannelMeta(meta);
    });
  }, [channelId, userId]);

  useEffect(() => {
    clearUnread(channelId);
  }, [channelId, clearUnread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    const senderIds = [...new Set(messages.map((m) => m.senderId))].filter((id) => !profiles[id]);
    senderIds.forEach((id) => {
      getProfile(id).then((p) => {
        if (!cancelled && p) setProfiles((prev) => ({ ...prev, [id]: p }));
      });
    });
    return () => { cancelled = true; };
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

  const headerTitle =
    channelMeta?.type === 'general' ? 'General Chat' :
    channelMeta?.type === 'group' ? (channelMeta.name ?? 'Gruppe') :
    (channelMeta?.otherUser?.username ?? 'Direktnachricht');

  const headerSub =
    channelMeta?.type === 'general' ? 'Alle Mitglieder' :
    channelMeta?.type === 'group' ? `${(channelMeta?.participants ?? []).length} Mitglieder` :
    'Direktnachricht';

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
          <div style={{ ...typography.body, color: colors.textPrimary, fontWeight: 700 }}>{headerTitle}</div>
          <div style={{ ...typography.label, color: colors.textMuted }}>{headerSub}</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: spacing[4] }}>
        {loading && <div style={{ textAlign: 'center', color: colors.textMuted, paddingTop: 40 }}>Lädt...</div>}
        {messages.map((msg) => {
          const sender = profiles[msg.senderId] ?? null;
          const isOwn = msg.senderId === userId;
          const commonProps = { message: msg, sender, isOwn, onAvatarPress: () => { if (sender) setSelectedProfile(sender); } };
          return msg.type === 'workout_card'
            ? <WorkoutCardMessage key={msg.id} {...commonProps} />
            : <MessageBubble key={msg.id} {...commonProps} />;
        })}
        {typingUser && <TypingIndicator name={typingUser} />}
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
          onChange={(e) => { setInput(e.target.value); broadcastTyping(); }}
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
            width: 40, height: 40, borderRadius: '50%',
            backgroundColor: input.trim() ? colors.accent : colors.bgHighest,
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() ? 'pointer' : 'default', transition: 'background 0.2s',
          }}
        >
          <Send size={16} color={input.trim() ? colors.bgPrimary : colors.textDisabled} />
        </button>
      </div>

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
