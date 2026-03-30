import type { TrainingSplit } from '@/types/splits';

export const predefinedSplits: TrainingSplit[] = [
  // ─── 0: Arnold Split (Coach Arved) ────────────────────────────────────────
  {
    id: 'arnold',
    name: 'Arnold Split',
    type: 'arnold',
    description: 'Coach Arved\'s go-to split. Chest/Back, Arms/Shoulders, Legs/Abs + Functional day. Antagonist training for maximum efficiency.',
    scienceNote: 'Antagonist pairs (chest & back) trained together allow active recovery between sets — higher overall volume in less time. Bicep/tricep pre-fatigue from Day 1 & 2 creates a peak stimulus on direct arm day.',
    daysPerWeek: 6,
    difficulty: 'advanced',
    durationWeeks: 12,
    targetAudience: 'Fortgeschrittene',
    tags: ['Hypertrophie', 'Antagonist', 'Klassiker'],
    isActive: false,
    createdAt: 0,
    days: [
      {
        id: 'arnold-chest-back-1',
        name: 'Chest & Back',
        muscleGroups: ['chest', 'back'],
        exerciseIds: ['bench-press', 'incline-dumbbell-press', 'seated-cable-fly', 'lat-pulldown', 'seated-cable-row', 'cable-shrugs'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Antagonist pairings: bench press ↔ lat pulldown, incline press ↔ cable row. Active rest between pushing and pulling doubles session efficiency and blood flow to both muscles.',
      },
      {
        id: 'arnold-arms-shoulders-1',
        name: 'Arms & Shoulders',
        muscleGroups: ['shoulders', 'biceps', 'triceps'],
        exerciseIds: ['arnold-press', 'cable-lateral-raise', 'dumbbell-curl', 'preacher-curl', 'tricep-pushdown', 'cable-overhead-tricep-ext', 'face-pull'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Arms are pre-fatigued from chest/back day — direct arm work now provides a peak stimulus. Arnold Press hits all 3 delt heads. Overhead tricep extension (long-head stretch) and Face Pulls for shoulder health.',
      },
      {
        id: 'arnold-legs-abs-1',
        name: 'Legs & Abs',
        muscleGroups: ['legs', 'glutes', 'core'],
        exerciseIds: ['smith-machine-squat', 'leg-extension', 'seated-leg-curl', 'romanian-deadlift', 'abductor-machine', 'adductor-machine', 'cable-crunch', 'decline-crunch'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Smith Machine Squat with leg extension covers full quad ROM. Seated leg curl in hip-flexed position maximizes hamstring hypertrophy stimulus. Abductor/adductor for hip stability and injury prevention.',
      },
      {
        id: 'arnold-functional',
        name: 'Functional & Cardio',
        muscleGroups: ['core', 'back', 'glutes', 'legs'],
        exerciseIds: ['dead-bug', 'bird-dog', 'glute-bridge', 'side-plank', 'superman-hold', 'wall-angels', 'pallof-press', 'face-pull', 'treadmill-run'],
        restDay: false,
        repScheme: 'endurance',
        scienceNote: 'Active recovery day — high reps (15–20), light load. Trains deep stabilizers (transverse abdominis, multifidus), improves thoracic mobility, and counteracts postural deviations. Cardio improves recovery between heavy training days.',
      },
      {
        id: 'arnold-chest-back-2',
        name: 'Chest & Back (Variation)',
        muscleGroups: ['chest', 'back'],
        exerciseIds: ['incline-barbell-press', 'dumbbell-row', 'pec-deck', 'chest-supported-row', 'cable-pullover', 'cable-shrugs'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Variation day targets different portions of the same muscles. Incline barbell shifts upper pec emphasis. Chest-supported row eliminates lower back from mid-back work.',
      },
      {
        id: 'arnold-arms-shoulders-2',
        name: 'Arms & Shoulders (Variation)',
        muscleGroups: ['shoulders', 'biceps', 'triceps'],
        exerciseIds: ['machine-shoulder-press', 'reverse-pec-deck', 'bayesian-cable-curl', 'skull-crusher', 'hammer-curl', 'close-grip-bench', 'face-pull'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Machine press and Bayesian curls allow full pre-exhaustion without stability demands. Skull crushers and close-grip press provide heavy long-head tricep stimulus.',
      },
      {
        id: 'arnold-rest',
        name: 'Rest Day',
        muscleGroups: [],
        exerciseIds: [],
        restDay: true,
        scienceNote: 'Full recovery day. Sleep, nutrition, and walking are the best tools for muscle repair and growth.',
      },
    ],
  },

  // ─── 1: PPL ────────────────────────────────────────────────────────────────
  {
    id: 'ppl-3',
    name: 'Push Pull Legs',
    type: 'ppl',
    description: 'Classic Push/Pull/Legs split. Each muscle group trained 2× per week. Ideal for 6 training days.',
    scienceNote: 'Each muscle group trained 2× per week — optimal frequency for naturals per meta-analyses. High weekly volume with sufficient recovery between similar sessions.',
    daysPerWeek: 6,
    difficulty: 'intermediate',
    durationWeeks: 12,
    targetAudience: 'Fortgeschrittene',
    tags: ['Hypertrophie', 'Klassiker'],
    isActive: false,
    createdAt: 0,
    days: [
      {
        id: 'ppl-push-1',
        name: 'Push 1',
        muscleGroups: ['chest', 'shoulders', 'triceps'],
        exerciseIds: ['bench-press', 'arnold-press', 'incline-dumbbell-press', 'cable-lateral-raise', 'tricep-pushdown', 'cable-overhead-tricep-ext'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Pushing muscles in one session — maximum synergy between chest, shoulder, and triceps.',
      },
      {
        id: 'ppl-pull-1',
        name: 'Pull 1',
        muscleGroups: ['back', 'biceps'],
        exerciseIds: ['lat-pulldown', 'seated-cable-row', 'dumbbell-row', 'dumbbell-curl', 'face-pull', 'reverse-cable-curl'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Pulling muscles together. Vertical and horizontal pulls for complete back development.',
      },
      {
        id: 'ppl-legs-1',
        name: 'Legs 1',
        muscleGroups: ['legs', 'glutes', 'core'],
        exerciseIds: ['smith-machine-squat', 'romanian-deadlift', 'leg-extension', 'seated-leg-curl', 'abductor-machine', 'cable-crunch'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Dedicated leg day maximizes quad and hamstring volume.',
      },
      {
        id: 'ppl-push-2',
        name: 'Push 2',
        muscleGroups: ['chest', 'shoulders', 'triceps'],
        exerciseIds: ['incline-barbell-press', 'machine-shoulder-press', 'pec-deck', 'reverse-pec-deck', 'skull-crusher', 'close-grip-bench'],
        restDay: false,
        repScheme: 'hypertrophy',
      },
      {
        id: 'ppl-pull-2',
        name: 'Pull 2',
        muscleGroups: ['back', 'biceps'],
        exerciseIds: ['pull-up', 'barbell-row', 'preacher-curl', 'hammer-curl', 'cable-shrugs'],
        restDay: false,
        repScheme: 'hypertrophy',
      },
      {
        id: 'ppl-legs-2',
        name: 'Legs 2',
        muscleGroups: ['legs', 'glutes', 'core'],
        exerciseIds: ['hack-squat', 'leg-press', 'lying-leg-curl', 'hip-thrust', 'adductor-machine', 'hanging-leg-raise'],
        restDay: false,
        repScheme: 'hypertrophy',
      },
      {
        id: 'ppl-rest',
        name: 'Rest Day',
        muscleGroups: [],
        exerciseIds: [],
        restDay: true,
        scienceNote: 'CNS and muscles fully recover for the next PPL cycle.',
      },
    ],
  },

  // ─── 2: Upper/Lower ────────────────────────────────────────────────────────
  {
    id: 'upper-lower',
    name: 'Upper / Lower',
    type: 'upper-lower',
    description: 'Upper and lower body alternating. Perfect for 4 training days.',
    scienceNote: 'Each muscle group 2× per week with 48h recovery between similar sessions. Ideal balance of frequency and volume — recommended by current hypertrophy research.',
    daysPerWeek: 4,
    difficulty: 'beginner',
    durationWeeks: 8,
    targetAudience: 'Alle Level',
    tags: ['Kraft', 'Hypertrophie'],
    isActive: false,
    createdAt: 0,
    days: [
      {
        id: 'ul-upper-1',
        name: 'Upper Body 1',
        muscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
        exerciseIds: ['bench-press', 'lat-pulldown', 'arnold-press', 'dumbbell-curl', 'tricep-pushdown', 'face-pull'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Compound movements first for maximum neuromuscular stimulus. Isolation at end for targeted pump.',
      },
      {
        id: 'ul-lower-1',
        name: 'Lower Body 1',
        muscleGroups: ['legs', 'glutes', 'core'],
        exerciseIds: ['smith-machine-squat', 'romanian-deadlift', 'leg-extension', 'seated-leg-curl', 'cable-crunch'],
        restDay: false,
        repScheme: 'hypertrophy',
      },
      {
        id: 'ul-rest-1',
        name: 'Rest Day',
        muscleGroups: [],
        exerciseIds: [],
        restDay: true,
      },
      {
        id: 'ul-upper-2',
        name: 'Upper Body 2',
        muscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
        exerciseIds: ['incline-dumbbell-press', 'seated-cable-row', 'cable-lateral-raise', 'preacher-curl', 'skull-crusher', 'cable-shrugs'],
        restDay: false,
        repScheme: 'hypertrophy',
      },
      {
        id: 'ul-lower-2',
        name: 'Lower Body 2',
        muscleGroups: ['legs', 'glutes', 'core'],
        exerciseIds: ['hack-squat', 'lying-leg-curl', 'leg-press', 'hip-thrust', 'hanging-leg-raise'],
        restDay: false,
        repScheme: 'hypertrophy',
      },
      {
        id: 'ul-rest-2',
        name: 'Rest Day',
        muscleGroups: [],
        exerciseIds: [],
        restDay: true,
      },
      {
        id: 'ul-rest-3',
        name: 'Rest Day',
        muscleGroups: [],
        exerciseIds: [],
        restDay: true,
      },
    ],
  },

  // ─── 3: Full Body ──────────────────────────────────────────────────────────
  {
    id: 'full-body-3',
    name: 'Full Body 3×',
    type: 'full-body',
    description: 'Full body 3× per week. Ideal for beginners and when time is limited.',
    scienceNote: 'High training frequency (3×/week per muscle group) maximizes protein synthesis stimulus for beginners. Few heavy compound movements deliver maximum return on time.',
    daysPerWeek: 3,
    difficulty: 'beginner',
    durationWeeks: 8,
    targetAudience: 'Anfänger',
    tags: ['Fullbody', 'Einstieg'],
    isActive: false,
    createdAt: 0,
    days: [
      {
        id: 'fb-day-1',
        name: 'Full Body 1',
        muscleGroups: ['chest', 'back', 'legs', 'shoulders', 'core'],
        exerciseIds: ['smith-machine-squat', 'bench-press', 'lat-pulldown', 'arnold-press', 'plank'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: '5 compound movements cover all major muscle groups. Short, efficient, evidence-based for beginners.',
      },
      { id: 'fb-rest-1', name: 'Rest Day', muscleGroups: [], exerciseIds: [], restDay: true },
      {
        id: 'fb-day-2',
        name: 'Full Body 2',
        muscleGroups: ['chest', 'back', 'legs', 'shoulders', 'core'],
        exerciseIds: ['romanian-deadlift', 'incline-dumbbell-press', 'seated-cable-row', 'cable-lateral-raise', 'cable-crunch'],
        restDay: false,
        repScheme: 'hypertrophy',
      },
      { id: 'fb-rest-2', name: 'Rest Day', muscleGroups: [], exerciseIds: [], restDay: true },
      {
        id: 'fb-day-3',
        name: 'Full Body 3',
        muscleGroups: ['chest', 'back', 'legs', 'shoulders', 'core'],
        exerciseIds: ['hack-squat', 'pec-deck', 'dumbbell-row', 'machine-shoulder-press', 'lying-leg-curl'],
        restDay: false,
        repScheme: 'hypertrophy',
      },
      { id: 'fb-rest-3', name: 'Rest Day', muscleGroups: [], exerciseIds: [], restDay: true },
      { id: 'fb-rest-4', name: 'Rest Day', muscleGroups: [], exerciseIds: [], restDay: true },
    ],
  },

  // ─── 4: Bro Split ──────────────────────────────────────────────────────────
  {
    id: 'bro-split-5',
    name: 'Bro Split 5×',
    type: 'bro-split',
    description: 'Classic bodybuilding split. Each muscle group once per week, maximum focus.',
    scienceNote: 'Lower frequency (1×/week) compensated by very high volume per session. Good for experienced athletes prioritizing maximum pump and mind-muscle connection.',
    daysPerWeek: 5,
    difficulty: 'intermediate',
    durationWeeks: 8,
    targetAudience: 'Hypertrophie-Fokus',
    tags: ['Bro-Split', 'Hypertrophie'],
    isActive: false,
    createdAt: 0,
    days: [
      {
        id: 'bro-chest',
        name: 'Chest',
        muscleGroups: ['chest', 'triceps'],
        exerciseIds: ['bench-press', 'incline-barbell-press', 'incline-dumbbell-press', 'seated-cable-fly', 'pec-deck', 'dips'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Maximum chest volume in one session — from compound to isolation. Triceps get indirect stimulation.',
      },
      {
        id: 'bro-back',
        name: 'Back',
        muscleGroups: ['back', 'biceps'],
        exerciseIds: ['pull-up', 'barbell-row', 'lat-pulldown', 'seated-cable-row', 'chest-supported-row', 'cable-shrugs'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Back session covering both width (pull-ups, lat pulldown) and thickness (rows).',
      },
      {
        id: 'bro-shoulders',
        name: 'Shoulders',
        muscleGroups: ['shoulders'],
        exerciseIds: ['arnold-press', 'cable-lateral-raise', 'lateral-raise', 'reverse-pec-deck', 'rear-delt-cable-fly', 'face-pull'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'All three delt heads addressed directly — for round, complete shoulder development.',
      },
      {
        id: 'bro-rest-1',
        name: 'Rest Day',
        muscleGroups: [],
        exerciseIds: [],
        restDay: true,
      },
      {
        id: 'bro-arms',
        name: 'Arms',
        muscleGroups: ['biceps', 'triceps'],
        exerciseIds: ['dumbbell-curl', 'preacher-curl', 'bayesian-cable-curl', 'cable-overhead-tricep-ext', 'tricep-pushdown', 'skull-crusher'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Dedicated arm day after recovered upper body — maximum focus on biceps and triceps without pre-fatigue.',
      },
      {
        id: 'bro-legs',
        name: 'Legs & Abs',
        muscleGroups: ['legs', 'glutes', 'core'],
        exerciseIds: ['smith-machine-squat', 'leg-press', 'romanian-deadlift', 'seated-leg-curl', 'leg-extension', 'hip-thrust', 'cable-crunch'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Complete leg session from quad-dominant to hamstring-dominant. High intensity from being fully rested.',
      },
      {
        id: 'bro-rest-2',
        name: 'Rest Day',
        muscleGroups: [],
        exerciseIds: [],
        restDay: true,
      },
    ],
  },

  // ─── 5: PHUL ───────────────────────────────────────────────────────────────
  {
    id: 'phul',
    name: 'PHUL (Power & Hypertrophy)',
    type: 'phul',
    description: 'Power Hypertrophy Upper Lower — 4 days combining strength and muscle mass.',
    scienceNote: 'Combines neural adaptation (strength days, 3–5 reps) with metabolic stress (hypertrophy days, 8–15 reps). Studies show greater muscle gains than pure hypertrophy programs.',
    daysPerWeek: 4,
    difficulty: 'intermediate',
    durationWeeks: 8,
    targetAudience: 'Fortgeschrittene',
    tags: ['Kraft', 'Hypertrophie', 'PHUL'],
    isActive: false,
    createdAt: 0,
    days: [
      {
        id: 'phul-power-upper',
        name: 'Power Upper',
        muscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
        exerciseIds: ['bench-press', 'barbell-row', 'overhead-press', 'dumbbell-curl', 'close-grip-bench'],
        restDay: false,
        repScheme: 'strength',
        scienceNote: 'Heavy compound movements at 3–5 reps for maximum motor unit recruitment and neural adaptation.',
      },
      {
        id: 'phul-power-lower',
        name: 'Power Lower',
        muscleGroups: ['legs', 'glutes'],
        exerciseIds: ['smith-machine-squat', 'romanian-deadlift', 'seated-leg-curl', 'leg-press'],
        restDay: false,
        repScheme: 'strength',
        scienceNote: 'Squat and RDL heavy for maximum lower body strength development.',
      },
      { id: 'phul-rest-1', name: 'Rest Day', muscleGroups: [], exerciseIds: [], restDay: true },
      {
        id: 'phul-hyper-upper',
        name: 'Hypertrophy Upper',
        muscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
        exerciseIds: ['incline-dumbbell-press', 'chest-supported-row', 'machine-shoulder-press', 'seated-cable-fly', 'tricep-pushdown', 'preacher-curl', 'cable-lateral-raise'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Moderate loads (8–15 reps) for metabolic stress and muscle damage for hypertrophy.',
      },
      {
        id: 'phul-hyper-lower',
        name: 'Hypertrophy Lower',
        muscleGroups: ['legs', 'glutes', 'core'],
        exerciseIds: ['hack-squat', 'leg-extension', 'lying-leg-curl', 'hip-thrust', 'abductor-machine', 'adductor-machine', 'decline-crunch'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Machine and isolation work for maximum pump and time under tension.',
      },
      { id: 'phul-rest-2', name: 'Rest Day', muscleGroups: [], exerciseIds: [], restDay: true },
      { id: 'phul-rest-3', name: 'Rest Day', muscleGroups: [], exerciseIds: [], restDay: true },
    ],
  },
  // ─── 6: PPL Barbell ────────────────────────────────────────────────────────
  {
    id: 'ppl-barbell',
    name: 'Push Pull Legs (Barbell)',
    type: 'ppl',
    description: '6-tägiger Push/Pull/Legs-Split mit freien Gewichten. Jede Muskelgruppe 2× pro Woche für optimales Wachstum.',
    scienceNote: 'Klassischer 6-Tage-PPL mit Langhantel-Fokus — jede Muskelgruppe wird 2× wöchentlich trainiert. Optimale Frequenz für natürliche Athleten laut aktueller Metaanalysen.',
    daysPerWeek: 6,
    difficulty: 'intermediate',
    durationWeeks: 12,
    targetAudience: 'Fortgeschrittene',
    tags: ['Hypertrophie', 'Klassiker'],
    isActive: false,
    createdAt: 0,
    days: [
      {
        id: 'ppl-bb-push-1',
        name: 'Push 1',
        muscleGroups: ['chest', 'shoulders', 'triceps'],
        exerciseIds: ['bench-press', 'overhead-press', 'incline-dumbbell-press', 'cable-lateral-raise', 'tricep-pushdown', 'cable-overhead-tricep-ext'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Horizontales + vertikales Drücken für vollständige Brust- und Schulterentwicklung.',
      },
      {
        id: 'ppl-bb-pull-1',
        name: 'Pull 1',
        muscleGroups: ['back', 'biceps'],
        exerciseIds: ['deadlift-conventional', 'lat-pulldown', 'seated-cable-row', 'dumbbell-curl', 'face-pull', 'cable-shrugs'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Konventionelles Kreuzheben als Basis + vertikales und horizontales Ziehen für kompletten Rückenaufbau.',
      },
      {
        id: 'ppl-bb-legs-1',
        name: 'Legs 1',
        muscleGroups: ['legs', 'glutes'],
        exerciseIds: ['squat-barbell', 'leg-press', 'leg-extension', 'seated-leg-curl', 'romanian-deadlift'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Kniebeuge als Fundament + Isolation für Quads und Hamstrings.',
      },
      {
        id: 'ppl-bb-push-2',
        name: 'Push 2',
        muscleGroups: ['chest', 'shoulders', 'triceps'],
        exerciseIds: ['incline-barbell-press', 'arnold-press', 'pec-deck', 'cable-lateral-raise', 'skull-crusher', 'close-grip-bench'],
        restDay: false,
        repScheme: 'hypertrophy',
      },
      {
        id: 'ppl-bb-pull-2',
        name: 'Pull 2',
        muscleGroups: ['back', 'biceps'],
        exerciseIds: ['barbell-row', 'lat-pulldown', 'seated-cable-row', 'hammer-curl', 'face-pull'],
        restDay: false,
        repScheme: 'hypertrophy',
      },
      {
        id: 'ppl-bb-legs-2',
        name: 'Legs 2',
        muscleGroups: ['legs', 'glutes'],
        exerciseIds: ['hack-squat', 'romanian-deadlift', 'leg-extension', 'seated-leg-curl', 'leg-press'],
        restDay: false,
        repScheme: 'hypertrophy',
      },
      {
        id: 'ppl-bb-rest',
        name: 'Ruhetag',
        muscleGroups: [],
        exerciseIds: [],
        restDay: true,
        scienceNote: 'ZNS und Muskeln erholen sich vollständig für den nächsten PPL-Zyklus.',
      },
    ],
  },

  // ─── 7: Upper/Lower 4× ────────────────────────────────────────────────────
  {
    id: 'upper-lower-4',
    name: 'Upper / Lower 4×',
    type: 'upper-lower',
    description: 'Oberkörper und Unterkörper im Wechsel. 4 Trainingstage — Kraft und Hypertrophie kombiniert.',
    scienceNote: 'Jede Muskelgruppe 2× pro Woche mit 48h Erholung. Ideale Balance aus Frequenz und Volumen — empfohlen von der aktuellen Hypertrophieforschung.',
    daysPerWeek: 4,
    difficulty: 'intermediate',
    durationWeeks: 8,
    targetAudience: 'Alle Level',
    tags: ['Kraft', 'Hypertrophie'],
    isActive: false,
    createdAt: 0,
    days: [
      {
        id: 'ul4-upper-a',
        name: 'Upper A',
        muscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
        exerciseIds: ['bench-press', 'lat-pulldown', 'overhead-press', 'seated-cable-row', 'dumbbell-curl', 'tricep-pushdown'],
        restDay: false,
        repScheme: 'strength',
        scienceNote: 'Horizontales Drücken + vertikales Ziehen + Overhead — kompletter Oberkörper in einer Session.',
      },
      {
        id: 'ul4-lower-a',
        name: 'Lower A',
        muscleGroups: ['legs', 'glutes'],
        exerciseIds: ['squat-barbell', 'romanian-deadlift', 'leg-extension', 'seated-leg-curl', 'leg-press'],
        restDay: false,
        repScheme: 'strength',
        scienceNote: 'Kniebeuge als Primärbewegung + Ergänzung für Hamstrings und Quads.',
      },
      {
        id: 'ul4-upper-b',
        name: 'Upper B',
        muscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
        exerciseIds: ['incline-dumbbell-press', 'seated-cable-row', 'arnold-press', 'lat-pulldown', 'face-pull'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Variationstag mit Fokus auf Schrägbank und Schultergesundheit.',
      },
      {
        id: 'ul4-lower-b',
        name: 'Lower B',
        muscleGroups: ['legs', 'glutes'],
        exerciseIds: ['deadlift-conventional', 'leg-press', 'romanian-deadlift', 'seated-leg-curl'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Kreuzheben als Hauptbewegung + Hypertrophiefokus für Hamstrings.',
      },
      { id: 'ul4-rest-1', name: 'Ruhetag', muscleGroups: [], exerciseIds: [], restDay: true },
      { id: 'ul4-rest-2', name: 'Ruhetag', muscleGroups: [], exerciseIds: [], restDay: true },
      { id: 'ul4-rest-3', name: 'Ruhetag', muscleGroups: [], exerciseIds: [], restDay: true },
    ],
  },

  // ─── 8: Fullbody 3×/Week ─────────────────────────────────────────────────
  {
    id: 'fullbody-3x',
    name: 'Fullbody 3× pro Woche',
    type: 'full-body',
    description: 'Ganzkörpertraining 3× pro Woche. Perfekt für Einsteiger und Wiedereinsteiger.',
    scienceNote: 'Hohe Trainingsfrequenz (3×/Woche je Muskelgruppe) maximiert den Proteinsynthesereiz für Anfänger. Wenige schwere Grundübungen liefern maximalen Fortschritt.',
    daysPerWeek: 3,
    difficulty: 'beginner',
    durationWeeks: 8,
    targetAudience: 'Anfänger',
    tags: ['Fullbody', 'Einstieg'],
    isActive: false,
    createdAt: 0,
    days: [
      {
        id: 'fb3x-day-a',
        name: 'Ganzkörper A',
        muscleGroups: ['chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps'],
        exerciseIds: ['squat-barbell', 'bench-press', 'lat-pulldown', 'overhead-press', 'dumbbell-curl', 'tricep-pushdown'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: '6 Grundübungen decken alle großen Muskelgruppen ab — effizient und evidenzbasiert.',
      },
      { id: 'fb3x-rest-1', name: 'Ruhetag', muscleGroups: [], exerciseIds: [], restDay: true },
      {
        id: 'fb3x-day-b',
        name: 'Ganzkörper B',
        muscleGroups: ['chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps'],
        exerciseIds: ['deadlift-conventional', 'incline-dumbbell-press', 'seated-cable-row', 'leg-press', 'dumbbell-curl', 'tricep-pushdown'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Variationstag mit Kreuzheben als Hip-Hinge-Muster und Schrägbank für obere Brust.',
      },
      { id: 'fb3x-rest-2', name: 'Ruhetag', muscleGroups: [], exerciseIds: [], restDay: true },
      {
        id: 'fb3x-day-c',
        name: 'Ganzkörper C',
        muscleGroups: ['chest', 'back', 'legs', 'shoulders'],
        exerciseIds: ['squat-barbell', 'bench-press', 'lat-pulldown', 'overhead-press', 'face-pull'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Woche mit Fokus auf Schultergesundheit — Face Pull als Pflichtübung am Ende.',
      },
      { id: 'fb3x-rest-3', name: 'Ruhetag', muscleGroups: [], exerciseIds: [], restDay: true },
      { id: 'fb3x-rest-4', name: 'Ruhetag', muscleGroups: [], exerciseIds: [], restDay: true },
    ],
  },

  // ─── 9: Bro-Split 5× (Neu) ────────────────────────────────────────────────
  {
    id: 'bro-split-classic',
    name: 'Bro-Split Klassisch',
    type: 'bro-split',
    description: '5-Tage Bodybuilder-Split. Jede Muskelgruppe einmal pro Woche mit maximalem Fokus und Volumen.',
    scienceNote: 'Geringere Frequenz (1×/Woche) wird durch sehr hohes Volumen pro Session kompensiert. Gut für erfahrene Athleten mit Fokus auf Pump und Muskel-Geist-Verbindung.',
    daysPerWeek: 5,
    difficulty: 'intermediate',
    durationWeeks: 8,
    targetAudience: 'Hypertrophie-Fokus',
    tags: ['Bro-Split', 'Hypertrophie'],
    isActive: false,
    createdAt: 0,
    days: [
      {
        id: 'bro2-chest',
        name: 'Brust',
        muscleGroups: ['chest', 'triceps'],
        exerciseIds: ['bench-press', 'incline-dumbbell-press', 'incline-barbell-press', 'pec-deck', 'seated-cable-fly'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Maximales Brustvolumen — von Grundübungen bis zur Isolation.',
      },
      {
        id: 'bro2-back',
        name: 'Rücken',
        muscleGroups: ['back', 'biceps'],
        exerciseIds: ['deadlift-conventional', 'lat-pulldown', 'seated-cable-row', 'dumbbell-row', 'cable-pullover'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Breite (Klimmzüge, Latzug) und Dicke (Rudern) für komplette Rückenentwicklung.',
      },
      {
        id: 'bro2-shoulders',
        name: 'Schultern',
        muscleGroups: ['shoulders'],
        exerciseIds: ['overhead-press', 'arnold-press', 'cable-lateral-raise', 'face-pull', 'reverse-pec-deck'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Alle drei Deltaköpfe direkt trainiert — für runde, vollständige Schulterentwicklung.',
      },
      {
        id: 'bro2-arms',
        name: 'Arme',
        muscleGroups: ['biceps', 'triceps'],
        exerciseIds: ['dumbbell-curl', 'preacher-curl', 'hammer-curl', 'tricep-pushdown', 'skull-crusher', 'close-grip-bench'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Dedizierter Armtag für maximalen Pump und Wachstum ohne Vorer müdung.',
      },
      {
        id: 'bro2-rest',
        name: 'Ruhetag',
        muscleGroups: [],
        exerciseIds: [],
        restDay: true,
      },
      {
        id: 'bro2-legs',
        name: 'Beine',
        muscleGroups: ['legs', 'glutes'],
        exerciseIds: ['squat-barbell', 'leg-press', 'leg-extension', 'seated-leg-curl', 'romanian-deadlift'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Vollständige Beineinheit — von Quad-dominant bis Hamstring-dominant.',
      },
      {
        id: 'bro2-rest-2',
        name: 'Ruhetag',
        muscleGroups: [],
        exerciseIds: [],
        restDay: true,
      },
    ],
  },

  // ─── 10: Starter 3-Day ────────────────────────────────────────────────────
  {
    id: 'starter-3day',
    name: 'Starter 3-Tage',
    type: 'full-body',
    description: 'Der einfachste Einstieg ins Training. 3 Tage, wenige Übungen, maximale Grundlage.',
    scienceNote: 'Wenige, aber wirkungsvolle Grundübungen legen die neuronale und muskuläre Basis. Einfachheit fördert Konstanz — der wichtigste Faktor für Anfänger.',
    daysPerWeek: 3,
    difficulty: 'beginner',
    durationWeeks: 6,
    targetAudience: 'Einsteiger',
    tags: ['Einfach', 'Fullbody'],
    isActive: false,
    createdAt: 0,
    days: [
      {
        id: 'start-day-a',
        name: 'Ganzkörper A',
        muscleGroups: ['legs', 'chest', 'back', 'shoulders'],
        exerciseIds: ['squat-barbell', 'bench-press', 'seated-cable-row', 'overhead-press'],
        restDay: false,
        repScheme: 'strength',
        scienceNote: 'Vier Grundübungen decken alle großen Muskelgruppen ab — ideal zum Einstieg.',
      },
      { id: 'start-rest-1', name: 'Ruhetag', muscleGroups: [], exerciseIds: [], restDay: true },
      {
        id: 'start-day-b',
        name: 'Ganzkörper B',
        muscleGroups: ['legs', 'chest', 'back'],
        exerciseIds: ['deadlift-conventional', 'incline-dumbbell-press', 'lat-pulldown'],
        restDay: false,
        repScheme: 'strength',
        scienceNote: 'Kreuzheben als König der Grundübungen + Schrägbank + Latzug.',
      },
      { id: 'start-rest-2', name: 'Ruhetag', muscleGroups: [], exerciseIds: [], restDay: true },
      {
        id: 'start-day-c',
        name: 'Ganzkörper C',
        muscleGroups: ['legs', 'chest', 'back', 'biceps', 'triceps'],
        exerciseIds: ['squat-barbell', 'bench-press', 'seated-cable-row', 'dumbbell-curl', 'tricep-pushdown'],
        restDay: false,
        repScheme: 'hypertrophy',
        scienceNote: 'Woche 3 mit etwas mehr Isolation für Arme — steigert Motivation ohne Überforderung.',
      },
      { id: 'start-rest-3', name: 'Ruhetag', muscleGroups: [], exerciseIds: [], restDay: true },
      { id: 'start-rest-4', name: 'Ruhetag', muscleGroups: [], exerciseIds: [], restDay: true },
    ],
  },
];

// ── Equipment swap maps for auto-plan generation ───────────────────────────
const dumbbellSwapMap: Record<string, string> = {
  'bench-press': 'incline-dumbbell-press',
  'barbell-row': 'dumbbell-row',
  'overhead-press': 'arnold-press',
  'skull-crusher': 'cable-overhead-tricep-ext',
};

const bodyweightSwapMap: Record<string, string> = {
  'bench-press': 'dips',
  'barbell-row': 'pull-up',
  'overhead-press': 'dips',
  'smith-machine-squat': 'bulgarian-split-squat',
  'leg-press': 'bulgarian-split-squat',
};

function swapExercises(exerciseIds: string[], swapMap: Record<string, string>): string[] {
  return exerciseIds.map((id) => swapMap[id] ?? id);
}

// ── Smart plan generator ───────────────────────────────────────────────────
export function generateSplitForUser(
  daysPerWeek: number,
  level: string,
  goal: string = 'muskelaufbau',
  equipment: string = 'vollausgestattet'
): TrainingSplit {
  if (equipment === 'eigengewicht') {
    const base = { ...predefinedSplits[3] }; // Full Body
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

  let baseSplit: TrainingSplit;

  if (goal === 'kraft') {
    if (daysPerWeek <= 3) baseSplit = predefinedSplits[3];
    else if (daysPerWeek === 4) baseSplit = predefinedSplits[5]; // PHUL
    else baseSplit = predefinedSplits[4]; // Bro Split
  } else if (goal === 'muskelaufbau') {
    if (daysPerWeek <= 3) baseSplit = predefinedSplits[3];
    else if (daysPerWeek === 4) baseSplit = predefinedSplits[2];
    else if (daysPerWeek === 5) baseSplit = predefinedSplits[4];
    else baseSplit = predefinedSplits[0]; // Arnold Split
  } else if (goal === 'abnehmen') {
    if (daysPerWeek <= 3) baseSplit = predefinedSplits[3];
    else if (daysPerWeek === 4) baseSplit = predefinedSplits[2];
    else baseSplit = predefinedSplits[1]; // PPL
  } else if (goal === 'ausdauer') {
    if (daysPerWeek <= 3) baseSplit = predefinedSplits[3];
    else baseSplit = predefinedSplits[2];
  } else {
    // fitness (default)
    if (daysPerWeek <= 3) baseSplit = predefinedSplits[3];
    else if (daysPerWeek === 4) baseSplit = predefinedSplits[2];
    else baseSplit = predefinedSplits[1];
  }

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
