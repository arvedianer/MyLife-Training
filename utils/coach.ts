import type { WorkoutSession } from '@/types/workout';

export function generateCoachInsight(session: WorkoutSession): string {
    if (session.newPRs.length > 2) {
        return "Wahnsinn! Du reißt heute alles ab. So viele neue PRs zeigen, dass dein Plan voll aufgeht. Bleib genau so dran!";
    }
    if (session.newPRs.length > 0) {
        return "Starkes Workout! Ein neuer Personal Record ist der beste Beweis für deinen Fortschritt. Gönn dir die Pause, du hast sie verdient.";
    }
    if (session.totalSets >= 20) {
        return "Ein echtes Volumen-Monster! Du hast heute massiv abgeliefert. Die Muskeln brennen, das Wachstum beginnt im Schlaf.";
    }
    if (session.totalSets < 8) {
        return "Sanfter Einstieg oder Deload? Manchmal braucht der Körper etwas Pause, um beim nächsten Mal wieder Vollgas zu geben.";
    }
    if (session.durationSeconds < 1800) { // < 30 mins
        return "Kurz und knackig! Intensität schlägt oft Volumen. Gutes Zeitmanagement und starker Fokus.";
    }
    if (session.durationSeconds > 5400) { // > 1.5 hours
        return "Was für eine Marathon-Einheit! Du zeigst absolute Disziplin. Denk daran, danach die Speicher gut aufzufüllen!";
    }
    if (session.totalVolume > 10000) {
        return "Über 10 Tonnen bewegtes Gewicht! Das ist eine unglaubliche Leistung. Dein zentrales Nervensystem hat sich jetzt Ruhe verdient.";
    }

    // Default
    return "Solides Training heute! Jeder saubere Satz bringt dich deinem langfristigen Ziel ein Stück näher. Vertrau dem Prozess.";
}
