'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { ChatErrorBoundary } from '@/components/forum/ChatErrorBoundary';
import { useChannel } from '@/hooks/useChannel';
import { MessageBubble } from '@/components/forum/MessageBubble';
import { WorkoutCardMessage } from '@/components/forum/WorkoutCardMessage';
import { ProfileSheet } from '@/components/forum/ProfileSheet';
import { TypingIndicator } from '@/components/forum/TypingIndicator';
import { getProfile, getMyChannels, getMyProfile, softDeleteMessage } from '@/lib/forum';
import { usePresence } from '@/hooks/usePresence';
import { useForumStore } from '@/store/forumStore';
import { supabase } from '@/lib/supabase';
import { containsBlockedWord } from '@/constants/chatFilter';
import type { ForumProfile, Channel } from '@/types/forum';

export default function ChatPage({ params }: { params: { channelId: string } }) {
  const { channelId } = params;
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const { messages, loading, send } = useChannel(channelId, userId);
  const [input, setInput] = useState('');
  const [myUsername, setMyUsername] = useState('');
  const [myProfile, setMyProfile] = useState<ForumProfile | null>(null);
  const [profiles, setProfiles] = useState<Record<string, ForumProfile>>({});
  const [selectedProfile, setSelectedProfile] = useState<ForumProfile | null>(null);
  const [channelMeta, setChannelMeta] = useState<Channel | null>(null);
  const [filterToast, setFilterToast] = useState(false);
  const [longPressedMsgId, setLongPressedMsgId] = useState<string | null>(null);
  const { onlineUsers, typingUser, broadcastTyping } = usePresence(channelId, userId, myUsername);
  const bottomRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearUnread = useForumStore((s) => s.clearUnread);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        const profile = await getMyProfile();
        setMyUsername(profile?.username ?? '');
        setMyProfile(profile);
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

  useEffect(() => {
    return () => {
      if (filterToastTimerRef.current) clearTimeout(filterToastTimerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  const handleSend = async () => {
    if (!userId || !input.trim()) return;

    // Content filter (only for non-cheffe users in general channel)
    if (channelMeta?.type === 'general' && myProfile?.role !== 'cheffe') {
      if (containsBlockedWord(input)) {
        setFilterToast(true);
        if (filterToastTimerRef.current) clearTimeout(filterToastTimerRef.current);
        filterToastTimerRef.current = setTimeout(() => { setFilterToast(false); }, 3000);
        return;
      }
    }

    const text = input;
    setInput('');
    await send(userId, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const channelTitle =
    channelMeta?.type === 'general' ? 'General Chat' :
    channelMeta?.type === 'group' ? (channelMeta.name ?? 'Gruppe') :
    channelMeta?.otherUser?.username ?? 'Chat';

  const channelSubtitle =
    channelMeta?.type === 'general' ? 'Alle Mitglieder' :
    channelMeta?.type === 'group' ? `${(channelMeta?.participants ?? []).length} Mitglieder` :
    'Direktnachricht';

  if (loading && messages.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPrimary }}>
        <p style={{ ...typography.body, color: colors.textMuted }}>Laden...</p>
      </div>
    );
  }

  if (!channelMeta) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPrimary }}>
        <p style={{ ...typography.body, color: colors.textMuted }}>Kanal nicht gefunden.</p>
      </div>
    );
  }

  return (
    <ChatErrorBoundary>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: colors.bgPrimary, position: 'relative' }}>
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
          <div style={{ ...typography.body, color: colors.textPrimary, fontWeight: 700 }}>{channelTitle}</div>
          <div style={{ ...typography.label, color: colors.textMuted }}>{channelSubtitle}</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: spacing[4] }}>
        {loading && <div style={{ textAlign: 'center', color: colors.textMuted, paddingTop: 40 }}>Lädt...</div>}
        {messages.map((msg) => {
          const sender = profiles[msg.senderId] ?? null;
          const isOwn = msg.senderId === userId;
          const isCoachMessage = msg.isCoach === true || sender?.isCoach === true || sender?.username === 'Coach Arved';
          const commonProps = { message: msg, sender, isOwn, onAvatarPress: () => { if (sender) setSelectedProfile(sender); } };
          return (
            <div
              key={msg.id}
              onPointerDown={() => {
                if (myProfile?.role !== 'cheffe') return;
                longPressTimerRef.current = setTimeout(() => {
                  setLongPressedMsgId(msg.id);
                }, 600);
              }}
              onPointerUp={() => {
                if (longPressTimerRef.current) {
                  clearTimeout(longPressTimerRef.current);
                  longPressTimerRef.current = null;
                }
              }}
              onPointerLeave={() => {
                if (longPressTimerRef.current) {
                  clearTimeout(longPressTimerRef.current);
                  longPressTimerRef.current = null;
                }
              }}
              style={{ touchAction: 'pan-y' }}
            >
              {isCoachMessage ? (
                <div style={{
                  borderLeft: `2px solid ${colors.accent}`,
                  paddingLeft: spacing[3],
                  marginBottom: spacing[2],
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1], marginBottom: spacing[1] }}>
                    <span style={{ ...typography.label, color: colors.accent }}>Coach Arved</span>
                    <span style={{ ...typography.label, color: colors.textDisabled }}>• KI</span>
                  </div>
                  {msg.type === 'workout_card'
                    ? <WorkoutCardMessage {...commonProps} />
                    : <MessageBubble {...commonProps} />}
                </div>
              ) : (
                msg.type === 'workout_card'
                  ? <WorkoutCardMessage {...commonProps} />
                  : <MessageBubble {...commonProps} />
              )}
            </div>
          );
        })}
        {typingUser && <TypingIndicator name={typingUser} />}
        <div ref={bottomRef} />
      </div>

      {/* Filter toast */}
      {filterToast && (
        <div style={{
          position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          backgroundColor: colors.danger, borderRadius: radius.full,
          padding: '8px 16px', color: colors.textPrimary, fontSize: 13, fontWeight: 600,
          whiteSpace: 'nowrap', zIndex: 10,
        }}>
          Nicht so bitte 🫵
        </div>
      )}

      {/* Cheffe delete confirmation popup */}
      {longPressedMsgId && (
        <>
          <div
            onClick={() => setLongPressedMsgId(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
          />
          <div style={{
            position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
            backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
            borderRadius: radius.xl, padding: spacing[3], zIndex: 101,
            display: 'flex', gap: spacing[2],
          }}>
            <button
              onClick={async () => {
                await softDeleteMessage(longPressedMsgId);
                setLongPressedMsgId(null);
              }}
              style={{
                padding: `${spacing[2]} ${spacing[3]}`,
                backgroundColor: colors.danger, border: 'none', borderRadius: radius.full,
                color: colors.textPrimary, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              🔥 Nachricht entfernen
            </button>
            <button
              onClick={() => setLongPressedMsgId(null)}
              style={{
                padding: `${spacing[2]} ${spacing[3]}`,
                backgroundColor: colors.bgHighest, border: `1px solid ${colors.border}`,
                borderRadius: radius.full, color: colors.textMuted, fontSize: 12, cursor: 'pointer',
              }}
            >
              Abbrechen
            </button>
          </div>
        </>
      )}

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
    </ChatErrorBoundary>
  );
}
