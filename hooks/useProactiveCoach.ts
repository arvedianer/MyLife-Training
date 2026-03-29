'use client';

import { useEffect } from 'react';
import { useHistoryStore } from '@/store/historyStore';
import { usePlanStore } from '@/store/planStore';
import { useChatStore } from '@/store/chatStore';
import { differenceInDays, differenceInHours, format, parseISO, startOfWeek } from 'date-fns';

const STORAGE_KEY = 'proactive-coach-sent';

function getSentMessages(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function markSent(key: string): void {
  const sent = getSentMessages();
  sent[key] = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sent));
}

function wasRecentlySent(key: string, withinHours: number): boolean {
  const sent = getSentMessages();
  if (!sent[key]) return false;
  return differenceInHours(new Date(), new Date(sent[key])) < withinHours;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useProactiveCoach(): void {
  const { sessions } = useHistoryStore();
  const { getActiveSplit, getTodaysSplitDay } = usePlanStore();
  const { addMessage, newConversation, activeConversationId } = useChatStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const now = new Date();
    const activeSplit = getActiveSplit();
    const todaysDay = getTodaysSplitDay();
    const lastSession = sessions[0];

    // Resolve or create a conversation ID to post into
    const getConvId = (): string => {
      if (activeConversationId) return activeConversationId;
      return newConversation();
    };

    // Trigger 1: Pre-workout brief (training day scheduled for today)
    if (activeSplit && todaysDay && !wasRecentlySent('pre-workout', 18)) {
      const dayName = todaysDay.name;
      const exerciseCount = todaysDay.exerciseIds?.length ?? 0;
      const lastSimilarSession = sessions.find((s) => s.splitName === activeSplit.name);
      const prHint = lastSimilarSession
        ? ` Letztes Mal: ${Math.round((lastSimilarSession.totalVolume / 1000) * 10) / 10}t Volumen.`
        : '';

      const message = `Heute steht ${dayName} an — ${exerciseCount} Übungen.${prHint} Mach's.`;

      const convId = getConvId();
      addMessage(convId, {
        id: generateId(),
        role: 'assistant',
        content: message,
        timestamp: now.getTime(),
      });
      markSent('pre-workout');
    }

    // Trigger 2: Post-workout debrief (within 1 hour of finishing a session)
    if (lastSession && !wasRecentlySent(`post-${lastSession.id ?? lastSession.date}`, 23)) {
      const sessionDate = parseISO(lastSession.date);
      if (differenceInHours(now, sessionDate) < 1) {
        const vol = Math.round((lastSession.totalVolume / 1000) * 10) / 10;
        const prCount = lastSession.newPRs?.length ?? 0;
        const prText = prCount > 0 ? ` ${prCount} neue PR${prCount > 1 ? 's' : ''}! 🔥` : '';

        const message = `Gutes Training — ${vol}t Volumen.${prText} Erhol dich ordentlich.`;

        const convId = getConvId();
        addMessage(convId, {
          id: generateId(),
          role: 'assistant',
          content: message,
          timestamp: now.getTime(),
        });
        markSent(`post-${lastSession.id ?? lastSession.date}`);
      }
    }

    // Trigger 3: Weekly recap (Sunday evening, 17:00+)
    const isSunday = now.getDay() === 0;
    const isEvening = now.getHours() >= 17;
    const weekKey = `weekly-${format(now, 'yyyy-ww')}`;
    if (isSunday && isEvening && !wasRecentlySent(weekKey, 23)) {
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekSessions = sessions.filter((s) => parseISO(s.date) >= weekStart);
      const weekVol = weekSessions.reduce((sum, s) => sum + s.totalVolume, 0);

      const recap =
        weekSessions.length >= 4
          ? 'Starke Woche.'
          : weekSessions.length >= 2
            ? 'Solide.'
            : 'Nächste Woche mehr Gas geben.';

      const message = `Wochenabschluss: ${weekSessions.length} Einheiten, ${Math.round((weekVol / 1000) * 10) / 10}t Gesamtvolumen. ${recap}`;

      const convId = getConvId();
      addMessage(convId, {
        id: generateId(),
        role: 'assistant',
        content: message,
        timestamp: now.getTime(),
      });
      markSent(weekKey);
    }

    // Trigger 4: Inactivity nudge (2+ days without a session)
    if (lastSession && !wasRecentlySent('inactivity', 22)) {
      const daysSince = differenceInDays(now, parseISO(lastSession.date));
      if (daysSince >= 2) {
        const message = `${daysSince} Tage ohne Training. Alles ok? Selbst 30 Minuten zählen.`;

        const convId = getConvId();
        addMessage(convId, {
          id: generateId(),
          role: 'assistant',
          content: message,
          timestamp: now.getTime(),
        });
        markSent('inactivity');
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentionally runs once on mount
}
