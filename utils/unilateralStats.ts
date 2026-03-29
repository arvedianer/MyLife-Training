import type { WorkoutSession } from '@/types/workout';

export interface SideStats {
  exerciseId: string;
  exerciseName: string;
  dominantSide: 'left' | 'right' | 'balanced';
  leftAvgReps: number;
  rightAvgReps: number;
  imbalancePercent: number; // 0 = balanced, 15 = 15% stronger on one side
}

/**
 * Compute left/right imbalance for each unilateral exercise across sessions.
 * Returns only exercises that have at least 3 unilateral sets recorded.
 */
export function computeSideStats(sessions: WorkoutSession[]): SideStats[] {
  const exerciseData = new Map<string, {
    name: string;
    leftReps: number[];
    rightReps: number[];
  }>();

  for (const session of sessions) {
    for (const ex of session.exercises) {
      if (!ex.isUnilateral) continue;
      const id = ex.exercise?.id ?? '';
      const name = ex.exercise?.nameDE ?? ex.exercise?.name ?? id;
      if (!id) continue;

      if (!exerciseData.has(id)) {
        exerciseData.set(id, { name, leftReps: [], rightReps: [] });
      }
      const data = exerciseData.get(id)!;

      for (const set of ex.sets) {
        if (!set.isCompleted) continue;
        if (set.repsL != null && set.repsL > 0) data.leftReps.push(set.repsL);
        if (set.repsR != null && set.repsR > 0) data.rightReps.push(set.repsR);
      }
    }
  }

  const results: SideStats[] = [];

  for (const [exerciseId, data] of exerciseData) {
    if (data.leftReps.length < 3 || data.rightReps.length < 3) continue;

    const leftAvg = data.leftReps.reduce((a, b) => a + b, 0) / data.leftReps.length;
    const rightAvg = data.rightReps.reduce((a, b) => a + b, 0) / data.rightReps.length;
    const maxAvg = Math.max(leftAvg, rightAvg);
    const imbalance = maxAvg > 0 ? Math.round(Math.abs(leftAvg - rightAvg) / maxAvg * 100) : 0;

    let dominantSide: 'left' | 'right' | 'balanced';
    if (imbalance < 5) dominantSide = 'balanced';
    else if (leftAvg > rightAvg) dominantSide = 'left';
    else dominantSide = 'right';

    results.push({
      exerciseId,
      exerciseName: data.name,
      dominantSide,
      leftAvgReps: Math.round(leftAvg * 10) / 10,
      rightAvgReps: Math.round(rightAvg * 10) / 10,
      imbalancePercent: imbalance,
    });
  }

  return results.sort((a, b) => b.imbalancePercent - a.imbalancePercent);
}

/**
 * Get the side imbalance hint for a single completed set.
 * Returns a short string like "R schwächer (−17%)" or null if balanced.
 */
export function getSideImbalanceHint(repsL: number, repsR: number): string | null {
  if (repsL <= 0 || repsR <= 0) return null;
  const max = Math.max(repsL, repsR);
  const imbalance = Math.round(Math.abs(repsL - repsR) / max * 100);
  if (imbalance < 5) return null;
  const weakerSide = repsL < repsR ? 'L' : 'R';
  return `${weakerSide} schwächer (−${imbalance}%)`;
}
