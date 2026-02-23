import type { TrainingSplit } from '@/types/splits';

export const predefinedSplits: TrainingSplit[] = [
  // ─── 0: PPL ────────────────────────────────────────────────────────────────
  {
    id: 'ppl-3',
    name: 'Push Pull Legs',
    type: 'ppl',
    description: 'Klassischer Push/Pull/Legs Split. Ideal für Fortgeschrittene mit 6 Trainingstagen.',
    scienceNote: 'Jede Muskelgruppe wird 2× pro Woche trainiert — laut Metaanalysen optimale Frequenz für Natural-Bodybuilder. Hohe wöchentliche Volumen bei ausreichend Erholung zwischen gleichartigen Tagen.',
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
        repScheme: 'hypertrophy',
        scienceNote: 'Drückende Muskelgruppen in einer Session — maximale Synergien zwischen Brust, Schulter und Trizeps.',
      },
      {
        id: 'ppl-pull',
        name: 'Pull',
        muscleGroups: ['back', 'biceps'],
        exerciseIds: ['deadlift', 'pull-up', 'barbell-row', 'barbell-curl', 'face-pull'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Ziehende Muskelgruppen gemeinsam trainiert. Deadlift als Anker-Übung für maximale hintere Kette.',
      },
      {
        id: 'ppl-legs',
        name: 'Legs',
        muscleGroups: ['legs', 'glutes', 'calves'],
        exerciseIds: ['squat', 'leg-press', 'romanian-deadlift', 'leg-curl', 'calf-raise'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Dedizierter Beintag erlaubt maximales Volumen für Quadrizeps, Hamstrings und Gesäß ohne Energieabzug durch Oberkörperübungen.',
      },
    ],
  },
  // ─── 1: Arnold ─────────────────────────────────────────────────────────────
  {
    id: 'arnold',
    name: 'Arnold Split',
    type: 'arnold',
    description: 'Der legendäre Split von Arnold Schwarzenegger. Brust/Rücken + Schultern/Arme + Beine.',
    scienceNote: 'Antagonisten (Brust & Rücken) werden zusammen trainiert — Ruhephasen eines Muskels dienen als aktive Pause des anderen. Ermöglicht hohes Volumen in kurzer Zeit.',
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
        repScheme: 'hypertrophy',
        scienceNote: 'Antagonisten-Supersets möglich: Bankdrücken + Rudern erhöhen Durchblutung beider Muskelgruppen gleichzeitig.',
      },
      {
        id: 'arnold-shoulders-arms',
        name: 'Schultern & Arme',
        muscleGroups: ['shoulders', 'biceps', 'triceps'],
        exerciseIds: ['overhead-press', 'barbell-curl', 'tricep-pushdown', 'lateral-raise', 'hammer-curl'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Arme werden indirekt durch Brust/Rücken vorermüdet — direktes Arm-Training am Folgetag wirkt als Peak-Stimulus.',
      },
      {
        id: 'arnold-legs',
        name: 'Beine',
        muscleGroups: ['legs', 'glutes', 'calves'],
        exerciseIds: ['squat', 'leg-press', 'romanian-deadlift', 'hip-thrust', 'calf-raise'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Kniebeuge als Hauptübung, gefolgt von Isolation für Hamstrings und Gesäß. Kein Oberkörper-Volumen — volle Energie für Unterkörper.',
      },
    ],
  },
  // ─── 2: Upper/Lower ────────────────────────────────────────────────────────
  {
    id: 'upper-lower',
    name: 'Upper / Lower',
    type: 'upper-lower',
    description: 'Oberkörper und Unterkörper abwechselnd. Perfekt für 4 Trainingstage.',
    scienceNote: 'Jede Muskelgruppe 2× pro Woche mit ausreichend 48h Erholung dazwischen. Ausgewogene Kombination aus Frequenz und Volumen — ideal laut aktueller Hypertrophie-Forschung.',
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
        repScheme: 'hypertrophy',
        scienceNote: 'Compound-Übungen zuerst für maximalen neuromuskulären Stimulus. Isolationsübungen am Ende für gezielten Pump.',
      },
      {
        id: 'ul-lower',
        name: 'Unterkörper',
        muscleGroups: ['legs', 'glutes', 'calves', 'core'],
        exerciseIds: ['squat', 'romanian-deadlift', 'leg-press', 'leg-curl', 'calf-raise'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Kniebeuge und Rumänisches Kreuzheben decken Quadrizeps und hintere Kette ab. Beinpresse als Ergänzung für zusätzliches Volumen.',
      },
    ],
  },
  // ─── 3: Full Body ──────────────────────────────────────────────────────────
  {
    id: 'full-body-3',
    name: 'Full Body 3x',
    type: 'full-body',
    description: 'Ganzkörpertraining 3x pro Woche. Ideal für Einsteiger und bei wenig Zeit.',
    scienceNote: 'Hohe Trainingsfrequenz (3×/Woche pro Muskelgruppe) maximiert proteinsynthetische Reize bei Einsteigern. Wenige schwere Compound-Übungen erzielen maximalen Return on Time.',
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
        repScheme: 'hypertrophy',
        scienceNote: '5 Grundübungen decken alle Hauptmuskelgruppen ab. Kurz, effizient und wissenschaftlich belegt als optimal für Anfänger.',
      },
    ],
  },
  // ─── 4: Bro Split ──────────────────────────────────────────────────────────
  {
    id: 'bro-split-5',
    name: 'Bro Split 5x',
    type: 'bro-split',
    description: 'Klassischer Bodybuilder-Split. Jede Muskelgruppe einmal pro Woche, maximaler Fokus.',
    scienceNote: 'Geringere Frequenz (1×/Woche) durch sehr hohes Volumen pro Session kompensiert. Gut für erfahrene Athleten, die maximalen Pump und Mind-Muscle-Connection priorisieren.',
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
        repScheme: 'hypertrophy',
        scienceNote: 'Maximales Brust-Volumen in einer Session — von Compound bis Isolation. Trizeps wird indirekt mittrainiert.',
      },
      {
        id: 'bro-back',
        name: 'Rücken',
        muscleGroups: ['back', 'biceps'],
        exerciseIds: ['deadlift', 'pull-up', 'barbell-row', 'lat-pulldown', 'seated-cable-row'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Rücken-Session mit 5 Übungen für maximale Latissimus- und Rhomboidenentwicklung. Bizeps wird indirekt mittrainiert.',
      },
      {
        id: 'bro-shoulders',
        name: 'Schultern',
        muscleGroups: ['shoulders'],
        exerciseIds: ['overhead-press', 'lateral-raise', 'front-raise', 'rear-delt-fly', 'face-pull'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Alle drei Schulterköpfe (anterior, medial, posterior) werden direkt adressiert — für runde, vollständige Schulterentwicklung.',
      },
      {
        id: 'bro-arms',
        name: 'Arme',
        muscleGroups: ['biceps', 'triceps'],
        exerciseIds: ['barbell-curl', 'hammer-curl', 'incline-curl', 'tricep-pushdown', 'skull-crusher'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Dedizierter Armtag nach erholtem Oberkörper — maximaler Fokus auf Bizeps und Trizeps ohne Vorermüdung.',
      },
      {
        id: 'bro-legs',
        name: 'Beine',
        muscleGroups: ['legs', 'glutes', 'calves'],
        exerciseIds: ['squat', 'leg-press', 'romanian-deadlift', 'leg-curl', 'calf-raise'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Vollständige Bein-Session von Quad-dominant bis Hamstring-dominant. Hohe Intensität durch ausgeruhten Zustand nach oberen Körpertagen.',
      },
    ],
  },
  // ─── 5: PHUL ───────────────────────────────────────────────────────────────
  {
    id: 'phul',
    name: 'PHUL (Power & Hypertrophie)',
    type: 'phul',
    description: 'Power Hypertrophy Upper Lower — 4 Tage Kraft + Muskelmasse kombiniert.',
    scienceNote: 'Kombiniert neuronale Adaption (Kraft-Tage, 3–5 Wdh.) mit metabolischem Stress (Hypertrophie-Tage, 8–15 Wdh.). Studien zeigen größere Muskelzuwächse als reine Hypertrophie-Programme.',
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
        repScheme: 'strength',
        scienceNote: 'Schwere Grundübungen bei 3–5 Wdh. aktivieren mehr motorische Einheiten und erhöhen die Neuroadaptation (Kraft ohne Muskelmasse-Limit).',
      },
      {
        id: 'phul-power-lower',
        name: 'Kraft Unterkörper',
        muscleGroups: ['legs', 'glutes'],
        exerciseIds: ['squat', 'deadlift', 'romanian-deadlift', 'leg-curl', 'calf-raise'],
        restDay: false,
        repScheme: 'strength',
        scienceNote: 'Kniebeuge und Kreuzheben schwer und spezifisch — klassisches 5/3/1-Prinzip für maximale Unterkörperkraft.',
      },
      {
        id: 'phul-hyper-upper',
        name: 'Hypertrophie Oberkörper',
        muscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
        exerciseIds: ['incline-bench-press', 'dumbbell-row', 'dumbbell-shoulder-press', 'cable-fly', 'tricep-pushdown', 'dumbbell-curl', 'lateral-raise'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Moderate Lasten (8–15 Wdh.) erzeugen metabolischen Stress und Muskelschaden — optimale Kombination für Hypertrophie laut Schoenfeld (2010).',
      },
      {
        id: 'phul-hyper-lower',
        name: 'Hypertrophie Unterkörper',
        muscleGroups: ['legs', 'glutes', 'calves'],
        exerciseIds: ['hack-squat', 'leg-press', 'bulgarian-split-squat', 'leg-extension', 'leg-curl', 'hip-thrust', 'calf-raise'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Maschinen- und Isolationsübungen für maximalen Pump und Time Under Tension. Hip Thrust als abschließender Gluteus-Fokus.',
      },
    ],
  },
];

// ── Dumbbell-Swap-Map für Equipment-Anpassung ──────────────────────────────
const dumbbellSwapMap: Record<string, string> = {
  'bench-press':   'dumbbell-bench-press',
  'barbell-row':   'dumbbell-row',
  'overhead-press':'dumbbell-shoulder-press',
  'barbell-curl':  'dumbbell-curl',
  'deadlift':      'romanian-deadlift',
};

const bodyweightSwapMap: Record<string, string> = {
  'bench-press':    'push-up',
  'barbell-row':    'pull-up',
  'overhead-press': 'push-up',
  'barbell-curl':   'hammer-curl',
  'deadlift':       'pull-up',
  'squat':          'squat',          // bodyweight squat — same ID, weight 0
  'leg-press':      'bulgarian-split-squat',
};

function swapExercises(exerciseIds: string[], swapMap: Record<string, string>): string[] {
  return exerciseIds.map((id) => swapMap[id] ?? id);
}

// ── Smarter Plan-Generator ─────────────────────────────────────────────────
export function generateSplitForUser(
  daysPerWeek: number,
  level: string,
  goal: string = 'muskelaufbau',
  equipment: string = 'vollausgestattet'
): TrainingSplit {
  // Bodyweight-only → immer Full Body mit Swaps
  if (equipment === 'eigengewicht') {
    const base = { ...predefinedSplits[3] };
    return {
      ...base,
      id: `custom-${Date.now()}`,
      isActive: true,
      createdAt: Date.now(),
      days: base.days.map((day) => ({
        ...day,
        exerciseIds: swapExercises(day.exerciseIds, bodyweightSwapMap),
      })),
    };
  }

  // Basierend auf Goal den besten Split wählen
  let baseSplit: TrainingSplit;

  if (goal === 'kraft') {
    // Kraft: PHUL (4 Tage) oder Bro Split (5 Tage) für Niedrig-Rep-Kraft
    if (daysPerWeek <= 3) {
      baseSplit = predefinedSplits[3]; // Full Body — auch für Kraft gut
    } else if (daysPerWeek === 4) {
      baseSplit = predefinedSplits[5]; // PHUL
    } else {
      baseSplit = predefinedSplits[4]; // Bro Split 5x
    }
  } else if (goal === 'muskelaufbau') {
    // Muskelaufbau: PPL (6 Tage) oder Upper/Lower (4 Tage)
    if (daysPerWeek <= 3) {
      baseSplit = predefinedSplits[3]; // Full Body
    } else if (daysPerWeek === 4) {
      baseSplit = predefinedSplits[2]; // Upper/Lower
    } else if (daysPerWeek === 5) {
      baseSplit = predefinedSplits[4]; // Bro Split
    } else {
      baseSplit = predefinedSplits[0]; // PPL
    }
  } else if (goal === 'abnehmen') {
    // Abnehmen: Full Body 3x (hohe Frequenz, moderate Last, maximaler Kalorienverbrauch)
    if (daysPerWeek <= 3) {
      baseSplit = predefinedSplits[3]; // Full Body
    } else if (daysPerWeek === 4) {
      baseSplit = predefinedSplits[2]; // Upper/Lower
    } else {
      baseSplit = predefinedSplits[0]; // PPL — viel Gesamtvolumen
    }
  } else if (goal === 'ausdauer') {
    // Ausdauer: Full Body (leichter, mehr Wdh., hohe Frequenz)
    if (daysPerWeek <= 3) {
      baseSplit = predefinedSplits[3]; // Full Body
    } else {
      baseSplit = predefinedSplits[2]; // Upper/Lower
    }
  } else {
    // fitness (default)
    if (daysPerWeek <= 3) {
      baseSplit = predefinedSplits[3]; // Full Body
    } else if (daysPerWeek === 4) {
      baseSplit = predefinedSplits[2]; // Upper/Lower
    } else {
      baseSplit = predefinedSplits[0]; // PPL
    }
  }

  // Equipment-Anpassung: Kurzhanteln → Barbell-Übungen swappen
  let days = baseSplit.days;
  if (equipment === 'kurzhanteln' || equipment === 'minimalistisch') {
    days = days.map((day) => ({
      ...day,
      exerciseIds: swapExercises(day.exerciseIds, dumbbellSwapMap),
    }));
  }

  return {
    ...baseSplit,
    id: `custom-${Date.now()}`,
    daysPerWeek,
    isActive: true,
    createdAt: Date.now(),
    days,
  };
}
