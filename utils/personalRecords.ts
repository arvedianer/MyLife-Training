import type { WorkoutSession } from '@/types/workout';
import { estimateOneRepMax } from '@/utils/oneRepMax';

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxWeight: number;
  maxReps: number;
  maxVolume: number;
  maxWeightDate: string;
  maxVolumeDate: string;
  bestOneRepMax: number | null;
  bestOneRepMaxDate: string | null;
}

export function computePersonalRecords(sessions: WorkoutSession[]): PersonalRecord[] {
  const map = new Map<string, PersonalRecord>();

  for (const session of sessions) {
    for (const ex of session.exercises) {
      const id = ex.exercise?.id ?? '';
      const name = ex.exercise?.nameDE ?? ex.exercise?.name ?? id;
      if (!id) continue;

      const completedSets = ex.sets.filter(s =>
        s.isCompleted || (s.weight > 0 && s.reps > 0)
      );
      if (completedSets.length === 0) continue;

      const sessionVolume = completedSets.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0);
      const maxWeightSet = completedSets.reduce((best, s) => (s.weight ?? 0) > (best.weight ?? 0) ? s : best, completedSets[0]);
      const maxRepsSet = completedSets.reduce((best, s) => (s.reps ?? 0) > (best.reps ?? 0) ? s : best, completedSets[0]);

      // Best estimated 1RM — Epley formula, valid only for reps 1–10
      const validSets = completedSets.filter(s =>
        (s.reps ?? 0) >= 1 && (s.reps ?? 0) <= 10 && (s.weight ?? 0) > 0
      );
      let sessionBest1RM: number | null = null;
      for (const s of validSets) {
        const orm = estimateOneRepMax(s.weight ?? 0, s.reps ?? 0);
        if (orm !== null && (sessionBest1RM === null || orm > sessionBest1RM)) {
          sessionBest1RM = orm;
        }
      }

      const existing = map.get(id);
      if (!existing) {
        map.set(id, {
          exerciseId: id,
          exerciseName: name,
          maxWeight: maxWeightSet.weight ?? 0,
          maxReps: maxRepsSet.reps ?? 0,
          maxVolume: sessionVolume,
          maxWeightDate: session.date,
          maxVolumeDate: session.date,
          bestOneRepMax: sessionBest1RM,
          bestOneRepMaxDate: sessionBest1RM !== null ? session.date : null,
        });
      } else {
        if ((maxWeightSet.weight ?? 0) > existing.maxWeight) {
          existing.maxWeight = maxWeightSet.weight ?? 0;
          existing.maxWeightDate = session.date;
        }
        if ((maxRepsSet.reps ?? 0) > existing.maxReps) {
          existing.maxReps = maxRepsSet.reps ?? 0;
        }
        if (sessionVolume > existing.maxVolume) {
          existing.maxVolume = sessionVolume;
          existing.maxVolumeDate = session.date;
        }
        if (sessionBest1RM !== null && (existing.bestOneRepMax === null || sessionBest1RM > existing.bestOneRepMax)) {
          existing.bestOneRepMax = sessionBest1RM;
          existing.bestOneRepMaxDate = session.date;
        }
      }
    }
  }

  return Array.from(map.values())
    .filter(r => r.maxWeight > 0)
    .sort((a, b) => b.maxVolume - a.maxVolume);
}
