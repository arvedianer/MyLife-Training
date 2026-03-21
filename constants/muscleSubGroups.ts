import type { MuscleSubGroup } from '@/types/score';

export const muscleSubGroups: MuscleSubGroup[] = [
  // CHEST
  { muscle: 'chest', subGroup: 'upper', labelDE: 'Obere Brust', trainedBy: ['incline-barbell-press', 'incline-dumbbell-press', 'cable-fly-high'] },
  { muscle: 'chest', subGroup: 'middle', labelDE: 'Mittlere Brust', trainedBy: ['bench-press', 'dumbbell-press', 'pec-deck', 'seated-cable-fly'] },
  { muscle: 'chest', subGroup: 'lower', labelDE: 'Untere Brust', trainedBy: ['decline-press', 'dip', 'cable-fly-low'] },

  // BACK
  { muscle: 'back', subGroup: 'upper', labelDE: 'Oberer Rücken', trainedBy: ['row-barbell', 'row-dumbbell', 'face-pull'] },
  { muscle: 'back', subGroup: 'lats', labelDE: 'Lats (Breite)', trainedBy: ['lat-pulldown', 'pull-up', 'straight-arm-pulldown'] },
  { muscle: 'back', subGroup: 'lower', labelDE: 'Unterer Rücken', trainedBy: ['deadlift', 'hyperextension', 'good-morning'] },

  // SHOULDERS
  { muscle: 'shoulders', subGroup: 'anterior', labelDE: 'Vordere Schulter', trainedBy: ['overhead-press', 'front-raise', 'incline-barbell-press'] },
  { muscle: 'shoulders', subGroup: 'medial', labelDE: 'Seitliche Schulter', trainedBy: ['lateral-raise', 'cable-lateral-raise', 'upright-row'] },
  { muscle: 'shoulders', subGroup: 'posterior', labelDE: 'Hintere Schulter', trainedBy: ['face-pull', 'reverse-fly', 'row-barbell'] },

  // ARMS
  { muscle: 'triceps', subGroup: 'long-head', labelDE: 'Langer Kopf', trainedBy: ['overhead-tricep-extension', 'skull-crusher', 'cable-overhead-extension'] },
  { muscle: 'triceps', subGroup: 'lateral-head', labelDE: 'Lateraler Kopf', trainedBy: ['pushdown', 'dip', 'close-grip-bench'] },
  { muscle: 'biceps', subGroup: 'long-head', labelDE: 'Langer Kopf (Bizeps)', trainedBy: ['incline-curl', 'hammer-curl', 'barbell-curl'] },
  { muscle: 'biceps', subGroup: 'short-head', labelDE: 'Kurzer Kopf (Bizeps)', trainedBy: ['preacher-curl', 'concentration-curl', 'cable-curl'] },

  // LEGS
  { muscle: 'quads', subGroup: 'overall', labelDE: 'Quadrizeps', trainedBy: ['squat', 'leg-press', 'leg-extension', 'hack-squat'] },
  { muscle: 'hamstrings', subGroup: 'overall', labelDE: 'Hamstrings', trainedBy: ['romanian-deadlift', 'leg-curl', 'deadlift'] },
  { muscle: 'glutes', subGroup: 'overall', labelDE: 'Gesäß', trainedBy: ['squat', 'hip-thrust', 'deadlift', 'romanian-deadlift'] },
  { muscle: 'calves', subGroup: 'overall', labelDE: 'Waden', trainedBy: ['calf-raise', 'seated-calf-raise'] },

  // CORE
  { muscle: 'core', subGroup: 'overall', labelDE: 'Core', trainedBy: ['plank', 'ab-wheel', 'hanging-leg-raise', 'crunch'] },
];

export function getSubGroupsForMuscle(muscle: string): MuscleSubGroup[] {
  return muscleSubGroups.filter((sg) => sg.muscle === muscle);
}

export function getMissingSubGroups(trainedExerciseIds: string[], targetMuscles: string[]): MuscleSubGroup[] {
  const missing: MuscleSubGroup[] = [];
  for (const muscle of targetMuscles) {
    const subGroups = getSubGroupsForMuscle(muscle);
    for (const sg of subGroups) {
      const isTrained = sg.trainedBy.some((id) => trainedExerciseIds.includes(id));
      if (!isTrained) missing.push(sg);
    }
  }
  return missing;
}
