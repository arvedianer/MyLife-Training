'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, Dumbbell, TrendingUp, Zap, Plus, Menu, Mic, MicOff, BookOpen, Trash2, X, Lock, LockOpen, BarChart2, Target, Download, Sparkles } from 'lucide-react';
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
import type { Components } from 'react-markdown';
import { usePathname } from 'next/navigation';
import type { TrainingSplit, SplitDay } from '@/types/splits';
import type { ChatMessage } from '@/store/chatStore';
import { useProactiveCoach } from '@/hooks/useProactiveCoach';

// Shape of exercises from /data/exercises.json (snake_case from DB)
interface DbExercise {
  id: string;
  name: string;
  name_de: string;
}

// SpeechRecognition browser API — not yet in stable lib.dom.d.ts
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}
interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
interface SpeechRecognitionConstructor {
  new(): ISpeechRecognition;
}

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

// Format timestamp as HH:MM
function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

const QUICK_REPLIES = [
  'Analysiere mein letztes Training',
  'Was trainiere ich heute?',
  'Bin ich auf dem richtigen Weg?',
  'Erkläre Progressive Overload',
];

const STARTER_PROMPTS = [
  { icon: TrendingUp, text: 'Analysiere mein letztes Workout' },
  { icon: Dumbbell, text: 'Was fehlt in meinem Training?' },
  { icon: Zap, text: 'Wie verbessere ich mein Bankdrücken?' },
  { icon: Sparkles, text: 'Was ist Hypertrophie genau?' },
];

