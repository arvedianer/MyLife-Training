import type { ExerciseEquipment } from '@/types/workout';
import type { Exercise } from '@/types/exercises';

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

/**
 * Given an exercise and a target equipment type, find the matching variation
 * from the exercise's equipmentVariations map. Returns null if no variation
 * exists or if the variation would be the same exercise.
 */
export function findEquipmentVariation(
  exercise: Exercise,
  targetEquipment: ExerciseEquipment,
  allExercises: Exercise[]
): Exercise | null {
  if (!exercise.equipmentVariations) return null;
  const variationId = exercise.equipmentVariations[targetEquipment];
  if (!variationId || variationId === exercise.id) return null;
  return allExercises.find((e) => e.id === variationId) ?? null;
}

export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Langhantel',
  dumbbell: 'Kurzhantel',
  cable: 'Kabelturm',
  machine: 'Maschine',
  bodyweight: 'Eigengewicht',
  other: 'Andere',
};
