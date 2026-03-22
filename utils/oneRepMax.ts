/**
 * Epley formula: 1RM = weight × (1 + reps/30)
 * Valid for reps 1–10. Above 10 reps accuracy degrades significantly.
 */
export function estimateOneRepMax(weight: number, reps: number): number | null {
  if (weight <= 0 || reps <= 0 || reps > 10) return null;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export function formatOneRepMax(weight: number, reps: number): string | null {
  const orm = estimateOneRepMax(weight, reps);
  if (orm === null) return null;
  return `≈${orm}kg`;
}
