import type { TrainingSplit } from '@/types/splits';
import type { Exercise } from '@/types/exercises';
import { getExerciseById } from '@/constants/exercises';

export interface SplitAnalysis {
  score: number;           // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  musclesCovered: string[];
  musclesMissing: string[];
  compoundRatio: number;   // 0-1
  restDayCount: number;
  trainingDayCount: number;
  issues: string[];
  strengths: string[];
}

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Brust',
  back: 'Rücken',
  shoulders: 'Schultern',
  biceps: 'Bizeps',
  triceps: 'Trizeps',
  legs: 'Beine',
  glutes: 'Gesäß',
  core: 'Core',
  calves: 'Waden',
  forearms: 'Unterarme',
};

const PRIMARY_MUSCLES = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs'];

export function analyzeSplit(split: TrainingSplit): SplitAnalysis {
  const trainingDays = split.days.filter(d => !d.restDay);
  const restDayCount = split.days.filter(d => d.restDay).length;
  const trainingDayCount = trainingDays.length;

  // Collect all exercises
  const allExercises: Exercise[] = [];
  for (const day of trainingDays) {
    for (const exId of day.exerciseIds) {
      const ex = getExerciseById(exId);
      if (ex) allExercises.push(ex);
    }
  }

  // --- Muscle coverage (30 pts) ---
  const coveredMuscles = new Set<string>();
  for (const ex of allExercises) {
    coveredMuscles.add(ex.primaryMuscle);
    for (const sec of ex.secondaryMuscles) coveredMuscles.add(sec);
  }
  const musclesCovered = PRIMARY_MUSCLES.filter(m => coveredMuscles.has(m));
  const musclesMissing = PRIMARY_MUSCLES.filter(m => !coveredMuscles.has(m));
  const muscleScore = Math.round((musclesCovered.length / PRIMARY_MUSCLES.length) * 30);

  // --- Compound ratio (25 pts) — optimal 50–75% compound ---
  const compoundCount = allExercises.filter(e => e.category === 'compound').length;
  const compoundRatio = allExercises.length > 0 ? compoundCount / allExercises.length : 0;
  let compoundScore = 0;
  if (compoundRatio >= 0.5 && compoundRatio <= 0.75) compoundScore = 25;
  else if (compoundRatio > 0.75 && compoundRatio <= 0.9) compoundScore = 18;
  else if (compoundRatio >= 0.35 && compoundRatio < 0.5) compoundScore = 15;
  else if (compoundRatio > 0) compoundScore = 10;

  // --- Rest days (20 pts) ---
  let restScore = 0;
  if (restDayCount >= 1 && restDayCount <= 2) restScore = 20;
  else if (restDayCount === 3) restScore = 15;
  else if (restDayCount === 0) restScore = 5;
  else restScore = 10;

  // --- Volume per day (25 pts) — optimal 4–8 exercises ---
  const dayExerciseCounts = trainingDays.map(d => d.exerciseIds.length);
  const avgExercises = dayExerciseCounts.length > 0
    ? dayExerciseCounts.reduce((a, b) => a + b, 0) / dayExerciseCounts.length
    : 0;
  let volumeScore = 0;
  if (avgExercises >= 4 && avgExercises <= 8) volumeScore = 25;
  else if (avgExercises >= 3 && avgExercises < 4) volumeScore = 18;
  else if (avgExercises > 8 && avgExercises <= 10) volumeScore = 18;
  else if (avgExercises > 0) volumeScore = 10;

  const score = Math.min(100, muscleScore + compoundScore + restScore + volumeScore);

  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 55) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  const issues: string[] = [];
  const strengths: string[] = [];

  if (musclesMissing.length > 0) {
    issues.push(`Fehlende Muskelgruppen: ${musclesMissing.map(m => MUSCLE_LABELS[m]).join(', ')}`);
  }
  if (compoundRatio < 0.35) {
    issues.push('Zu wenig Grundübungen — mehr Compound-Übungen einplanen');
  }
  if (compoundRatio > 0.9 && allExercises.length > 0) {
    issues.push('Kaum Isolationsübungen — ergänze gezielte Isolationsarbeit');
  }
  if (restDayCount === 0) {
    issues.push('Kein Ruhetag geplant — mindestens 1 Ruhetag empfohlen');
  }
  if (avgExercises > 8) {
    issues.push('Zu viele Übungen pro Tag — max. 8 für optimale Intensität');
  }
  if (avgExercises < 4 && trainingDayCount > 0) {
    issues.push('Wenig Übungen pro Einheit — mind. 4 für vollständige Einheit');
  }

  if (musclesCovered.length >= 5) {
    strengths.push('Gute Muskelgruppen-Abdeckung');
  }
  if (compoundRatio >= 0.5 && compoundRatio <= 0.75) {
    strengths.push('Optimale Compound/Isolation-Balance');
  }
  if (restDayCount >= 1) {
    strengths.push('Ruhetage eingeplant');
  }
  if (avgExercises >= 4 && avgExercises <= 7) {
    strengths.push('Gutes Volumen pro Einheit');
  }

  return {
    score,
    grade,
    musclesCovered: musclesCovered.map(m => MUSCLE_LABELS[m] ?? m),
    musclesMissing: musclesMissing.map(m => MUSCLE_LABELS[m] ?? m),
    compoundRatio,
    restDayCount,
    trainingDayCount,
    issues,
    strengths,
  };
}
