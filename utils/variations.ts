import type { ExerciseEquipment } from '@/types/workout';

export function buildVariationKey(
  exerciseId: string,
  equipment: ExerciseEquipment | string,
  gymId?: string
): string {
  return `${exerciseId}::${equipment}::${gymId ?? 'global'}`;
}

export function parseVariationKey(key: string): {
  exerciseId: string;
  equipment: string;
  gymId: string;
} {
  const [exerciseId, equipment, gymId] = key.split('::');
  return { exerciseId, equipment, gymId };
}

/** Normalize weight for cross-variation comparison (approximate) */
export function normalizeWeightForVariation(
  weight: number,
  equipment: string,
  isUnilateral: boolean
): number {
  if (isUnilateral) return weight * 2;
  if (equipment === 'cable') return weight * 0.9;
  return weight;
}

export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Langhantel',
  dumbbell: 'Kurzhantel',
  cable: 'Kabelturm',
  machine: 'Maschine',
  bodyweight: 'Eigengewicht',
  other: 'Andere',
};
