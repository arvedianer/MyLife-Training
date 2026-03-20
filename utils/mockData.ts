import { useHistoryStore } from '@/store/historyStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { exercises } from '@/constants/exercises';
import type { WorkoutSession, WorkoutExercise, SetEntry } from '@/types/workout';

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function loadMockData() {
    const sessions: WorkoutSession[] = [];
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    // 3 Monats-Zeitraum: 90 Tage. Wir trainieren jeden 2. Tag.
    const totalDays = 90;

    // Splits: Push, Pull, Legs
    const pushExercises = ['bench-press', 'incline-bench-press', 'overhead-press', 'lateral-raise', 'tricep-pushdown'];
    const pullExercises = ['deadlift', 'pull-up', 'barbell-row', 'face-pull', 'barbell-curl'];
    const legsExercises = ['squat', 'leg-press', 'romanian-deadlift', 'leg-extension', 'leg-curl'];

    const splits = [
        { name: 'Push', ids: pushExercises },
        { name: 'Pull', ids: pullExercises },
        { name: 'Legs', ids: legsExercises },
    ];

    let splitIndex = 0;

    // Progressions-Basisgewichte
    const baseWeights: Record<string, number> = {
        'bench-press': 40,
        'incline-bench-press': 30,
        'overhead-press': 25,
        'lateral-raise': 6,
        'tricep-pushdown': 15,
        'deadlift': 60,
        'pull-up': 0,
        'barbell-row': 40,
        'face-pull': 10,
        'barbell-curl': 15,
        'squat': 50,
        'leg-press': 80,
        'romanian-deadlift': 50,
        'leg-extension': 30,
        'leg-curl': 25,
    };

    // Rückwärts iterieren, um Vergangenheit aufzubauen (älteste bis heute)
    for (let i = totalDays; i >= 0; i -= 2) {
        const split = splits[splitIndex % 3];
        splitIndex++;

        // Simuliertes Datum
        const sessionDate = now - (i * dayInMs);
        const durationMs = (45 + Math.random() * 30) * 60 * 1000; // 45-75 mins

        // Progression: Je neuer die Session, desto mehr Gewicht (+1kg bis +2.5kg pro Woche)
        const weeksPassed = Math.floor((totalDays - i) / 7);

        const sessionExercises: WorkoutExercise[] = [];

        for (const exId of split.ids) {
            const ex = exercises.find(e => e.id === exId);
            if (!ex) continue;

            const isBodyweight = ex.equipment.includes('bodyweight');
            const baseWeight = baseWeights[exId] || 10;

            // Simuliertes Gewicht mit Progression
            const currentWeight = isBodyweight ? 0 : baseWeight + (weeksPassed * (baseWeight > 40 ? 2.5 : 1));

            const sets: SetEntry[] = [];
            const numSets = 3;
            for (let s = 0; s < numSets; s++) {
                // Leichte Variation in Wiederholungen
                const reps = 8 + Math.floor(Math.random() * 3) - (s === numSets - 1 ? 1 : 0);
                sets.push({
                    id: generateId(),
                    weight: Math.round(currentWeight * 2) / 2, // Round to 0.5
                    reps,
                    isCompleted: true,
                    isPR: false, // PR is not perfectly simulated here but charts will show progression
                });
            }

            sessionExercises.push({
                id: generateId(),
                exercise: ex,
                sets,
                isUnilateral: false,
                unilateralSync: false,
            });
        }

        // Volumen berechnen
        const totalVolume = sessionExercises.reduce((sum, e) => {
            return sum + e.sets.reduce((setSum, set) => setSum + (set.weight * set.reps), 0);
        }, 0);

        const totalSets = sessionExercises.reduce((sum, e) => sum + e.sets.length, 0);

        sessions.push({
            id: generateId(),
            date: new Date(sessionDate).toISOString(),
            startedAt: sessionDate,
            finishedAt: sessionDate + durationMs,
            durationSeconds: Math.floor(durationMs / 1000),
            exercises: sessionExercises,
            totalVolume,
            totalSets,
            newPRs: [],
            splitName: split.name,
        });
    }

    // Sort them so the newest is at the end or beginning?
    // Our history store expects them in any order, they are sorted before display. But let's push them oldest first, so newest is last, or newest first.
    // wait, the app usually pushes NEWEST to the END of the array `[...state.sessions, newSession]` but `HistoryView` sorts them descending anyway.

    useHistoryStore.setState({ sessions });
}
