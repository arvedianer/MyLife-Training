'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, Sparkles, Dumbbell, TrendingUp, Zap, RotateCcw } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { useHistoryStore } from '@/store/historyStore';
import { useUserStore } from '@/store/userStore';
import { calculateStreak } from '@/utils/dates';
import { getExerciseById } from '@/constants/exercises';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const STARTER_PROMPTS = [
  { icon: '💪', text: 'Wie verbessere ich meinen Bench Press?' },
  { icon: '📊', text: 'Analysiere mein letztes Workout' },
  { icon: '🥩', text: 'Wie viel Protein brauche ich täglich?' },
  { icon: '😴', text: 'Warum bin ich immer noch so müde?' },
  { icon: '🔥', text: 'Welche Muskeln habe ich vernachlässigt?' },
  { icon: '📈', text: 'Wie steigere ich am schnellsten mein Volumen?' },
];

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function ChatPage() {
  const { sessions } = useHistoryStore();
  const { profile } = useUserStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Build workout history context (last 10 sessions)
  const buildWorkoutHistory = useCallback(() => {
    return sessions.slice(0, 10).map((s) => ({
      date: s.date,
      splitName: s.splitName,
      totalVolume: Math.round(s.totalVolume),
      durationSeconds: s.durationSeconds,
      totalSets: s.totalSets,
      newPRs: s.newPRs.map((id) => getExerciseById(id)?.nameDE ?? id),
      exercises: s.exercises.slice(0, 6).map((e) => ({
        name: e.exercise.nameDE,
        sets: e.sets.filter((st) => st.isCompleted).length,
        maxWeight: Math.max(0, ...e.sets.map((st) => st.weight)),
      })),
    }));
  }, [sessions]);

  // Build user profile context
  const buildUserProfile = useCallback(() => {
    const streak = calculateStreak(sessions.map(s => s.date));
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekSessions = sessions.filter(
      (s) => new Date(s.date).getTime() >= weekAgo
    );
    const weeklyVolume = weekSessions.reduce((sum, s) => sum + s.totalVolume, 0);

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

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setError(null);

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    // Abort previous request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          workoutHistory: buildWorkoutHistory(),
          userProfile: buildUserProfile(),
        }),
      });

      const data = await res.json() as { reply?: string; error?: string };
      const reply = data.reply ?? 'Ups, da ist was schiefgelaufen. Versuch es nochmal!';

      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: 'assistant', content: reply, timestamp: Date.now() },
      ]);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError('Verbindungsfehler. Prüfe deine Internetverbindung.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  const isEmpty = messages.length === 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: colors.bgPrimary,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${spacing[4]} ${spacing[5]}`,
          paddingTop: `calc(${spacing[4]} + env(safe-area-inset-top))`,
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.bgSecondary,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
          {/* Avatar */}
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: radius.full,
              background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.prColor} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 0 12px ${colors.accent}40`,
            }}
          >
            <Bot size={22} color={colors.bgPrimary} />
          </div>
          <div>
            <div style={{ ...typography.h3, color: colors.textPrimary }}>MAX</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: colors.success,
                }}
              />
              <span style={{ ...typography.label, fontSize: '10px', color: colors.success }}>
                Personal Trainer · Online
              </span>
            </div>
          </div>
        </div>

        {!isEmpty && (
          <button
            onClick={clearChat}
            style={{ padding: spacing[2], color: colors.textMuted }}
            title="Chat leeren"
          >
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: `${spacing[4]} ${spacing[4]}`,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[3],
        }}
      >
        {/* Empty state */}
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: spacing[8],
              paddingBottom: spacing[4],
              gap: spacing[4],
            }}
          >
            {/* Big avatar */}
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: radius.full,
                background: `linear-gradient(135deg, ${colors.accent}22 0%, ${colors.prColor}22 100%)`,
                border: `1px solid ${colors.accent}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={32} color={colors.accent} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <h2 style={{ ...typography.h2, color: colors.textPrimary, marginBottom: spacing[2] }}>
                Ich bin MAX
              </h2>
              <p style={{ ...typography.body, color: colors.textMuted, maxWidth: '260px', lineHeight: '22px' }}>
                Dein KI Personal Trainer. Ich kenne deine Workout-History und helfe dir schneller voranzukommen.
              </p>
            </div>

            {/* Stats pills */}
            {sessions.length > 0 && (
              <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap', justifyContent: 'center' }}>
                <StatPill icon={<Dumbbell size={12} color={colors.accent} />} label={`${sessions.length} Workouts`} />
                <StatPill icon={<TrendingUp size={12} color={colors.prColor} />} label={`${calculateStreak(sessions.map(s => s.date))} Tage Streak`} />
                <StatPill icon={<Zap size={12} color={colors.volumeColor} />} label="History geladen" />
              </div>
            )}

            {/* Starter prompts */}
            <div
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: spacing[2],
                marginTop: spacing[2],
              }}
            >
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p.text}
                  onClick={() => sendMessage(p.text)}
                  style={{
                    padding: spacing[3],
                    backgroundColor: colors.bgCard,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.lg,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing[1],
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.bgElevated;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.bgCard;
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{p.icon}</span>
                  <span style={{ ...typography.bodySm, color: colors.textSecondary, lineHeight: '16px' }}>
                    {p.text}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Message list */}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                gap: spacing[2],
                alignItems: 'flex-end',
              }}
            >
              {/* Avatar for assistant */}
              {msg.role === 'assistant' && (
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: radius.full,
                    background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.prColor} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Bot size={14} color={colors.bgPrimary} />
                </div>
              )}

              {/* Bubble */}
              <div
                style={{
                  maxWidth: '78%',
                  padding: `${spacing[3]} ${spacing[4]}`,
                  borderRadius: msg.role === 'user'
                    ? `${radius.xl} ${radius.xl} ${spacing[1]} ${radius.xl}`
                    : `${radius.xl} ${radius.xl} ${radius.xl} ${spacing[1]}`,
                  backgroundColor: msg.role === 'user'
                    ? colors.accent
                    : colors.bgCard,
                  border: msg.role === 'assistant' ? `1px solid ${colors.border}` : 'none',
                }}
              >
                <p
                  style={{
                    ...typography.body,
                    color: msg.role === 'user' ? colors.bgPrimary : colors.textPrimary,
                    whiteSpace: 'pre-wrap',
                    lineHeight: '22px',
                    margin: 0,
                  }}
                >
                  {msg.content}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', gap: spacing[2], alignItems: 'flex-end' }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: radius.full,
                background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.prColor} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Bot size={14} color={colors.bgPrimary} />
            </div>
            <div
              style={{
                padding: `${spacing[3]} ${spacing[4]}`,
                backgroundColor: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: `${radius.xl} ${radius.xl} ${radius.xl} ${spacing[1]}`,
                display: 'flex',
                gap: spacing[1],
                alignItems: 'center',
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: colors.textMuted,
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              padding: spacing[3],
              backgroundColor: colors.dangerBg,
              border: `1px solid ${colors.danger}40`,
              borderRadius: radius.lg,
              ...typography.bodySm,
              color: colors.danger,
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div
        style={{
          borderTop: `1px solid ${colors.border}`,
          backgroundColor: colors.bgSecondary,
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
            padding: `${spacing[2]} ${spacing[2]} ${spacing[2]} ${spacing[4]}`,
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Frag MAX..."
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
              maxHeight: '120px',
              overflowY: 'auto',
            }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
          />

          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: radius.full,
              backgroundColor: input.trim() && !isLoading ? colors.accent : colors.bgElevated,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() && !isLoading ? 'pointer' : 'default',
              flexShrink: 0,
              transition: 'background-color 0.15s',
            }}
          >
            <Send size={16} color={input.trim() && !isLoading ? colors.bgPrimary : colors.textDisabled} />
          </button>
        </div>
        <p
          style={{
            ...typography.label,
            fontSize: '9px',
            color: colors.textFaint,
            textAlign: 'center',
            marginTop: spacing[2],
          }}
        >
          MAX kann Fehler machen — wichtige Entscheidungen immer mit einem Arzt absprechen.
        </p>
      </div>

      {/* Bounce animation keyframes */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing[1],
        padding: `${spacing[1]} ${spacing[3]}`,
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.full,
      }}
    >
      {icon}
      <span style={{ ...typography.label, fontSize: '10px', color: colors.textMuted }}>{label}</span>
    </div>
  );
}