// What Coach Arved can do — shown in empty state
const CAPABILITIES = [
  { Icon: BarChart2, text: 'Workouts analysieren & auswerten' },
  { Icon: Dumbbell, text: 'Trainingspläne erstellen (Arnold, PPL, Upper/Lower)' },
  { Icon: Target, text: 'Übungstechnik & Science-based Tipps' },
  { Icon: TrendingUp, text: 'Progressive Overload berechnen' },
  { Icon: Mic, text: 'Sprachsteuerung während dem Workout' },
  { Icon: Download, text: 'Pläne direkt in die App speichern' },
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

  // Proactive coach messages (pre-workout, post-workout, weekly recap, inactivity nudge)
  useProactiveCoach();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [savingPlan, setSavingPlan] = useState<string | null>(null); // msgId being saved
  const [savedPlanIds, setSavedPlanIds] = useState<Set<string>>(new Set());
  const [planToast, setPlanToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load persisted chat mode
  const [chatMode, setChatMode] = useState<'filtered' | 'unfiltered'>(() => {
    if (typeof window === 'undefined') return 'filtered';
    const stored = localStorage.getItem('chatMode');
    return stored === 'filtered' || stored === 'unfiltered' ? stored : 'filtered';
  });

  const toggleChatMode = () => {
    setChatMode((prev) => {
      const next = prev === 'filtered' ? 'unfiltered' : 'filtered';
      localStorage.setItem('chatMode', next);
      return next;
    });
  };

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
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

  // If switching to a conversation that already has messages, hide quick replies / entry points
  useEffect(() => {
    setHasStartedChat(messages.length > 0);
  }, [activeConversationId, messages.length]);

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

    // Personal records: exerciseName → best weight
    const rawPRs = useHistoryStore.getState().getPersonalRecords();
    const personalRecords: Record<string, number> = {};
    Object.entries(rawPRs).forEach(([exerciseId, pr]) => {
      const exercise = getExerciseById(exerciseId);
      if (exercise && pr.weight > 0) {
        personalRecords[exercise.nameDE] = pr.weight;
      }
    });

    return {
      name: profile?.name,
      goal: profile?.goal,
      level: profile?.level,
      equipment: profile?.equipment,
      weeklyVolume: Math.round(weeklyVolume),
      totalSessions: sessions.length,
      currentStreak: streak,
      // v2 additions:
      age: profile?.age,
      bodyWeight: profile?.bodyWeight,
      height: profile?.height,
      personalRecords,
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
    setHasStartedChat(true);

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
          mode: chatMode,
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
        setShowQuickReplies(true); // restore chips after error
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

    const win = window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
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

      recognition.onresult = (e: SpeechRecognitionEvent) => {
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

      recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
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

        let dbExercises: DbExercise[] = [];
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

  const markdownComponents: Components = {
    p: ({ children }) => <p style={{ margin: '0 0 10px 0', lineHeight: '1.6' }}>{children}</p>,
    ul: ({ children }) => <ul style={{ margin: '0 0 10px 0', paddingLeft: '20px' }}>{children}</ul>,
    ol: ({ children }) => <ol style={{ margin: '0 0 10px 0', paddingLeft: '20px' }}>{children}</ol>,
    li: ({ children }) => <li style={{ marginBottom: '4px' }}>{children}</li>,
    h1: ({ children }) => <h1 style={{ fontFamily: 'var(--font-barlow)', fontSize: '24px', fontWeight: 700, color: colors.textPrimary, margin: '16px 0 8px 0', lineHeight: 1.2 }}>{children}</h1>,
    h2: ({ children }) => <h2 style={{ fontFamily: 'var(--font-barlow)', fontSize: '20px', fontWeight: 700, color: colors.textPrimary, margin: '14px 0 6px 0', lineHeight: 1.2 }}>{children}</h2>,
    h3: ({ children }) => <h3 style={{ ...typography.h3, marginTop: '14px', marginBottom: '8px', color: colors.textPrimary }}>{children}</h3>,
    h4: ({ children }) => <h4 style={{ fontWeight: 600, marginTop: '12px', marginBottom: '6px' }}>{children}</h4>,
    strong: ({ children }) => <strong style={{ color: colors.textPrimary }}>{children}</strong>,
    code: ({ children, className }) => {
      const isBlock = className?.startsWith('language-');
      return isBlock ? (
        <code style={{
          display: 'block',
          background: colors.bgHighest,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.md,
          padding: `${spacing[3]} ${spacing[4]}`,
          fontSize: '12px',
          fontFamily: 'monospace',
          color: colors.accent,
          overflowX: 'auto',
          margin: '8px 0',
          whiteSpace: 'pre',
        }}>{children}</code>
      ) : (
        <code style={{
          background: colors.bgHighest,
          borderRadius: '4px',
          padding: '2px 6px',
          fontSize: '12px',
          fontFamily: 'monospace',
          color: colors.accent,
        }}>{children}</code>
      );
    },
    blockquote: ({ children }) => <blockquote style={{
      borderLeft: `3px solid ${colors.accent}`,
      marginLeft: 0,
      paddingLeft: spacing[4],
      color: colors.textMuted,
      fontStyle: 'italic',
      margin: '8px 0',
    }}>{children}</blockquote>,
    hr: () => <hr style={{ border: 'none', borderTop: `1px solid ${colors.border}`, margin: '12px 0' }} />,
    table: ({ children }) => <div style={{ overflowX: 'auto', margin: '8px 0' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>{children}</table></div>,
    thead: ({ children }) => <thead>{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr>{children}</tr>,
    th: ({ children }) => <th style={{ textAlign: 'left', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, color: colors.textMuted, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{children}</th>,
    td: ({ children }) => <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.borderLight}`, color: colors.textSecondary, verticalAlign: 'top' }}>{children}</td>,
  };

  const streak = calculateStreak(sessions.map((s) => s.date));

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

      {/* ─── Header ─────────────────────────────────────────────── */}
      <div
        data-tour="chat-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${spacing[3]} ${spacing[4]}`,
          paddingTop: `calc(${spacing[3]} + env(safe-area-inset-top))`,
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.bgSecondary,
          flexShrink: 0,
        }}
      >
        {/* Left: history icon */}
        <button
          onClick={() => setHistoryOpen(true)}
          title="Gesprächsverlauf"
          style={{
            width: '36px', height: '36px', borderRadius: radius.md,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
          }}
        >
          <Menu size={20} color={colors.textMuted} />
        </button>

        {/* Center: avatar + name + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
          {/* Coach avatar */}
          <div
            style={{
              width: '40px', height: '40px', borderRadius: radius.full,
              background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.prColor} 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: `0 0 0 2px ${colors.bgSecondary}, 0 0 0 3px ${colors.accent}50, 0 0 16px ${colors.accent}30`,
            }}
          >
            <span style={{ ...typography.label, fontWeight: 800, color: colors.bgPrimary, fontSize: '13px', letterSpacing: '-0.5px' }}>CA</span>
          </div>
          <div>
            <div style={{ ...typography.h3, color: colors.textPrimary, lineHeight: 1 }}>Coach Arved</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: colors.success, boxShadow: `0 0 6px ${colors.success}` }} />
              <span style={{ ...typography.label, fontSize: '10px', color: colors.success }}>Online</span>
            </div>
          </div>
        </div>

        {/* Right: mode toggle + new conversation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
          {/* Filtered/Unfiltered Mode Toggle */}
          <button
            onClick={toggleChatMode}
            title={chatMode === 'filtered' ? 'Filtered Mode — klick für Unfiltered' : 'Unfiltered Mode — klick für Filtered'}
            style={{
              display: 'flex', alignItems: 'center', gap: spacing[1],
              padding: `${spacing[1]} ${spacing[2]}`,
              backgroundColor: chatMode === 'unfiltered' ? `${colors.danger}20` : colors.bgHighest,
              border: `1px solid ${chatMode === 'unfiltered' ? `${colors.danger}60` : colors.border}`,
              borderRadius: radius.full,
              color: chatMode === 'unfiltered' ? colors.danger : colors.textMuted,
              ...typography.label, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {chatMode === 'filtered' ? <Lock size={12} /> : <LockOpen size={12} />}
          </button>

          {/* New conversation */}
          <button
            onClick={startNewConversation}
            title="Neues Gespräch"
            style={{
              width: '32px', height: '32px', borderRadius: radius.md,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: colors.bgHighest,
              border: `1px solid ${colors.border}`,
              cursor: 'pointer',
            }}
          >
            <Plus size={16} color={colors.textMuted} />
          </button>
        </div>
      </div>

      {/* ─── Messages area ─────────────────────────────────────── */}
      <div
        data-tour="chat-messages"
        style={{
          flex: 1, overflowY: 'auto',
          padding: `${spacing[4]} ${spacing[4]}`,
          display: 'flex', flexDirection: 'column', gap: spacing[3],
        }}
      >
        {/* ── Empty state ─────────────────────────────────────── */}
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              paddingTop: spacing[6], paddingBottom: spacing[4], gap: spacing[5],
            }}
          >
            {/* Avatar — large glowing */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Outer glow ring */}
              <div style={{
                position: 'absolute',
                width: '92px', height: '92px', borderRadius: radius.full,
                background: `radial-gradient(circle, ${colors.accent}20 0%, transparent 70%)`,
                animation: 'pulseRing 3s ease-in-out infinite',
              }} />
              <div
                style={{
                  width: '80px', height: '80px', borderRadius: radius.full,
                  background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.prColor} 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  boxShadow: `0 0 0 3px ${colors.bgPrimary}, 0 0 0 5px ${colors.accent}40, 0 8px 32px ${colors.accent}30`,
                  position: 'relative',
                }}
              >
                <span style={{ fontFamily: 'var(--font-barlow)', fontSize: '26px', fontWeight: 800, color: colors.bgPrimary, letterSpacing: '-1px' }}>CA</span>
              </div>
            </div>

            {/* Title + description */}
            <div style={{ textAlign: 'center', paddingLeft: spacing[4], paddingRight: spacing[4] }}>
              <h2 style={{ ...typography.h2, color: colors.textPrimary, marginBottom: spacing[2] }}>
                Coach Arved
              </h2>
              <p style={{ ...typography.body, color: colors.textMuted, maxWidth: '280px', lineHeight: '22px' }}>
                Stell mir alles — Trainingsplan, Ernährung, Form, Progressive Overload, Regeneration. Ich kenn deine Daten.
              </p>
            </div>

            {/* Stats pills — prominent with monospace numbers */}
            {sessions.length > 0 && (
              <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap', justifyContent: 'center' }}>
                <StatPill
                  icon={<Dumbbell size={13} color={colors.accent} />}
                  value={String(sessions.length)}
                  label="Workouts"
                />
                <StatPill
                  icon={<TrendingUp size={13} color={colors.prColor} />}
                  value={String(streak)}
                  label="Tage Streak"
                  valueColor={colors.prColor}
                />
              </div>
            )}

            {/* Starter prompts — horizontal scroll chips */}
            <div style={{
              width: '100%',
              display: 'flex',
              gap: spacing[2],
              overflowX: 'auto',
              paddingLeft: spacing[2],
              paddingRight: spacing[2],
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
            }}>
              {STARTER_PROMPTS.map((p) => {
                const IconComp = p.icon;
                return (
                  <button
                    key={p.text}
                    onClick={() => sendMessage(p.text)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2],
                      padding: `${spacing[2]} ${spacing[3]}`,
                      backgroundColor: colors.bgCard,
                      border: `1px solid ${colors.accent}30`,
                      borderRadius: radius.full,
                      cursor: 'pointer',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.bgElevated;
                      (e.currentTarget as HTMLButtonElement).style.borderColor = `${colors.accent}60`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.bgCard;
                      (e.currentTarget as HTMLButtonElement).style.borderColor = `${colors.accent}30`;
                    }}
                  >
                    <IconComp size={13} color={colors.accent} />
                    <span style={{ ...typography.bodySm, color: colors.textSecondary }}>
                      {p.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* "WAS ICH KANN" capabilities section */}
            <div style={{
              width: '100%',
              borderTop: `1px solid ${colors.border}`,
              paddingTop: spacing[4],
            }}>
              <p style={{ ...typography.label, color: colors.textFaint, marginBottom: spacing[3], letterSpacing: '0.08em' }}>
                WAS ICH KANN
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                {CAPABILITIES.map((item) => {
                  const IconComp = item.Icon;
                  return (
                    <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                      <IconComp size={15} color={colors.accent} style={{ flexShrink: 0 }} />
                      <span style={{ ...typography.bodySm, color: colors.textSecondary }}>{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Message list ─────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              {...(msg.role === 'assistant' && messages.filter(m => m.role === 'assistant').indexOf(msg) === 0 ? { 'data-tour': 'coach-response' } : {})}
              style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: spacing[2], alignItems: 'flex-end' }}
            >
              {/* AI avatar */}
              {msg.role === 'assistant' && (
                <div
                  style={{
                    width: '32px', height: '32px', borderRadius: radius.full,
                    background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.prColor} 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    boxShadow: `0 0 8px ${colors.accent}30`,
                  }}
                >
                  <span style={{ ...typography.label, fontWeight: 800, color: colors.bgPrimary, fontSize: '10px', letterSpacing: '-0.5px' }}>CA</span>
                </div>
              )}

              <div style={{ maxWidth: '85%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* Bubble */}
                <div
                  style={{
                    padding: `${spacing[3]} ${spacing[4]}`,
                    borderRadius: msg.role === 'user'
                      ? `${radius.xl} 4px ${radius.xl} ${radius.xl}`
                      : `4px ${radius.xl} ${radius.xl} ${radius.xl}`,
                    backgroundColor: msg.role === 'user' ? colors.accent : colors.bgCard,
                    borderLeft: msg.role === 'assistant' ? `2px solid ${colors.accent}50` : 'none',
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
                        components={markdownComponents}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <span style={{
                  ...typography.label,
                  fontSize: '10px',
                  color: colors.textFaint,
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  paddingLeft: msg.role === 'assistant' ? spacing[1] : 0,
                  paddingRight: msg.role === 'user' ? spacing[1] : 0,
                }}>
                  {formatTime(msg.timestamp)}
                </span>

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

        {/* ── Typing indicator ─────────────────────────────────── */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', gap: spacing[2], alignItems: 'flex-end' }}
          >
            <div
              style={{
                width: '32px', height: '32px', borderRadius: radius.full,
                background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.prColor} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: `0 0 8px ${colors.accent}30`,
              }}
            >
              <span style={{ ...typography.label, fontWeight: 800, color: colors.bgPrimary, fontSize: '10px', letterSpacing: '-0.5px' }}>CA</span>
            </div>
            <div
              style={{
                padding: `${spacing[3]} ${spacing[4]}`,
                backgroundColor: colors.bgCard,
                borderLeft: `2px solid ${colors.accent}50`,
                borderRadius: `4px ${radius.xl} ${radius.xl} ${radius.xl}`,
                display: 'flex', gap: spacing[2], alignItems: 'center',
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    backgroundColor: colors.accent,
                    opacity: 0.7,
                    animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
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

      {/* ─── Quick-reply chips ──────────────────────────────────── */}
      {!hasStartedChat && showQuickReplies && messages.length === 0 && (
        <div
          data-tour="coach-suggestions"
          style={{
            display: 'flex',
            gap: spacing[2],
            padding: `${spacing[2]} ${spacing[4]}`,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            flexShrink: 0,
          }}
        >
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              onClick={() => {
                setShowQuickReplies(false);
                void sendMessage(reply);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[1],
                padding: `${spacing[2]} ${spacing[3]}`,
                borderRadius: radius.full,
                border: `1px solid ${colors.accent}30`,
                backgroundColor: colors.bgCard,
                color: `${colors.accent}B0`,
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.bgElevated;
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${colors.accent}60`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.bgCard;
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${colors.accent}30`;
              }}
            >
              <Zap size={11} color={colors.accent} />
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* ─── Input area ─────────────────────────────────────────── */}
      <div
        data-tour="chat-input"
        style={{
          backgroundColor: colors.bgSecondary,
          borderTop: `1px solid ${colors.border}`,
          padding: `${spacing[3]} ${spacing[4]}`,
          paddingBottom: `calc(${spacing[3]} + env(safe-area-inset-bottom))`,
          flexShrink: 0,
        }}
      >
        {/* Voice listening indicator */}
        <AnimatePresence>
          {listening && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: spacing[2],
                marginBottom: spacing[2],
              }}
            >
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: colors.danger,
                animation: 'pulseRed 1s ease-in-out infinite',
                flexShrink: 0,
              }} />
              <span style={{ ...typography.label, fontSize: '11px', color: colors.danger }}>
                Aufnahme läuft — klick auf Mikrofon zum Stoppen
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input card */}
        <div
          style={{
            backgroundColor: colors.bgCard,
            borderRadius: radius.xl,
            border: `1px solid ${colors.border}`,
            overflow: 'hidden',
          }}
        >
          {/* Textarea */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Frag Coach Arved..."
            rows={1}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              outline: 'none',
              resize: 'none',
              ...typography.body,
              color: colors.textPrimary,
              lineHeight: '22px',
              maxHeight: '88px',
              overflowY: 'auto',
              padding: `${spacing[3]} ${spacing[4]}`,
              boxSizing: 'border-box',
            }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 88)}px`;
            }}
          />

          {/* Bottom row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: `${spacing[2]} ${spacing[3]}`,
            borderTop: `1px solid ${colors.border}`,
            gap: spacing[2],
          }}>
            {/* Mic button */}
            <button
              onClick={toggleListening}
              title={listening ? 'Aufnahme stoppen' : 'Spracheingabe starten'}
              style={{
                width: '32px', height: '32px', borderRadius: radius.full,
                backgroundColor: listening ? `${colors.danger}20` : 'transparent',
                border: listening ? `1px solid ${colors.danger}40` : '1px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
              }}
            >
              {listening
                ? <MicOff size={16} color={colors.danger} />
                : <Mic size={16} color={colors.textMuted} />
              }
            </button>

            {/* Spacer + character counter */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {input.length > 100 && (
                <span style={{ ...typography.label, fontSize: '10px', color: colors.textFaint }}>
                  {input.length}
                </span>
              )}
            </div>

            {/* Send button */}
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              style={{
                height: '32px',
                borderRadius: radius.full,
                backgroundColor: input.trim() && !isLoading ? colors.accent : colors.bgHighest,
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing[1],
                cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                flexShrink: 0, transition: 'all 0.2s',
                padding: input.trim() ? `0 ${spacing[3]}` : '0 10px',
              }}
            >
              <Send size={14} color={input.trim() && !isLoading ? colors.bgPrimary : colors.textDisabled} />
              {input.trim() && !isLoading && (
                <span style={{ ...typography.label, fontSize: '11px', color: colors.bgPrimary, fontWeight: 700 }}>
                  Senden
                </span>
              )}
            </button>
          </div>
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

      {/* ─── Animations ─────────────────────────────────────────── */}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.7; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes pulseRing {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.2; }
        }
        @keyframes pulseRed {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        [data-tour="chat-input"] textarea::placeholder {
          color: ${colors.textFaint};
        }
        div[style*="scrollbarWidth"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

function StatPill({ icon, value, label, valueColor }: { icon: React.ReactNode; value: string; label: string; valueColor?: string }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: spacing[2],
        padding: `${spacing[2]} ${spacing[3]}`,
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.full,
      }}
    >
      {icon}
      <span style={{
        fontFamily: 'monospace',
        fontSize: '13px',
        fontWeight: 700,
        color: valueColor ?? colors.accent,
        lineHeight: 1,
      }}>
        {value}
      </span>
      <span style={{ ...typography.label, fontSize: '11px', color: colors.textMuted }}>{label}</span>
    </div>
  );
}
