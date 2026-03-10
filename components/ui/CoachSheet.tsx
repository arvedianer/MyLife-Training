'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, Send, Mic, MicOff } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { useHistoryStore } from '@/store/historyStore';
import { useUserStore } from '@/store/userStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { useChatStore } from '@/store/chatStore';
import { calculateStreak } from '@/utils/dates';
import { getExerciseById } from '@/constants/exercises';
import { usePathname } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '@/store/chatStore';

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface CoachSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CoachSheet({ isOpen, onClose }: CoachSheetProps) {
  const { sessions } = useHistoryStore();
  const { profile } = useUserStore();
  const { activeWorkout } = useWorkoutStore();
  const pathname = usePathname();

  const { conversations, activeConversationId, newConversation, addMessage, updateLastMessage, getActiveConversation } = useChatStore();
  const activeConv = getActiveConversation();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Ensure there's an active conversation when sheet opens
  useEffect(() => {
    if (isOpen && !activeConversationId) {
      newConversation();
    }
  }, [isOpen, activeConversationId, newConversation]);

  const messages = activeConv?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const buildWorkoutHistory = useCallback(() => {
    return sessions.slice(0, 5).map((s) => ({
      date: s.date,
      splitName: s.splitName,
      totalVolume: Math.round(s.totalVolume),
      durationSeconds: s.durationSeconds,
      totalSets: s.totalSets,
      newPRs: s.newPRs.map((id) => getExerciseById(id)?.nameDE ?? id),
      exercises: s.exercises.slice(0, 4).map((e) => ({
        name: e.exercise.nameDE,
        sets: e.sets.filter((st) => st.isCompleted).length,
        maxWeight: Math.max(0, ...e.sets.map((st) => st.weight)),
      })),
    }));
  }, [sessions]);

  const buildUserProfile = useCallback(() => {
    const streak = calculateStreak(sessions.map((s) => s.date));
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyVolume = sessions
      .filter((s) => new Date(s.date).getTime() >= weekAgo)
      .reduce((sum, s) => sum + s.totalVolume, 0);
    return {
      name: profile?.name,
      goal: profile?.goal,
      level: profile?.level,
      equipment: profile?.equipment,
      weeklyVolume: Math.round(weeklyVolume),
      totalSessions: sessions.length,
      currentStreak: streak,
    };
  }, [sessions, profile]);

  const buildAppContext = useCallback(() => ({
    page: pathname,
    isWorkoutActive: !!activeWorkout,
    activeWorkoutName: activeWorkout?.plannedSplit,
    exerciseCount: activeWorkout?.exercises.length,
  }), [pathname, activeWorkout]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setInput('');

    const convId = activeConversationId ?? newConversation();

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    addMessage(convId, userMsg);
    setIsLoading(true);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const currentMessages = [...(getActiveConversation()?.messages ?? [])];
    const allMessages = currentMessages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages: allMessages,
          workoutHistory: buildWorkoutHistory(),
          userProfile: buildUserProfile(),
          appContext: buildAppContext(),
        }),
      });

      if (!res.body) throw new Error('No response body');

      const aiMsgId = generateId();
      const aiMsg: ChatMessage = { id: aiMsgId, role: 'assistant', content: '', timestamp: Date.now() };
      addMessage(convId, aiMsg);
      setIsLoading(false);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          assistantText += decoder.decode(value, { stream: true });
          updateLastMessage(convId, assistantText);
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setIsLoading(false);
      }
    }
  };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = 'de-DE';
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript as string;
      setInput((prev) => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
    setListening(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              zIndex: 45,
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: '75dvh',
              backgroundColor: colors.bgSecondary,
              borderRadius: `${radius.xl} ${radius.xl} 0 0`,
              border: `1px solid ${colors.border}`,
              borderBottom: 'none',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${spacing[4]} ${spacing[5]}`,
                borderBottom: `1px solid ${colors.border}`,
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: radius.full,
                    background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.prColor} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Bot size={18} color={colors.bgPrimary} />
                </div>
                <div>
                  <div style={{ ...typography.h3, color: colors.textPrimary }}>Coach Arved</div>
                  <div style={{ ...typography.label, fontSize: '10px', color: colors.success }}>
                    Personal Trainer · Online
                  </div>
                </div>
              </div>
              <button onClick={onClose} style={{ padding: spacing[2] }}>
                <X size={20} color={colors.textMuted} />
              </button>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: spacing[4],
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[3],
              }}
            >
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', paddingTop: spacing[8], color: colors.textMuted }}>
                  <Bot size={40} color={`${colors.accent}50`} style={{ margin: '0 auto 12px' }} />
                  <p style={{ ...typography.body, color: colors.textMuted }}>
                    Frag mich alles über Training, Ernährung oder deine Stats.
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    gap: spacing[2],
                    alignItems: 'flex-end',
                  }}
                >
                  {msg.role === 'assistant' && (
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: radius.full,
                        background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.prColor} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Bot size={12} color={colors.bgPrimary} />
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: `${spacing[3]} ${spacing[4]}`,
                      borderRadius: msg.role === 'user'
                        ? `${radius.xl} ${radius.xl} ${spacing[1]} ${radius.xl}`
                        : `${radius.xl} ${radius.xl} ${radius.xl} ${spacing[1]}`,
                      backgroundColor: msg.role === 'user' ? colors.accent : colors.bgCard,
                      border: msg.role === 'assistant' ? `1px solid ${colors.border}` : 'none',
                    }}
                  >
                    {msg.role === 'user' ? (
                      <p style={{ ...typography.body, color: colors.bgPrimary, margin: 0, whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </p>
                    ) : (
                      <div style={{ ...typography.body, color: colors.textPrimary, lineHeight: '22px', wordBreak: 'break-word' }}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ node, ...props }) => <p style={{ margin: '0 0 8px 0' }} {...(props as any)} />,
                            ul: ({ node, ...props }) => <ul style={{ margin: '0 0 8px 0', paddingLeft: '18px' }} {...(props as any)} />,
                            li: ({ node, ...props }) => <li style={{ marginBottom: '3px' }} {...(props as any)} />,
                            strong: ({ node, ...props }) => <strong style={{ color: colors.textPrimary }} {...(props as any)} />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div style={{ display: 'flex', gap: spacing[2], alignItems: 'flex-end' }}>
                  <div
                    style={{
                      width: '24px', height: '24px', borderRadius: radius.full,
                      background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.prColor} 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                  >
                    <Bot size={12} color={colors.bgPrimary} />
                  </div>
                  <div
                    style={{
                      padding: `${spacing[3]} ${spacing[4]}`,
                      backgroundColor: colors.bgCard,
                      border: `1px solid ${colors.border}`,
                      borderRadius: `${radius.xl} ${radius.xl} ${radius.xl} ${spacing[1]}`,
                      display: 'flex', gap: spacing[1], alignItems: 'center',
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: '5px', height: '5px', borderRadius: '50%',
                          backgroundColor: colors.textMuted,
                          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div
              style={{
                borderTop: `1px solid ${colors.border}`,
                padding: `${spacing[3]} ${spacing[4]}`,
                paddingBottom: `calc(${spacing[3]} + env(safe-area-inset-bottom))`,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: spacing[2],
                  backgroundColor: colors.bgHighest,
                  borderRadius: radius.xl,
                  border: `1px solid ${colors.border}`,
                  padding: `${spacing[2]} ${spacing[2]} ${spacing[2]} ${spacing[3]}`,
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Frag Coach Arved..."
                  rows={1}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    ...typography.body,
                    color: colors.textPrimary,
                    lineHeight: '22px',
                    maxHeight: '80px',
                    overflowY: 'auto',
                  }}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    el.style.height = `${Math.min(el.scrollHeight, 80)}px`;
                  }}
                />
                {/* Mic button */}
                <button
                  onClick={startListening}
                  disabled={listening}
                  style={{
                    width: '32px', height: '32px', borderRadius: radius.full,
                    backgroundColor: listening ? `${colors.danger}20` : 'transparent',
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0, transition: 'background-color 0.15s',
                  }}
                >
                  {listening
                    ? <MicOff size={16} color={colors.danger} style={{ animation: 'pulse 1s infinite' }} />
                    : <Mic size={16} color={colors.textMuted} />
                  }
                </button>
                {/* Send button */}
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  style={{
                    width: '32px', height: '32px', borderRadius: radius.full,
                    backgroundColor: input.trim() && !isLoading ? colors.accent : colors.bgElevated,
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                    flexShrink: 0, transition: 'background-color 0.15s',
                  }}
                >
                  <Send size={14} color={input.trim() && !isLoading ? colors.bgPrimary : colors.textDisabled} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
