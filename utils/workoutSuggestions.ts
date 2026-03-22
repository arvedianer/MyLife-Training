import { differenceInDays, parseISO } from 'date-fns';
import type { WorkoutSession } from '@/types/workout';
import { MUSCLE_LABELS_DE } from '@/utils/muscleCoverage';

export interface WorkoutSuggestion {
  message: string;
  priority: number;
}

export function generateSuggestions(sessions: WorkoutSession[], now: Date = new Date()): WorkoutSuggestion[] {
  const suggestions: WorkoutSuggestion[] = [];
  const MAJOR_MUSCLES = ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'legs'];

  const lastTrained = new Map<string, Date>();
  for (const session of sessions) {
    for (const ex of session.exercises) {
      const muscle = ex.exercise?.primaryMuscle ?? (ex as unknown as Record<string, unknown>).primaryMuscle as string | undefined;
      if (!muscle || muscle === 'cardio') continue;
      const date = parseISO(session.date);
      const existing = lastTrained.get(muscle);
      if (!existing || date > existing) lastTrained.set(muscle, date);
    }
  }

  for (const muscle of MAJOR_MUSCLES) {
    const last = lastTrained.get(muscle);
    if (!last) continue;
    const days = differenceInDays(now, last);
    if (days >= 5) {
      const label = (MUSCLE_LABELS_DE as Record<string, string>)[muscle] ?? muscle;
      suggestions.push({ message: `${label} seit ${days} Tagen nicht trainiert 💪`, priority: 1 });
    }
  }

  const lastSession = sessions[sessions.length - 1];
  if (lastSession) {
    const daysSince = differenceInDays(now, parseISO(lastSession.date));
    if (daysSince === 0) suggestions.push({ message: 'Heute trainiert — stark! 🔥', priority: 3 });
  }

  return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 2);
}
