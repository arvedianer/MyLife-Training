import type { WorkoutSession } from '@/types/workout';
import type { WorkoutScore, WeakPoint } from '@/types/score';
import { getMissingSubGroups, getSubGroupsForMuscle } from '@/constants/muscleSubGroups';
import { getExerciseById } from '@/constants/exercises';

const OPTIMAL_DURATION_MIN = 40; // minutes
const OPTIMAL_DURATION_MAX = 75; // minutes

function epley1RM(weight: number, reps: number): number {
  if (reps <= 0) return weight;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Intensity Score based on Prilepin table zones.
 * Returns 0–100 based on how well % 1RM aligns with user's goal.
 */
function calcIntensityScore(
  currentSession: WorkoutSession,
  goal: string
): number {
  const targetIntensityRange = (
    {
      muskelaufbau: { min: 0.65, max: 0.85 },
      kraft: { min: 0.80, max: 0.95 },
      ausdauer: { min: 0.50, max: 0.70 },
      abnehmen: { min: 0.55, max: 0.75 },
      fitness: { min: 0.60, max: 0.80 },
    } as Record<string, { min: number; max: number }>
  )[goal] ?? { min: 0.65, max: 0.85 };

  let totalScore = 0;
  let setsWithData = 0;

  for (const ex of currentSession.exercises) {
    const completedSets = ex.sets.filter(
      (s) => s.isCompleted && s.weight > 0 && s.reps > 0
    );
    if (completedSets.length === 0) continue;

    const best1RM = Math.max(...completedSets.map((s) => epley1RM(s.weight, s.reps)));

    for (const set of completedSets) {
      if (best1RM <= 0) continue;
      const relativeIntensity = set.weight / best1RM;
      let setScore: number;
      if (
        relativeIntensity >= targetIntensityRange.min &&
        relativeIntensity <= targetIntensityRange.max
      ) {
        setScore = 100;
      } else if (relativeIntensity < targetIntensityRange.min) {
        setScore = clamp((relativeIntensity / targetIntensityRange.min) * 100, 0, 100);
      } else {
        setScore = clamp(
          100 - ((relativeIntensity - targetIntensityRange.max) / 0.1) * 20,
          60,
          100
        );
      }
      totalScore += setScore;
      setsWithData++;
    }
  }

  return setsWithData > 0 ? Math.round(totalScore / setsWithData) : 70;
}

/** Volume score based on session sets per muscle */
function calcVolumeScore(currentSession: WorkoutSession): number {
  const muscleSetCounts: Record<string, number> = {};

  for (const ex of currentSession.exercises) {
    const exercise = getExerciseById(ex.exercise.id);
    if (!exercise) continue;
    const workedSets = ex.sets.filter(
      (s) => s.isCompleted && s.type !== 'warmup'
    ).length;
    const muscle = exercise.primaryMuscle;
    muscleSetCounts[muscle] = (muscleSetCounts[muscle] ?? 0) + workedSets;
  }

  const muscles = Object.keys(muscleSetCounts);
  if (muscles.length === 0) return 50;

  const scores = muscles.map((m) => {
    const sets = muscleSetCounts[m] ?? 0;
    if (sets === 0) return 0;
    if (sets >= 3 && sets <= 7) return 100;
    if (sets < 3) return clamp((sets / 3) * 100, 20, 100);
    return clamp(100 - (sets - 7) * 8, 60, 100);
  });

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/** Coverage score based on planned vs. trained muscle sub-groups */
function calcCoverageScore(
  currentSession: WorkoutSession,
  plannedMuscles: string[]
): { score: number; weakPoints: WeakPoint[] } {
  const trainedExerciseIds = currentSession.exercises
    .filter((e) => e.sets.some((s) => s.isCompleted))
    .map((e) => e.exercise.id);

  if (plannedMuscles.length === 0) {
    const musclesCovered = new Set(
      currentSession.exercises.map((e) => e.exercise.primaryMuscle)
    ).size;
    return { score: Math.min(musclesCovered * 25, 100), weakPoints: [] };
  }

  const missing = getMissingSubGroups(trainedExerciseIds, plannedMuscles);
  const totalSubGroups = plannedMuscles.reduce((sum, m) => {
    return sum + (getSubGroupsForMuscle(m).length || 1);
  }, 0);

  const score =
    totalSubGroups > 0
      ? Math.round(((totalSubGroups - missing.length) / totalSubGroups) * 100)
      : 80;

  const weakPoints: WeakPoint[] = missing.slice(0, 3).map((sg) => ({
    muscle: sg.muscle,
    subMuscle: sg.labelDE,
    message: `${sg.labelDE} nicht trainiert`,
    suggestedExercise: sg.trainedBy[0],
  }));

  return { score, weakPoints };
}

/** Duration score — optimal 40–75 min */
function calcDurationScore(durationSeconds: number): number {
  const minutes = durationSeconds / 60;
  if (minutes >= OPTIMAL_DURATION_MIN && minutes <= OPTIMAL_DURATION_MAX) return 100;
  if (minutes < OPTIMAL_DURATION_MIN) {
    return clamp(Math.round((minutes / OPTIMAL_DURATION_MIN) * 100), 20, 100);
  }
  return clamp(Math.round(100 - ((minutes - OPTIMAL_DURATION_MAX) / 30) * 40), 40, 100);
}

/** RPE score — optimal RPE 7–8.5 */
function calcRPEScore(rpe: number | undefined): number | null {
  if (rpe === undefined || rpe === null) return null;
  if (rpe >= 7 && rpe <= 8.5) return 100;
  if (rpe < 7) return clamp(Math.round((rpe / 7) * 100), 20, 100);
  return clamp(Math.round(100 - ((rpe - 8.5) / 1.5) * 60), 20, 100);
}

/** Generate deterministic coaching tips */
function generateTips(
  session: WorkoutSession,
  volumeScore: number,
  intensityScore: number,
  coverageScore: number,
  durationScore: number,
  weakPoints: WeakPoint[]
): string[] {
  const tips: string[] = [];

  if (volumeScore < 70) tips.push('Volumen erhöhen: versuche 1–2 Sätze mehr pro Muskelgruppe');
  if (intensityScore < 65) tips.push('Gewicht leicht erhöhen für bessere Intensität');
  if (coverageScore < 70 && weakPoints.length > 0) {
    tips.push(
      `${weakPoints[0].subMuscle ?? weakPoints[0].muscle} zu wenig trainiert — ${
        weakPoints[0].suggestedExercise ?? 'geeignete Übung hinzufügen'
      }`
    );
  }
  if (durationScore < 60) {
    const minutes = session.durationSeconds / 60;
    if (minutes > OPTIMAL_DURATION_MAX) {
      tips.push('Training war zu lang — fokussierter trainieren, kürzere Pausen');
    } else {
      tips.push('Training war sehr kurz — Volumen erhöhen für bessere Adaption');
    }
  }

  for (const ex of session.exercises) {
    const completed = ex.sets.filter((s) => s.isCompleted);
    if (completed.length === 0) continue;
    const exercise = getExerciseById(ex.exercise.id);
    if (!exercise?.repRange) continue;
    const allHitMax = completed.every((s) => s.reps >= exercise.repRange!.max);
    if (allHitMax) {
      tips.push(`${exercise.nameDE}: obere Grenze erreicht → +2.5kg beim nächsten Mal`);
    }
  }

  return tips.slice(0, 5);
}

/** Main score calculation function — deterministic, no API calls */
export function calculateWorkoutScore(
  session: WorkoutSession,
  goal: string,
  plannedMuscles: string[],
  previousSessions: WorkoutSession[]
): WorkoutScore {
  const volumeScore = calcVolumeScore(session);
  const intensityScore = calcIntensityScore(session, goal);
  const { score: coverageScore, weakPoints } = calcCoverageScore(session, plannedMuscles);
  const durationScore = calcDurationScore(session.durationSeconds);
  const rpeScore = calcRPEScore(session.rpe);

  // Weighted total — when RPE absent, redistribute its 5% proportionally
  const hasRPE = rpeScore !== null;
  const total = hasRPE
    ? Math.round(
        volumeScore * 0.35 +
          intensityScore * 0.25 +
          coverageScore * 0.25 +
          durationScore * 0.1 +
          rpeScore! * 0.05
      )
    : Math.round(
        volumeScore * 0.368 +
          intensityScore * 0.263 +
          coverageScore * 0.263 +
          durationScore * 0.105
      );

  const allScores = previousSessions
    .filter((s) => s.score?.total !== undefined)
    .map((s) => s.score!.total);
  const betterThan =
    allScores.length > 0
      ? Math.round((allScores.filter((s) => s < total).length / allScores.length) * 100)
      : 50;

  const tips = generateTips(
    session,
    volumeScore,
    intensityScore,
    coverageScore,
    durationScore,
    weakPoints
  );

  return {
    total: clamp(total, 0, 100),
    volumeScore,
    intensityScore,
    coverageScore,
    durationScore,
    rpeScore,
    percentileBetter: betterThan,
    weakPoints,
    tips,
  };
}
