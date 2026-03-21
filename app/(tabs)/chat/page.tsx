'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, Sparkles, Dumbbell, TrendingUp, Zap, Plus, Menu, Mic, MicOff, BookOpen, Trash2, X } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { useHistoryStore } from '@/store/historyStore';
import { useUserStore } from '@/store/userStore';
import { useChatStore } from '@/store/chatStore';
import { usePlanStore } from '@/store/planStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { useExerciseStore } from '@/store/exerciseStore';
import { calculateStreak } from '@/utils/dates';
import { getExerciseById, findExerciseByName } from '@/constants/exercises';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { usePathname } from 'next/navigation';
import type { TrainingSplit, SplitDay } from '@/types/splits';
import type { ChatMessage } from '@/store/chatStore';

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Detect if AI message likely contains a training plan
function detectTrainingPlan(text: string): boolean {
  const hasSetRepPattern = /\d+\s*[xX×]\s*\d+|\d+\s*Sätze/i.test(text);
  if (!hasSetRepPattern) return false;
  // Strong signals: multiple ### headings or structured day/muscle pattern
  const headingCount = (text.match(/###|##/g) ?? []).length;
  const hasDayPattern = /Tag\s*\d|Day\s*\d|Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Brust\s*\+|Push|Pull|Legs/i.test(text);
  const hasBulletList = (text.match(/^[-*]\s/m) !== null);
  return headingCount >= 2 || (hasDayPattern && hasBulletList);
}

const QUICK_REPLIES = [
  'Warum dieser Score?',
  'Trainingsplan anpassen',
  'Welche Übung für Brust?',
  'Progressive Overload erklären',
  'Bin ich übertrainiert?',
];

const STARTER_PROMPTS = [
  { icon: <Dumbbell size={14} color={colors.accent} />, text: 'Erstell mir den Arnold Split' },
  { icon: <TrendingUp size={14} color={colors.prColor} />, text: 'Analysiere mein letztes Workout' },
  { icon: <Zap size={14} color={colors.volumeColor} />, text: 'Was ist meine schwächste Übung?' },
  { icon: <Sparkles size={14} color={colors.success} />, text: 'Erkläre mir die perfekte Kniebeugen-Technik' },
];

// What Coach Arved can do — shown in empty state
const CAPABILITIES = [
  { emoji: '📊', text: 'Workouts analysieren & auswerten' },
  { emoji: '🏋️', text: 'Trainingspläne erstellen (Arnold, PPL, Upper/Lower)' },
  { emoji: '🎯', text: 'Übungstechnik & Science-based Tipps' },
  { emoji: '📈', text: 'Progressive Overload berechnen' },
  { emoji: '🎤', text: 'Sprachsteuerung während dem Workout' },
  { emoji: '💾', text: 'Pläne direkt in die App speichern' },
];

export default function ChatPage() {
  const { sessions } = useHistoryStore();
  const { profile } = useUserStore();
  const { activeWorkout } = useWorkoutStore();
  const { addSplit } = usePlanStore();
  const pathname = usePathname();

  const {
    conversations,
    activeConversationId,
    newConversation,
    setActiveConversation,
    addMessage,
    updateLastMessage,
    deleteConversation,
    getActiveConversation,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [savingPlan, setSavingPlan] = useState<string | null>(null); // msgId being saved
  const [savedPlanIds, setSavedPlanIds] = useState<Set<string>>(new Set());
  const [planToast, setPlanToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);
  const manualStopRef = useRef(false);

  // Init active conversation
  useEffect(() => {
    if (!activeConversationId) {
      newConversation();
    }
  }, [activeConversationId, newConversation]);

  const activeConv = getActiveConversation();
  const messages = activeConv?.messages ?? [];
  const isEmpty = messages.length === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // --- Context builders ---
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

  // --- Send message ---
  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setError(null);
    setShowQuickReplies(false);

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

    // Build messages for API: include full history
    const conv = useChatStore.getState().getActiveConversation();
    const apiMessages = (conv?.messages ?? []).map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages: apiMessages,
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
      setShowQuickReplies(true);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError('Verbindungsfehler. Prüfe deine Internetverbindung.');
        setIsLoading(false);
      }
    }
  };

  // --- Voice input (toggle: click once to start, again to stop) ---
  const toggleListening = () => {
    if (listening) {
      manualStopRef.current = true;
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError('Spracheingabe nicht unterstützt. Bitte Chrome oder Edge verwenden.');
      return;
    }

    try {
      manualStopRef.current = false;
      const recognition = new SR();
      recognitionRef.current = recognition;
      recognition.lang = 'de-DE';
      recognition.interimResults = false;
      recognition.continuous = true;

      recognition.onresult = (e: any) => {
        let newTranscript = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            newTranscript += e.results[i][0].transcript + ' ';
          }
        }
        if (newTranscript.trim()) {
          setInput((prev) => {
            const trimmedPrev = prev.trim();
            return trimmedPrev ? trimmedPrev + ' ' + newTranscript.trim() : newTranscript.trim();
          });
        }
      };

      recognition.onend = () => {
        if (!manualStopRef.current && recognitionRef.current) {
          try {
            recognition.start();
          } catch {
            setListening(false);
            recognitionRef.current = null;
          }
        } else {
          setListening(false);
          recognitionRef.current = null;
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error === 'not-allowed') {
          manualStopRef.current = true;
          setListening(false);
          recognitionRef.current = null;
          setError('Mikrofon-Zugriff verweigert — bitte in den Browser-Einstellungen erlauben.');
        } else if (e.error === 'no-speech') {
          // ignore, onend will restart
        } else {
          manualStopRef.current = true;
          setListening(false);
          recognitionRef.current = null;
          setError('Spracheingabe fehlgeschlagen. Bitte erneut versuchen.');
        }
      };

      recognition.start();
      setListening(true);
    } catch {
      setError('Spracheingabe konnte nicht gestartet werden.');
    }
  };

  // --- Save AI plan ---
  const saveAIPlan = async (msgId: string, text: string) => {
    if (savedPlanIds.has(msgId) || savingPlan) return;
    setSavingPlan(msgId);
    try {
      const res = await fetch('/api/chat/parse-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.name && Array.isArray(data.days)) {

        let dbExercises: any[] = [];
        try {
          const fetchRes = await fetch('/data/exercises.json');
          if (fetchRes.ok) {
            dbExercises = (await fetchRes.json()).exercises || [];
          }
        } catch { }

        const findGlobal = (name: string): string => {
          const nameLower = name.toLowerCase();
          const local = findExerciseByName(name);
          if (local) return local.id;

          const custom = useExerciseStore.getState().customExercises.find(
            (e) => e.name.toLowerCase().includes(nameLower) || e.nameDE.toLowerCase().includes(nameLower)
          );
          if (custom) return custom.id;

          const dbFound = dbExercises.find(
            (e) => e.name.toLowerCase().includes(nameLower) || e.name_de.toLowerCase().includes(nameLower)
          );
          if (dbFound) return `db-${dbFound.id}`;

          // If still not found, create a new custom exercise automatically
          const newId = `custom-ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          useExerciseStore.getState().addCustomExercise({
            id: newId,
            name: name,
            nameDE: name,
            primaryMuscle: 'core',
            secondaryMuscles: [],
            equipment: [],
            category: 'compound',
            defaultSets: 3,
            defaultReps: 10,
            defaultWeight: 0,
            repRange: { min: 8, max: 12 },
            restSeconds: 90,
            scienceNote: 'Von AI generiert',
            createdBy: 'coach'
          });
          return newId;
        };

        const split: TrainingSplit = {
          id: generateId(),
          name: data.name,
          type: 'custom',
          description: 'Von Coach Arved erstellt',
          scienceNote: '',
          days: data.days.map((d: { name: string; exercises: string[] }): SplitDay => ({
            id: generateId(),
            name: d.name,
            muscleGroups: [],
            // Map AI exercise names via global fuzzy matching & auto-creation
            exerciseIds: Array.isArray(d.exercises)
              ? d.exercises.map((name: string) => findGlobal(name)).filter((id): id is string => !!id)
              : [],
            restDay: false,
          })),
          daysPerWeek: data.days.length,
          difficulty: profile?.level === 'fortgeschritten' ? 'advanced' : 'intermediate',
          isActive: false,
          createdAt: Date.now(),
        };
        addSplit(split);
        setSavedPlanIds((prev) => new Set([...prev, msgId]));
        setPlanToast(true);
        setTimeout(() => setPlanToast(false), 3000);
      }
    } catch {
      setError('Plan konnte nicht gespeichert werden.');
    } finally {
      setSavingPlan(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const startNewConversation = () => {
    newConversation();
    setHistoryOpen(false);
    setError(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: colors.bgPrimary, position: 'relative' }}>
      {/* Plan saved toast */}
      <AnimatePresence>
        {planToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'absolute',
              top: '70px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: colors.successBg,
              border: `1px solid ${colors.success}40`,
              borderRadius: radius.lg,
              padding: `${spacing[2]} ${spacing[4]}`,
              ...typography.bodySm,
              color: colors.success,
              zIndex: 100,
              whiteSpace: 'nowrap',
            }}
          >
            ✓ Plan gespeichert! Unter Splits verfügbar.
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Drawer */}
      <AnimatePresence>
        {historyOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHistoryOpen(false)}
              style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 60 }}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '280px',
                backgroundColor: colors.bgSecondary,
                borderRight: `1px solid ${colors.border}`,
                zIndex: 70,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: `${spacing[4]} ${spacing[4]}`,
                  paddingTop: `calc(${spacing[4]} + env(safe-area-inset-top))`,
                  borderBottom: `1px solid ${colors.border}`,
                  flexShrink: 0,
                }}
              >
                <span style={{ ...typography.h3, color: colors.textPrimary }}>Verlauf</span>
                <button onClick={() => setHistoryOpen(false)} style={{ padding: spacing[2] }}>
                  <X size={18} color={colors.textMuted} />
                </button>
              </div>

              <button
                onClick={startNewConversation}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  margin: spacing[3],
                  padding: `${spacing[3]} ${spacing[4]}`,
                  backgroundColor: colors.accentBg,
                  border: `1px solid ${colors.accent}30`,
                  borderRadius: radius.lg,
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} color={colors.accent} />
                <span style={{ ...typography.body, color: colors.accent }}>Neues Gespräch</span>
              </button>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {conversations.length === 0 && (
                  <p style={{ ...typography.bodySm, color: colors.textFaint, padding: spacing[4], textAlign: 'center' }}>
                    Noch keine Gespräche.
                  </p>
                )}
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2],
                      padding: `${spacing[3]} ${spacing[4]}`,
                      backgroundColor: conv.id === activeConversationId ? colors.bgElevated : 'transparent',
                      borderLeft: conv.id === activeConversationId ? `2px solid ${colors.accent}` : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                    onClick={() => {
                      setActiveConversation(conv.id);
                      setHistoryOpen(false);
                    }}
                  >
                    <BookOpen size={14} color={conv.id === activeConversationId ? colors.accent : colors.textFaint} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ ...typography.bodySm, color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.title}
                      </p>
                      <p style={{ ...typography.label, fontSize: '9px', color: colors.textFaint }}>
                        {new Date(conv.updatedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      style={{ padding: '4px', flexShrink: 0, opacity: 0.5 }}
                    >
                      <Trash2 size={12} color={colors.danger} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
          {/* History toggle */}
          <button
            onClick={() => setHistoryOpen(true)}
            style={{ padding: spacing[2] }}
            title="Gesprächsverlauf"
          >
            <Menu size={20} color={colors.textMuted} />
          </button>

          {/* Avatar + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
            <div
              style={{
                width: '36px', height: '36px', borderRadius: radius.full,
                background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.prColor} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: `0 0 12px ${colors.accent}40`,
              }}
            >
              <Bot size={20} color={colors.bgPrimary} />
            </div>
            <div>
              <div style={{ ...typography.h3, color: colors.textPrimary }}>Coach Arved</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: colors.success }} />
                <span style={{ ...typography.label, fontSize: '10px', color: colors.success }}>Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* New conversation */}
        <button
          onClick={startNewConversation}
          style={{ padding: spacing[2] }}
          title="Neues Gespräch"
        >
          <Plus size={20} color={colors.textMuted} />
        </button>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1, overflowY: 'auto',
          padding: `${spacing[4]} ${spacing[4]}`,
          display: 'flex', flexDirection: 'column', gap: spacing[3],
        }}
      >
        {/* Empty state */}
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              paddingTop: spacing[8], paddingBottom: spacing[4], gap: spacing[4],
            }}
          >
            <div
              style={{
                width: '72px', height: '72px', borderRadius: radius.full,
                background: `linear-gradient(135deg, ${colors.accent}22 0%, ${colors.prColor}22 100%)`,
                border: `1px solid ${colors.accent}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Sparkles size={32} color={colors.accent} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <h2 style={{ ...typography.h2, color: colors.textPrimary, marginBottom: spacing[2] }}>
                Coach Arved
              </h2>
              <p style={{ ...typography.body, color: colors.textMuted, maxWidth: '260px', lineHeight: '22px' }}>
                Dein persönlicher KI Trainer — direkt, kritisch, datenbasiert.
              </p>
            </div>

            {sessions.length > 0 && (
              <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap', justifyContent: 'center' }}>
                <StatPill icon={<Dumbbell size={12} color={colors.accent} />} label={`${sessions.length} Workouts`} />
                <StatPill icon={<TrendingUp size={12} color={colors.prColor} />} label={`${calculateStreak(sessions.map(s => s.date))} Tage Streak`} />
              </div>
            )}

            {/* Starter prompts */}
            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[2], marginTop: spacing[2] }}>
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
                    gap: spacing[2],
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.bgElevated; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.bgCard; }}
                >
                  {p.icon}
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
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: spacing[2], alignItems: 'flex-end' }}
            >
              {msg.role === 'assistant' && (
                <div
                  style={{
                    width: '28px', height: '28px', borderRadius: radius.full,
                    background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.prColor} 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                >
                  <Bot size={14} color={colors.bgPrimary} />
                </div>
              )}

              <div style={{ maxWidth: '85%', display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                <div
                  style={{
                    padding: `${spacing[3]} ${spacing[4]}`,
                    borderRadius: msg.role === 'user'
                      ? `${radius.xl} ${radius.xl} ${spacing[1]} ${radius.xl}`
                      : `${radius.xl} ${radius.xl} ${radius.xl} ${spacing[1]}`,
                    backgroundColor: msg.role === 'user' ? colors.accent : colors.bgCard,
                    border: msg.role === 'assistant' ? `1px solid ${colors.border}` : 'none',
                  }}
                >
                  {msg.role === 'user' ? (
                    <p style={{ ...typography.body, color: colors.bgPrimary, whiteSpace: 'pre-wrap', lineHeight: '22px', margin: 0 }}>
                      {msg.content}
                    </p>
                  ) : (
                    <div style={{ ...typography.body, color: colors.textPrimary, lineHeight: '24px', wordBreak: 'break-word' }}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ node, ...props }) => <p style={{ margin: '0 0 10px 0', lineHeight: '1.6' }} {...(props as any)} />,
                          ul: ({ node, ...props }) => <ul style={{ margin: '0 0 10px 0', paddingLeft: '20px' }} {...(props as any)} />,
                          ol: ({ node, ...props }) => <ol style={{ margin: '0 0 10px 0', paddingLeft: '20px' }} {...(props as any)} />,
                          li: ({ node, ...props }) => <li style={{ marginBottom: '4px' }} {...(props as any)} />,
                          h3: ({ node, ...props }) => <h3 style={{ ...typography.h3, marginTop: '14px', marginBottom: '8px', color: colors.textPrimary }} {...(props as any)} />,
                          h4: ({ node, ...props }) => <h4 style={{ fontWeight: 600, marginTop: '12px', marginBottom: '6px' }} {...(props as any)} />,
                          strong: ({ node, ...props }) => <strong style={{ color: colors.textPrimary }} {...(props as any)} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Plan save button — for completed assistant messages with plan content */}
                {msg.role === 'assistant' && (idx < messages.length - 1 || !isLoading) && detectTrainingPlan(msg.content) && !savedPlanIds.has(msg.id) && (
                  <button
                    onClick={() => saveAIPlan(msg.id, msg.content)}
                    disabled={savingPlan === msg.id}
                    style={{
                      alignSelf: 'flex-start',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2],
                      padding: `${spacing[2]} ${spacing[3]}`,
                      backgroundColor: colors.accentBg,
                      border: `1px solid ${colors.accent}40`,
                      borderRadius: radius.lg,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    <BookOpen size={13} color={colors.accent} />
                    <span style={{ ...typography.bodySm, color: colors.accent }}>
                      {savingPlan === msg.id ? 'Wird gespeichert…' : 'Plan in App speichern'}
                    </span>
                  </button>
                )}

                {msg.role === 'assistant' && savedPlanIds.has(msg.id) && (
                  <span style={{ ...typography.bodySm, color: colors.success, paddingLeft: spacing[1] }}>
                    ✓ Plan gespeichert
                  </span>
                )}
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
                width: '28px', height: '28px', borderRadius: radius.full,
                background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.prColor} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
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
                display: 'flex', gap: spacing[1], alignItems: 'center',
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: '6px', height: '6px', borderRadius: '50%',
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

      {/* Quick-reply chips */}
      {showQuickReplies && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], padding: `${spacing[2]} ${spacing[4]}`, flexShrink: 0 }}>
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              onClick={() => {
                setShowQuickReplies(false);
                void sendMessage(reply);
              }}
              style={{
                padding: `${spacing[2]} ${spacing[3]}`,
                borderRadius: radius.full,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.bgCard,
                color: colors.textSecondary,
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.bgElevated; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.bgCard; }}
            >
              {reply}
            </button>
          ))}
        </div>
      )}

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
              maxHeight: '120px',
              overflowY: 'auto',
            }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
          />

          {/* Mic button — click to start, click again to stop */}
          <button
            onClick={toggleListening}
            title={listening ? 'Aufnahme stoppen' : 'Spracheingabe starten'}
            style={{
              width: '36px', height: '36px', borderRadius: radius.full,
              backgroundColor: listening ? `${colors.danger}20` : 'transparent',
              border: listening ? `1px solid ${colors.danger}40` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
            }}
          >
            {listening
              ? <MicOff size={18} color={colors.danger} />
              : <Mic size={18} color={colors.textMuted} />
            }
          </button>

          {/* Send button */}
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            style={{
              width: '36px', height: '36px', borderRadius: radius.full,
              backgroundColor: input.trim() && !isLoading ? colors.accent : colors.bgElevated,
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: input.trim() && !isLoading ? 'pointer' : 'default',
              flexShrink: 0, transition: 'background-color 0.15s',
            }}
          >
            <Send size={16} color={input.trim() && !isLoading ? colors.bgPrimary : colors.textDisabled} />
          </button>
        </div>
        <p
          style={{
            ...typography.label, fontSize: '9px', color: colors.textFaint,
            textAlign: 'center', marginTop: spacing[2],
          }}
        >
          Coach Arved kann Fehler machen — wichtige Entscheidungen stets doppelt prüfen.
        </p>
      </div>

      {/* Animations */}
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
        display: 'flex', alignItems: 'center', gap: spacing[1],
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
