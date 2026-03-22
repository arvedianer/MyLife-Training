import type { WorkoutSession } from '@/types/workout';
import { parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { estimateOneRepMax } from '@/utils/oneRepMax';

export interface DimensionScore {
  name: string;
  nameDE: string;
  score: number;   // 0–100
  detail: string;
}

export interface AthleteScoreResult {
  total: number;        // 0–1000, weighted composite
  dimensions: DimensionScore[];
}

// ── STÄRKE (30%) ─────────────────────────────────────────────────────────────
// Best 1RM per major exercise relative to bodyweight, normalized to 100
// Elite multipliers source: ExRx strength standards
const STRENGTH_BENCHMARKS: Record<string, { nameDE: string; elite: number }> = {
  'bench-press':    { nameDE: 'Bankdrücken',    elite: 1.5 },
  'squat':          { nameDE: 'Kniebeugen',     elite: 2.0 },
  'deadlift':       { nameDE: 'Kreuzheben',     elite: 2.5 },
  'overhead-press': { nameDE: 'Schulterdrücken', elite: 1.0 },
};

function scoreStrength(sessions: WorkoutSession[], bodyWeight: number): { score: number; detail: string } {
  if (bodyWeight <= 0 || sessions.length === 0) {
    return { score: 0, detail: 'Kein Körpergewicht hinterlegt.' };
  }

  const best1RM: Record<string, number> = {};
  for (const session of sessions) {
    for (const ex of session.exercises) {
      const id = ex.exercise?.id ?? '';
      if (!STRENGTH_BENCHMARKS[id]) continue;
      for (const set of ex.sets) {
        if (!set.isCompleted || !set.weight || !set.reps) continue;
        const orm = estimateOneRepMax(set.weight, set.reps);
        if (orm && orm > (best1RM[id] ?? 0)) best1RM[id] = orm;
      }
    }
  }

  const scores: number[] = [];
  let topExercise = '';
  let topRatio = 0;
  for (const [id, bench] of Object.entries(STRENGTH_BENCHMARKS)) {
    const orm = best1RM[id];
    if (!orm) continue;
    const ratio = orm / bodyWeight;
    const s = Math.min(100, Math.round((ratio / bench.elite) * 100));
    scores.push(s);
    if (ratio > topRatio) { topRatio = ratio; topExercise = bench.nameDE; }
  }

  if (scores.length === 0) {
    return { score: 0, detail: 'Noch keine Hauptübungen mit Gewicht aufgezeichnet.' };
  }

  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const detail = `Bestes relatives 1RM (${topExercise}): ${topRatio.toFixed(2)}× Körpergewicht.`;
  return { score: avg, detail };
}

// ── KONSISTENZ (25%) ──────────────────────────────────────────────────────────
// Training sessions in last 4 weeks vs. target of 3× per week = 12 sessions
function scoreConsistency(sessions: WorkoutSession[]): { score: number; detail: string } {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const recent = sessions.filter(s => parseISO(s.date) >= cutoff);
  const TARGET = 12;
  const pct = Math.min(100, Math.round((recent.length / TARGET) * 100));
  const detail = `${recent.length} Workouts in den letzten 4 Wochen (Ziel: ${TARGET}).`;
  return { score: pct, detail };
}

// ── VOLUMEN (20%) ─────────────────────────────────────────────────────────────
// Current week total volume vs. 40t cap (recreational lifter avg ~10–15t/week)
function scoreVolume(sessions: WorkoutSession[]): { score: number; detail: string } {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const thisWeek = sessions.filter(s => {
    const d = parseISO(s.date);
    return d >= weekStart && d <= weekEnd;
  });
  const weekVol = thisWeek.reduce((sum, s) => sum + s.totalVolume, 0);
  const VOLUME_CAP = 40_000; // kg (= 40 tonnes)
  const score = Math.min(100, Math.round((weekVol / VOLUME_CAP) * 100));
  const detail = `Wochenvolumen: ${(weekVol / 1000).toFixed(1)}t (Ziel für 100 Punkte: 40t).`;
  return { score, detail };
}

// ── AUSDAUER (15%) ───────────────────────────────────────────────────────────
// Average workout duration in last 4 weeks — 60 min avg = 100 score
function scoreEndurance(sessions: WorkoutSession[]): { score: number; detail: string } {
  if (sessions.length === 0) {
    return { score: 0, detail: 'Noch keine Workouts.' };
  }
  const now = new Date();
  const cutoff = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const recent = sessions.filter(s => parseISO(s.date) >= cutoff);
  if (recent.length === 0) {
    return { score: 0, detail: 'Keine Workouts in den letzten 4 Wochen.' };
  }
  const avgMinutes = recent.reduce((sum, s) => sum + s.durationSeconds, 0) / recent.length / 60;
  const TARGET_MINUTES = 60;
  const score = Math.min(100, Math.round((avgMinutes / TARGET_MINUTES) * 100));
  const detail = `Durchschnittliche Workout-Dauer: ${Math.round(avgMinutes)} min (60 min = 100 Punkte).`;
  return { score, detail };
}

// ── AUSGEWOGENHEIT (10%) ─────────────────────────────────────────────────────
// Push/Pull/Legs ratio in last 4 weeks — ideal 35/35/30 = 100 score
const PUSH_MUSCLES = new Set(['chest', 'shoulders', 'triceps']);
const PULL_MUSCLES = new Set(['back', 'biceps', 'forearms']);
const LEGS_MUSCLES = new Set(['legs', 'quads', 'hamstrings', 'glutes', 'calves']);

const IDEAL_PUSH = 0.35;
const IDEAL_PULL = 0.35;
const IDEAL_LEGS = 0.30;

function scoreBalance(sessions: WorkoutSession[]): { score: number; detail: string } {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const recent = sessions.filter(s => parseISO(s.date) >= cutoff);

  let push = 0, pull = 0, legs = 0;
  for (const s of recent) {
    for (const ex of s.exercises) {
      const pm = ex.exercise?.primaryMuscle as string | undefined;
      if (!pm) continue;
      const done = ex.sets.filter(st => st.isCompleted).length;
      if (PUSH_MUSCLES.has(pm)) push += done;
      else if (PULL_MUSCLES.has(pm)) pull += done;
      else if (LEGS_MUSCLES.has(pm)) legs += done;
    }
  }

  const total = push + pull + legs;
  if (total === 0) {
    return { score: 0, detail: 'Noch keine Daten für Ausgewogenheit.' };
  }

  const pushR = push / total;
  const pullR = pull / total;
  const legsR = legs / total;
  // Average absolute deviation from ideal ratios, normalized to score
  const deviation = (Math.abs(pushR - IDEAL_PUSH) + Math.abs(pullR - IDEAL_PULL) + Math.abs(legsR - IDEAL_LEGS)) / 2;
  const score = Math.max(0, Math.round((1 - deviation) * 100));
  const detail = `Push/Pull/Beine: ${Math.round(pushR * 100)}% / ${Math.round(pullR * 100)}% / ${Math.round(legsR * 100)}% (Ideal: 35/35/30).`;
  return { score, detail };
}

// ── COMPOSITE ────────────────────────────────────────────────────────────────
export function computeAthleteScore(
  sessions: WorkoutSession[],
  bodyWeight: number = 0,
): AthleteScoreResult {
  const strength    = scoreStrength(sessions, bodyWeight);
  const consistency = scoreConsistency(sessions);
  const volume      = scoreVolume(sessions);
  const endurance   = scoreEndurance(sessions);
  const balance     = scoreBalance(sessions);

  // Weights: Stärke 30%, Konsistenz 25%, Volumen 20%, Ausdauer 15%, Ausgewogenheit 10%
  const total = Math.round(
    strength.score    * 0.30 +
    consistency.score * 0.25 +
    volume.score      * 0.20 +
    endurance.score   * 0.15 +
    balance.score     * 0.10,
  ) * 10; // scale 0–100 → 0–1000

  return {
    total,
    dimensions: [
      { name: 'Strength',     nameDE: 'Stärke',         score: strength.score,    detail: strength.detail },
      { name: 'Consistency',  nameDE: 'Konsistenz',     score: consistency.score, detail: consistency.detail },
      { name: 'Volume',       nameDE: 'Volumen',        score: volume.score,      detail: volume.detail },
      { name: 'Endurance',    nameDE: 'Ausdauer',       score: endurance.score,   detail: endurance.detail },
      { name: 'Balance',      nameDE: 'Ausgewogenheit', score: balance.score,     detail: balance.detail },
    ],
  };
}

export function athleteScoreLabel(score: number): string {
  if (score <= 200) return 'Einsteiger';
  if (score <= 400) return 'Aufsteiger';
  if (score <= 600) return 'Fortgeschrittener';
  if (score <= 800) return 'Athlet';
  if (score <= 950) return 'Elite';
  return 'Legende';
}
