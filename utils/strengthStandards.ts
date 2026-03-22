// Static strength percentile tables — source: ExRx.net strength standards
// Bodyweight multipliers for 5th, 25th, 50th, 75th, 90th percentile
// Averaged across age groups 16–30 (male)

export interface StrengthPercentileResult {
  exercise: string;
  exerciseDE: string;
  orm: number;
  bodyWeight: number;
  percentile: number;   // 0–99
}

// Each row: [p5, p25, p50, p75, p90] as ×bodyweight multipliers
const STANDARDS: Record<string, {
  nameDE: string;
  multipliers: [number, number, number, number, number];
}> = {
  'bench-press':    { nameDE: 'Bankdrücken',     multipliers: [0.50, 0.75, 1.00, 1.25, 1.50] },
  'squat':          { nameDE: 'Kniebeugen',      multipliers: [0.65, 0.90, 1.25, 1.60, 2.00] },
  'deadlift':       { nameDE: 'Kreuzheben',      multipliers: [0.75, 1.10, 1.50, 1.90, 2.40] },
  'overhead-press': { nameDE: 'Schulterdrücken', multipliers: [0.30, 0.50, 0.65, 0.85, 1.05] },
};

const BREAKPOINTS = [5, 25, 50, 75, 90] as const;

function interpolatePercentile(
  ratio: number,
  multipliers: [number, number, number, number, number],
): number {
  // Below p5
  if (ratio <= multipliers[0]) {
    return Math.round((ratio / multipliers[0]) * BREAKPOINTS[0]);
  }
  // Between breakpoints
  for (let i = 0; i < multipliers.length - 1; i++) {
    if (ratio <= multipliers[i + 1]) {
      const t = (ratio - multipliers[i]) / (multipliers[i + 1] - multipliers[i]);
      return Math.round(BREAKPOINTS[i] + t * (BREAKPOINTS[i + 1] - BREAKPOINTS[i]));
    }
  }
  // Above p90 — extrapolate up to 99
  const excess = (ratio - multipliers[4]) / multipliers[4];
  return Math.min(99, 90 + Math.round(excess * 9));
}

export function computeStrengthPercentiles(
  bestOneRepMaxByExercise: Record<string, number>,
  bodyWeight: number,
): StrengthPercentileResult[] {
  if (bodyWeight <= 0) return [];

  const results: StrengthPercentileResult[] = [];
  for (const [id, std] of Object.entries(STANDARDS)) {
    const orm = bestOneRepMaxByExercise[id];
    if (!orm) continue;
    const ratio = orm / bodyWeight;
    const percentile = interpolatePercentile(ratio, std.multipliers);
    results.push({ exercise: id, exerciseDE: std.nameDE, orm, bodyWeight, percentile });
  }
  return results;
}
