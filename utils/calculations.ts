/**
 * Berechnet das kalkulierte One Rep Max (1RM) basierend auf der Brzycki-Formel.
 * Die Brzycki-Formel lautet: 1RM = weight * (36 / (37 - reps))
 * 
 * @param weight Das verwendete Gewicht
 * @param reps Die Anzahl der Wiederholungen (gültig normalerweise zwischen 1 und 10-12 für höchste Genauigkeit)
 * @returns Das errechnete 1RM.
 */
export function calculate1RMBrzycki(weight: number, reps: number): number {
    if (reps === 0 || weight === 0) return 0;
    if (reps === 1) return weight;

    // Brzycki Formel
    const estimated1RM = weight * (36 / (37 - reps));

    // Auf 1 Nachkommastelle runden für saubere UI (oder ganze Zahlen)
    return Math.round(estimated1RM * 10) / 10;
}
