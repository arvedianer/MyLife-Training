import type { TrainingSplit } from '@/types/splits';

export const predefinedSplits: TrainingSplit[] = [
  {
    id: 'ppl-3',
    name: 'Push Pull Legs',
    type: 'ppl',
    description: 'Klassischer Push/Pull/Legs Split. Ideal für Fortgeschrittene mit 6 Trainingstagen.',
    daysPerWeek: 6,
    difficulty: 'intermediate',
    isActive: false,
    createdAt: 0,
    days: [
      {
        id: 'ppl-push',
        name: 'Push',
        muscleGroups: ['chest', 'shoulders', 'triceps'],
        exerciseIds: ['bench-press', 'overhead-press', 'incline-bench-press', 'lateral-raise', 'tricep-pushdown'],
        restDay: false,
      },
      {
        id: 'ppl-pull',
        name: 'Pull',
        muscleGroups: ['back', 'biceps'],
        exerciseIds: ['deadlift', 'pull-up', 'barbell-row', 'barbell-curl', 'face-pull'],
        restDay: false,
      },
      {
        id: 'ppl-legs',
        name: 'Legs',
        muscleGroups: ['legs', 'glutes', 'calves'],
        exerciseIds: ['squat', 'leg-press', 'romanian-deadlift', 'leg-curl', 'calf-raise'],
        restDay: false,
      },
    ],
  },
  {
    id: 'arnold',
    name: 'Arnold Split',
    type: 'arnold',
    description: 'Der legendäre Split von Arnold Schwarzenegger. Brust/Rücken + Schultern/Arme + Beine.',
    daysPerWeek: 6,
    difficulty: 'advanced',
    isActive: false,
    createdAt: 0,
    days: [
      {
        id: 'arnold-chest-back',
        name: 'Brust & Rücken',
        muscleGroups: ['chest', 'back'],
        exerciseIds: ['bench-press', 'barbell-row', 'incline-bench-press', 'pull-up', 'cable-fly'],
        restDay: false,
      },
      {
        id: 'arnold-shoulders-arms',
        name: 'Schultern & Arme',
        muscleGroups: ['shoulders', 'biceps', 'triceps'],
        exerciseIds: ['overhead-press', 'barbell-curl', 'tricep-pushdown', 'lateral-raise', 'hammer-curl'],
        restDay: false,
      },
      {
        id: 'arnold-legs',
        name: 'Beine',
        muscleGroups: ['legs', 'glutes', 'calves'],
        exerciseIds: ['squat', 'leg-press', 'romanian-deadlift', 'hip-thrust', 'calf-raise'],
        restDay: false,
      },
    ],
  },
  {
    id: 'upper-lower',
    name: 'Upper / Lower',
    type: 'upper-lower',
    description: 'Oberkörper und Unterkörper abwechselnd. Perfekt für 4 Trainingstage.',
    daysPerWeek: 4,
    difficulty: 'beginner',
    isActive: false,
    createdAt: 0,
    days: [
      {
        id: 'ul-upper',
        name: 'Oberkörper',
        muscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
        exerciseIds: ['bench-press', 'barbell-row', 'overhead-press', 'barbell-curl', 'tricep-pushdown'],
        restDay: false,
      },
      {
        id: 'ul-lower',
        name: 'Unterkörper',
        muscleGroups: ['legs', 'glutes', 'calves', 'core'],
        exerciseIds: ['squat', 'romanian-deadlift', 'leg-press', 'leg-curl', 'calf-raise'],
        restDay: false,
      },
    ],
  },
  {
    id: 'full-body-3',
    name: 'Full Body 3x',
    type: 'full-body',
    description: 'Ganzkörpertraining 3x pro Woche. Ideal für Einsteiger und bei wenig Zeit.',
    daysPerWeek: 3,
    difficulty: 'beginner',
    isActive: false,
    createdAt: 0,
    days: [
      {
        id: 'fb-day',
        name: 'Ganzkörper',
        muscleGroups: ['chest', 'back', 'legs', 'shoulders', 'core'],
        exerciseIds: ['squat', 'bench-press', 'barbell-row', 'overhead-press', 'deadlift'],
        restDay: false,
      },
    ],
  },
  {
    id: 'bro-split-5',
    name: 'Bro Split 5x',
    type: 'bro-split',
    description: 'Klassischer Bodybuilder-Split. Jede Muskelgruppe einmal pro Woche, maximaler Fokus.',
    daysPerWeek: 5,
    difficulty: 'intermediate',
    isActive: false,
    createdAt: 0,
    days: [
      {
        id: 'bro-chest',
        name: 'Brust',
        muscleGroups: ['chest', 'triceps'],
        exerciseIds: ['bench-press', 'incline-bench-press', 'dumbbell-fly', 'cable-fly', 'dips'],
        restDay: false,
      },
      {
        id: 'bro-back',
        name: 'Rücken',
        muscleGroups: ['back', 'biceps'],
        exerciseIds: ['deadlift', 'pull-up', 'barbell-row', 'lat-pulldown', 'seated-cable-row'],
        restDay: false,
      },
      {
        id: 'bro-shoulders',
        name: 'Schultern',
        muscleGroups: ['shoulders'],
        exerciseIds: ['overhead-press', 'lateral-raise', 'front-raise', 'rear-delt-fly', 'face-pull'],
        restDay: false,
      },
      {
        id: 'bro-arms',
        name: 'Arme',
        muscleGroups: ['biceps', 'triceps'],
        exerciseIds: ['barbell-curl', 'hammer-curl', 'incline-curl', 'tricep-pushdown', 'skull-crusher'],
        restDay: false,
      },
      {
        id: 'bro-legs',
        name: 'Beine',
        muscleGroups: ['legs', 'glutes', 'calves'],
        exerciseIds: ['squat', 'leg-press', 'romanian-deadlift', 'leg-curl', 'calf-raise'],
        restDay: false,
      },
    ],
  },
  {
    id: 'phul',
    name: 'PHUL (Power & Hypertrophie)',
    type: 'phul',
    description: 'Power Hypertrophy Upper Lower — 4 Tage Kraft + Muskelmasse kombiniert.',
    daysPerWeek: 4,
    difficulty: 'intermediate',
    isActive: false,
    createdAt: 0,
    days: [
      {
        id: 'phul-power-upper',
        name: 'Kraft Oberkörper',
        muscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
        exerciseIds: ['bench-press', 'barbell-row', 'overhead-press', 'barbell-curl', 'close-grip-bench'],
        restDay: false,
      },
      {
        id: 'phul-power-lower',
        name: 'Kraft Unterkörper',
        muscleGroups: ['legs', 'glutes'],
        exerciseIds: ['squat', 'deadlift', 'romanian-deadlift', 'leg-curl', 'calf-raise'],
        restDay: false,
      },
      {
        id: 'phul-hyper-upper',
        name: 'Hypertrophie Oberkörper',
        muscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
        exerciseIds: ['incline-bench-press', 'dumbbell-row', 'dumbbell-shoulder-press', 'cable-fly', 'tricep-pushdown', 'dumbbell-curl', 'lateral-raise'],
        restDay: false,
      },
      {
        id: 'phul-hyper-lower',
        name: 'Hypertrophie Unterkörper',
        muscleGroups: ['legs', 'glutes', 'calves'],
        exerciseIds: ['hack-squat', 'leg-press', 'bulgarian-split-squat', 'leg-extension', 'leg-curl', 'hip-thrust', 'calf-raise'],
        restDay: false,
      },
    ],
  },
];

// Generiert einen Split basierend auf Benutzerpräferenzen
export function generateSplitForUser(
  daysPerWeek: number,
  level: string
): TrainingSplit {
  if (daysPerWeek <= 3) {
    return { ...predefinedSplits[3], id: `custom-${Date.now()}`, isActive: true, createdAt: Date.now() };
  } else if (daysPerWeek === 4) {
    return { ...predefinedSplits[2], id: `custom-${Date.now()}`, isActive: true, createdAt: Date.now() };
  } else if (level === 'anfaenger' || level === 'fortgeschritten') {
    return { ...predefinedSplits[2], id: `custom-${Date.now()}`, daysPerWeek, isActive: true, createdAt: Date.now() };
  } else {
    return { ...predefinedSplits[0], id: `custom-${Date.now()}`, isActive: true, createdAt: Date.now() };
  }
}
