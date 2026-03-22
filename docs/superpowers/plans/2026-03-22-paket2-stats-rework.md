# Paket 2 — Stats Rework Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Stats tab into a motivating RPG-style character sheet — Week/Monat/Lifetime toggle, heatmap as timeline, an Athlete Score (0–1000), 5 dimension cards, demographic benchmarks, and lifetime impact numbers.

**Architecture:** Three layers of new code:
1. Pure utility functions (`utils/athleteScore.ts`, `utils/strengthStandards.ts`) — no React, fully testable
2. Minor type extensions (`types/user.ts`, `store/userStore.ts`) — add age/bodyWeight/lifetimeScore
3. Stats page rework (`app/(tabs)/stats/page.tsx`) — new toggle + 5 new UI sections

**Tech Stack:** Next.js 14, TypeScript strict, Zustand, date-fns, design tokens (`constants/tokens.ts`), CSS custom properties (`var(--xxx)`)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `utils/athleteScore.ts` | Create | Compute 5 dimension scores + weighted athlete score |
| `utils/strengthStandards.ts` | Create | Static ExRx percentile tables for benchmarks |
| `types/user.ts` | Modify | Add `age?: number; bodyWeight?: number` to `UserProfile` |
| `store/userStore.ts` | Modify | Add `lifetimeAthleteScore: number` + `updateLifetimeAthleteScore` action |
| `app/(tabs)/stats/page.tsx` | Modify | New `TimeRange` toggle, 5 new sections, heatmap lifetime mode |

---

## Task 1: Add Age + BodyWeight to UserProfile

The benchmark comparisons need the user's age and body weight (referenced in spec as "17 J." example). These aren't currently in the profile.

**Files:**
- Modify: `types/user.ts`
- Modify: `store/userStore.ts`
- Modify: `app/(onboarding)/goal.tsx` or `app/(tabs)/settings.tsx` — wherever profile is edited

- [ ] **Step 1: Extend `UserProfile` type**

In `types/user.ts`, add optional fields:

```typescript
export interface UserProfile {
  name?: string;
  goal: WorkoutGoal;
  level: TrainingLevel;
  trainingDays: TrainingDays;
  equipment: EquipmentType;
  weightUnit: 'kg' | 'lbs';
  createdAt: number;
  age?: number;          // years
  bodyWeight?: number;   // kg
}
```

- [ ] **Step 2: Add `lifetimeAthleteScore` to userStore**

In `store/userStore.ts`, add to `UserState` interface:

```typescript
lifetimeAthleteScore: number;  // 0–1000, never decreases
updateLifetimeAthleteScore: (score: number) => void;
```

Add to `initialState`:

```typescript
lifetimeAthleteScore: 0,
```

Add action:

```typescript
updateLifetimeAthleteScore: (score) =>
  set((state) => ({
    lifetimeAthleteScore: Math.max(state.lifetimeAthleteScore, score),
  })),
```

- [ ] **Step 3: Add age/weight inputs in Settings**

In `app/(tabs)/settings.tsx` (or wherever profile settings are shown), add two simple number inputs for age and body weight. Both optional — the benchmark section will gracefully skip comparisons if missing.

Read `app/(tabs)/settings.tsx` first to understand the existing input pattern, then add:
- A labeled number input for "Alter (Jahre)" → `updateProfile({ age: value })`
- A labeled number input for "Körpergewicht (kg)" → `updateProfile({ bodyWeight: value })`

- [ ] **Step 4: TypeScript check** — Run `npx tsc --noEmit`. Fix any errors.

- [ ] **Step 5: Commit**

```bash
git add types/user.ts store/userStore.ts app/(tabs)/settings.tsx
git commit -m "feat: user profile — add age, bodyWeight fields; lifetimeAthleteScore to store"
```

---

## Task 2: Utility — Athlete Score + 5 Dimensions

**Files:**
- Create: `utils/athleteScore.ts`

- [ ] **Step 1: Create `utils/athleteScore.ts`**

```typescript
import type { WorkoutSession } from '@/types/workout';
import { differenceInDays, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { estimateOneRepMax } from '@/utils/oneRepMax';

export interface DimensionScore {
  name: string;
  nameDE: string;
  score: number;   // 0–100
  detail: string;  // shown in info sheet
}

export interface AthleteScoreResult {
  total: number;        // 0–1000, weighted composite
  dimensions: DimensionScore[];
}

// ── STÄRKE (30%) ──────────────────────────────────────────────────────────────
// Best 1RM per major exercise relative to bodyweight, normalized to 100
// Benchmarks: Bankdrücken 1.0×BW = ~50, 1.5×BW = ~80, 2.0×BW = ~100
// Source: ExRx strength standards (novice/intermediate/advanced/elite)
const STRENGTH_BENCHMARKS: Record<string, { elite: number }> = {
  'bench-press':      { elite: 1.5 },  // ×bodyweight for 100-score
  'squat':            { elite: 2.0 },
  'deadlift':         { elite: 2.5 },
  'overhead-press':   { elite: 1.0 },
};

function scoreStrength(sessions: WorkoutSession[], bodyWeight: number): { score: number; detail: string } {
  if (bodyWeight <= 0 || sessions.length === 0) return { score: 0, detail: 'Kein Körpergewicht hinterlegt.' };

  const best1RM: Record<string, number> = {};
  for (const session of sessions) {
    for (const ex of session.exercises) {
      const id = ex.exercise?.id ?? '';
      if (!STRENGTH_BENCHMARKS[id]) continue;
      for (const set of ex.sets) {
        if (!set.isCompleted || !set.weight || !set.reps) continue;
        const orm = estimateOneRepMax(set.weight, set.reps);
        if (orm && orm > (best1RM[id] ?? 0)) best1RM[id] = orm;
      }
    }
  }

  const scores: number[] = [];
  let topExercise = '';
  let topRatio = 0;
  for (const [id, bench] of Object.entries(STRENGTH_BENCHMARKS)) {
    const orm = best1RM[id];
    if (!orm) continue;
    const ratio = orm / bodyWeight;
    const s = Math.min(100, Math.round((ratio / bench.elite) * 100));
    scores.push(s);
    if (ratio > topRatio) { topRatio = ratio; topExercise = id; }
  }
  if (scores.length === 0) return { score: 0, detail: 'Noch keine Hauptübungen mit Gewicht aufgezeichnet.' };

  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const detail = `Bestes relatives 1RM (${topExercise}): ${topRatio.toFixed(2)}× Körpergewicht.`;
  return { score: avg, detail };
}

// ── KONSISTENZ (25%) ─────────────────────────────────────────────────────────
// Training days in last 4 weeks vs. target (assume 3× per week = 12 sessions)
function scoreConsistency(sessions: WorkoutSession[]): { score: number; detail: string } {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const recent = sessions.filter(s => parseISO(s.date) >= cutoff);
  const target = 12; // 3× per week × 4 weeks
  const pct = Math.min(100, Math.round((recent.length / target) * 100));
  const detail = `${recent.length} Workouts in den letzten 4 Wochen (Ziel: ${target}).`;
  return { score: pct, detail };
}

// ── VOLUMEN (20%) ──────────────────────────────────────────────────────────────
// Total weekly volume vs. expected for training frequency
// Avg recreational lifter: ~10–15t/week. Advanced: 25–40t. Cap at 40t = 100.
function scoreVolume(sessions: WorkoutSession[]): { score: number; detail: string } {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const thisWeek = sessions.filter(s => {
    const d = parseISO(s.date);
    return d >= weekStart && d <= weekEnd;
  });
  const weekVol = thisWeek.reduce((sum, s) => sum + s.totalVolume, 0);
  const score = Math.min(100, Math.round((weekVol / 40000) * 100)); // 40t = 100
  const detail = `Wochenvolumen: ${(weekVol / 1000).toFixed(1)}t (Ziel für 100 Punkte: 40t).`;
  return { score, detail };
}

// ── AUSDAUER (15%) ────────────────────────────────────────────────────────────
// Average workout duration + cardio sessions in last 4 weeks
function scoreEndurance(sessions: WorkoutSession[]): { score: number; detail: string } {
  if (sessions.length === 0) return { score: 0, detail: 'Noch keine Workouts.' };
  const now = new Date();
  const cutoff = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const recent = sessions.filter(s => parseISO(s.date) >= cutoff);
  if (recent.length === 0) return { score: 0, detail: 'Keine Workouts in den letzten 4 Wochen.' };
  const avgDur = recent.reduce((sum, s) => sum + s.durationSeconds, 0) / recent.length / 60; // minutes
  // 45min avg = 75 score, 60min = 100
  const score = Math.min(100, Math.round((avgDur / 60) * 100));
  const detail = `Durchschnittliche Workout-Dauer: ${Math.round(avgDur)} min (60 min = 100 Punkte).`;
  return { score, detail };
}

// ── AUSGEWOGENHEIT (10%) ──────────────────────────────────────────────────────
// Push/Pull/Legs ratio in last 4 weeks. Perfect balance = 100.
const PUSH = new Set(['chest', 'shoulders', 'triceps']);
const PULL = new Set(['back', 'biceps', 'forearms']);
const LEGS = new Set(['legs', 'quads', 'hamstrings', 'glutes', 'calves']);

function scoreBalance(sessions: WorkoutSession[]): { score: number; detail: string } {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const recent = sessions.filter(s => parseISO(s.date) >= cutoff);
  let push = 0, pull = 0, legs = 0;
  for (const s of recent) {
    for (const ex of s.exercises) {
      const pm = ex.exercise?.primaryMuscle as string | undefined;
      if (!pm) continue;
      const done = ex.sets.filter(st => st.isCompleted).length;
      if (PUSH.has(pm)) push += done;
      else if (PULL.has(pm)) pull += done;
      else if (LEGS.has(pm)) legs += done;
    }
  }
  const total = push + pull + legs;
  if (total === 0) return { score: 0, detail: 'Noch keine Daten für Ausgewogenheit.' };
  // Ideal ratio: 35% Push, 35% Pull, 30% Legs
  const pushR = push / total;
  const pullR = pull / total;
  const legsR = legs / total;
  const deviation = (Math.abs(pushR - 0.35) + Math.abs(pullR - 0.35) + Math.abs(legsR - 0.30)) / 2;
  const score = Math.max(0, Math.round((1 - deviation) * 100));
  const detail = `Push/Pull/Legs: ${Math.round(pushR*100)}% / ${Math.round(pullR*100)}% / ${Math.round(legsR*100)}% (Ideal: 35/35/30).`;
  return { score, detail };
}

// ── COMPOSITE SCORE ───────────────────────────────────────────────────────────
export function computeAthleteScore(
  sessions: WorkoutSession[],
  bodyWeight: number = 0,
): AthleteScoreResult {
  const strength   = scoreStrength(sessions, bodyWeight);
  const consistency = scoreConsistency(sessions);
  const volume     = scoreVolume(sessions);
  const endurance  = scoreEndurance(sessions);
  const balance    = scoreBalance(sessions);

  const total = Math.round(
    strength.score   * 0.30 +
    consistency.score * 0.25 +
    volume.score     * 0.20 +
    endurance.score  * 0.15 +
    balance.score    * 0.10
  ) * 10; // scale 0–100 → 0–1000

  return {
    total,
    dimensions: [
      { name: 'Strength',     nameDE: 'Stärke',        score: strength.score,    detail: strength.detail },
      { name: 'Consistency',  nameDE: 'Konsistenz',    score: consistency.score, detail: consistency.detail },
      { name: 'Volume',       nameDE: 'Volumen',       score: volume.score,      detail: volume.detail },
      { name: 'Endurance',    nameDE: 'Ausdauer',      score: endurance.score,   detail: endurance.detail },
      { name: 'Balance',      nameDE: 'Ausgewogenheit', score: balance.score,    detail: balance.detail },
    ],
  };
}

export function athleteScoreLabel(score: number): string {
  if (score <= 200) return 'Einsteiger';
  if (score <= 400) return 'Aufsteiger';
  if (score <= 600) return 'Fortgeschrittener';
  if (score <= 800) return 'Athlet';
  if (score <= 950) return 'Elite';
  return 'Legende';
}
```

- [ ] **Step 2: TypeScript check** — Run `npx tsc --noEmit`. Fix any errors.

- [ ] **Step 3: Commit**

```bash
git add utils/athleteScore.ts
git commit -m "feat: athleteScore utility — 5-dimension composite score 0-1000"
```

---

## Task 3: Utility — Strength Standard Percentiles

**Files:**
- Create: `utils/strengthStandards.ts`

- [ ] **Step 1: Create `utils/strengthStandards.ts`**

Static percentile data based on ExRx strength standards. Returns percentile for a given 1RM + bodyWeight combination.

```typescript
// Static strength percentile tables — source: ExRx.net strength standards
// Bodyweight multipliers for 5th, 25th, 50th, 75th, 90th percentile
// Averaged across age groups 16-30 (male)

export interface StrengthPercentileResult {
  exercise: string;
  exerciseDE: string;
  orm: number;
  bodyWeight: number;
  percentile: number;   // 0–99
  label: string;        // e.g. "übertrifft ~68% der Männer deiner Altersgruppe"
}

// Each row: [p5, p25, p50, p75, p90] as ×bodyweight multipliers
const STANDARDS: Record<string, { nameDE: string; multipliers: [number, number, number, number, number] }> = {
  'bench-press':    { nameDE: 'Bankdrücken',    multipliers: [0.50, 0.75, 1.00, 1.25, 1.50] },
  'squat':          { nameDE: 'Kniebeugen',     multipliers: [0.65, 0.90, 1.25, 1.60, 2.00] },
  'deadlift':       { nameDE: 'Kreuzheben',     multipliers: [0.75, 1.10, 1.50, 1.90, 2.40] },
  'overhead-press': { nameDE: 'Schulterdrücken', multipliers: [0.30, 0.50, 0.65, 0.85, 1.05] },
};

function interpolatePercentile(ratio: number, multipliers: [number, number, number, number, number]): number {
  const breakpoints = [5, 25, 50, 75, 90];
  if (ratio <= multipliers[0]) return Math.round(ratio / multipliers[0] * 5);
  for (let i = 0; i < multipliers.length - 1; i++) {
    if (ratio <= multipliers[i + 1]) {
      const t = (ratio - multipliers[i]) / (multipliers[i + 1] - multipliers[i]);
      return Math.round(breakpoints[i] + t * (breakpoints[i + 1] - breakpoints[i]));
    }
  }
  return Math.min(99, 90 + Math.round((ratio - multipliers[4]) / multipliers[4] * 9));
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
    results.push({
      exercise: id,
      exerciseDE: std.nameDE,
      orm,
      bodyWeight,
      percentile,
      label: `Dein ${std.nameDE} (${orm} kg) übertrifft ~${percentile}% der Trainierenden deiner Altersgruppe`,
    });
  }
  return results;
}
```

- [ ] **Step 2: TypeScript check** — Run `npx tsc --noEmit`. Fix any errors.

- [ ] **Step 3: Commit**

```bash
git add utils/strengthStandards.ts
git commit -m "feat: strengthStandards — static ExRx percentile tables for benchmark comparisons"
```

---

## Task 4: Stats Page — Toggle + Heatmap Lifetime Mode

Replace the old `Period` selector (thisWeek/lastWeek/thisMonth/lastMonth) with a clean 3-way `TimeRange` toggle. Heatmap responds to the toggle.

**Files:**
- Modify: `app/(tabs)/stats/page.tsx`

**Note:** Do Paket 1 Tasks 2+3 before this task (they also modify stats/page.tsx). This task assumes those are already committed.

- [ ] **Step 1: Change `Period` type to `TimeRange`**

Near the top of `app/(tabs)/stats/page.tsx`, replace:

```typescript
type Period = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth';

const PERIOD_LABELS: Record<Period, string> = { ... };

function getPeriodRange(period: Period): ...
```

With:

```typescript
type TimeRange = 'week' | 'month' | 'lifetime';

function getPeriodRange(range: TimeRange, allSessions: WorkoutSession[]): { start: Date; end: Date; sessions: WorkoutSession[] } {
  const now = new Date();
  if (range === 'week') {
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    return { start, end, sessions: allSessions.filter(s => { const d = parseISO(s.date); return d >= start && d <= end; }) };
  }
  if (range === 'month') {
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return { start, end, sessions: allSessions.filter(s => { const d = parseISO(s.date); return d >= start && d <= end; }) };
  }
  // lifetime
  return { start: new Date(0), end: now, sessions: allSessions };
}
```

Add import for `WorkoutSession` type at the top if not already imported:
```typescript
import type { WorkoutSession } from '@/types/workout';
```

- [ ] **Step 2: Update state and derived values**

Change the `useState` call:

```typescript
const [timeRange, setTimeRange] = useState<TimeRange>('week');
```

Update the `periodSessions` derivation:

```typescript
const { start, end, sessions: periodSessions } = useMemo(
  () => getPeriodRange(timeRange, sessions),
  [timeRange, sessions],
);
```

Update `muscleSets` — it's already derived from `periodSessions` so it automatically becomes lifetime-aware.

- [ ] **Step 3: Replace period selector UI with toggle**

Find the existing period selector JSX (buttons for "Diese Woche", "Letzte Woche", etc.) and replace with:

```tsx
{/* ── TIME RANGE TOGGLE ── */}
<div style={{
  display: 'flex', gap: '4px',
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: '10px', padding: '3px',
  marginBottom: spacing[4],
}}>
  {(['week', 'month', 'lifetime'] as const).map(r => (
    <button
      key={r}
      onClick={() => setTimeRange(r)}
      style={{
        flex: 1, padding: '7px 0',
        borderRadius: '7px', border: 'none', cursor: 'pointer',
        background: timeRange === r ? 'var(--accent)' : 'transparent',
        color: timeRange === r ? '#080808' : 'var(--text-muted)',
        fontSize: '13px', fontWeight: 600,
        fontFamily: 'var(--font-manrope)',
        transition: 'all 0.15s ease',
      }}
    >
      {r === 'week' ? 'Woche' : r === 'month' ? 'Monat' : 'Lebenszeit'}
    </button>
  ))}
</div>
```

- [ ] **Step 4: Remove unused imports**

After changing Period → TimeRange, check if `subWeeks`, `subMonths`, `addWeeks`, `lastWeek`, `lastMonth` references remain. Remove unused imports from `date-fns`.

- [ ] **Step 5: TypeScript check** — Run `npx tsc --noEmit`. Fix any errors.

- [ ] **Step 6: Verify**

Open Stats tab. Toggle should show "Woche / Monat / Lebenszeit". Numbers should change. Heatmap should update — Lebenszeit shows all-time volume distribution.

- [ ] **Step 7: Commit**

```bash
git add app/(tabs)/stats/page.tsx
git commit -m "feat: stats — Week/Monat/Lebenszeit toggle, heatmap as timeline"
```

---

## Task 5: Stats Page — Athlete Score + 5 Dimensions

Add the score headline and 5 dimension cards below the toggle. The total score is the lifetime max (never decreases).

**Files:**
- Modify: `app/(tabs)/stats/page.tsx`

- [ ] **Step 1: Import new utilities**

At the top of `app/(tabs)/stats/page.tsx`, add:

```typescript
import { computeAthleteScore, athleteScoreLabel } from '@/utils/athleteScore';
import { useUserStore } from '@/store/userStore';
```

- [ ] **Step 2: Compute score in component**

After the existing derived values, add:

```typescript
const profile = useUserStore(s => s.profile);
const lifetimeAthleteScore = useUserStore(s => s.lifetimeAthleteScore);
const updateLifetimeAthleteScore = useUserStore(s => s.updateLifetimeAthleteScore);

const athleteResult = useMemo(
  () => computeAthleteScore(sessions, profile?.bodyWeight ?? 0),
  [sessions, profile?.bodyWeight],
);

// Persist lifetime best score
useMemo(() => {
  if (athleteResult.total > 0) updateLifetimeAthleteScore(athleteResult.total);
}, [athleteResult.total]);

const displayScore = Math.max(lifetimeAthleteScore, athleteResult.total);
```

**Note:** `useMemo` is used as a lightweight side-effect here for simplicity. If the linter flags it, replace with a `useEffect`.

- [ ] **Step 3: Add Athlete Score headline section**

Insert before the "3 Key Metrics" grid:

```tsx
{/* ── ATHLETE SCORE ── */}
<div style={{
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: '14px', padding: '20px',
  textAlign: 'center', marginBottom: spacing[4],
}}>
  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-barlow)', marginBottom: '8px' }}>
    Athleten-Score
  </p>
  <p style={{ fontSize: '64px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-barlow)', lineHeight: 1, margin: 0 }}>
    {displayScore}
  </p>
  <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-manrope)', marginTop: '4px' }}>
    {athleteScoreLabel(displayScore)}
  </p>
  {athleteResult.total !== displayScore && (
    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
      Aktuell: {athleteResult.total} · Rekord: {displayScore}
    </p>
  )}
</div>
```

- [ ] **Step 4: Add 5 Dimension Cards**

After the Athlete Score section, add the dimension grid:

```tsx
{/* ── 5 DIMENSIONS ── */}
<div style={{ marginBottom: spacing[4] }}>
  <h2 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', fontFamily: 'var(--font-barlow)' }}>
    Dimensionen
  </h2>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
    {athleteResult.dimensions.map(dim => (
      <div key={dim.name} style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '12px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-manrope)' }}>
            {dim.nameDE}
          </span>
          <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-barlow)', lineHeight: 1 }}>
            {dim.score}
          </span>
        </div>
        <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${dim.score}%`,
            background: 'var(--accent)', borderRadius: '2px',
          }} />
        </div>
        <p style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '6px', fontFamily: 'var(--font-manrope)', lineHeight: 1.4 }}>
          {dim.detail}
        </p>
      </div>
    ))}
  </div>
</div>
```

The 5th dimension card spans full width (2+2+1 grid). Wrap the last card with a `gridColumn: 'span 2'` check:

```tsx
style={{
  ...existingStyle,
  ...(index === 4 ? { gridColumn: 'span 2' } : {}),
}}
```

Add `index` to the `.map` callback: `.map((dim, index) => ...)`

- [ ] **Step 5: TypeScript check** — Run `npx tsc --noEmit`. Fix any errors.

- [ ] **Step 6: Commit**

```bash
git add app/(tabs)/stats/page.tsx
git commit -m "feat: stats — athlete score 0-1000 + 5 dimension cards"
```

---

## Task 6: Stats Page — Benchmarks Section

Static percentile comparisons based on ExRx strength standards. Shown below the dimensions.

**Files:**
- Modify: `app/(tabs)/stats/page.tsx`

- [ ] **Step 1: Import strengthStandards utility and compute best 1RMs**

```typescript
import { computeStrengthPercentiles } from '@/utils/strengthStandards';
```

Compute in the component:

```typescript
const bestOrmByExercise = useMemo(() => {
  const best: Record<string, number> = {};
  for (const session of sessions) {
    for (const ex of session.exercises) {
      const id = ex.exercise?.id ?? '';
      if (!id) continue;
      for (const set of ex.sets) {
        if (!set.isCompleted || !set.weight || !set.reps) continue;
        const orm = estimateOneRepMax(set.weight, set.reps);
        if (orm && orm > (best[id] ?? 0)) best[id] = orm;
      }
    }
  }
  return best;
}, [sessions]);

import { estimateOneRepMax } from '@/utils/oneRepMax';

const strengthPercentiles = useMemo(
  () => computeStrengthPercentiles(bestOrmByExercise, profile?.bodyWeight ?? 0),
  [bestOrmByExercise, profile?.bodyWeight],
);
```

(Move the `import` to the top of the file.)

- [ ] **Step 2: Add Benchmarks section JSX**

After the 5 Dimensions section:

```tsx
{/* ── BENCHMARKS ── */}
{(strengthPercentiles.length > 0 || sessions.length >= 3) && (
  <div style={{ marginBottom: spacing[4] }}>
    <h2 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', fontFamily: 'var(--font-barlow)' }}>
      Vergleiche
    </h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

      {/* Strength percentiles — one card per exercise */}
      {strengthPercentiles.map(p => (
        <div key={p.exercise} style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '12px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-manrope)', margin: 0 }}>
              {p.exerciseDE}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-manrope)', margin: '2px 0 0' }}>
              {p.orm} kg · Top {100 - p.percentile}%
            </p>
          </div>
          <span style={{
            fontSize: '22px', fontWeight: 800, color: 'var(--accent)',
            fontFamily: 'var(--font-barlow)', lineHeight: 1,
          }}>
            ~{p.percentile}%
          </span>
        </div>
      ))}

      {/* Frequency benchmark — hardcoded percentile curve */}
      {(() => {
        const now = new Date();
        const cutoff = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
        const recentCount = sessions.filter(s => parseISO(s.date) >= cutoff).length;
        const perWeek = Math.round((recentCount / 4) * 10) / 10;
        // Approx: 1×/week = 30th percentile, 3× = 71th, 5× = 90th
        const freqPct = Math.min(95, Math.round(perWeek * 20 + 10));
        if (recentCount < 2) return null;
        return (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '12px 14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-manrope)', margin: 0 }}>
                Trainingsfrequenz
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-manrope)', margin: '2px 0 0' }}>
                Du trainierst {perWeek}× pro Woche
              </p>
            </div>
            <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-barlow)', lineHeight: 1 }}>
              ~{freqPct}%
            </span>
          </div>
        );
      })()}

      {/* No profile message if body weight missing */}
      {!profile?.bodyWeight && strengthPercentiles.length === 0 && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-manrope)', textAlign: 'center', padding: '12px' }}>
          Trage dein Körpergewicht in den Einstellungen ein, um Kraftvergleiche zu sehen.
        </p>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 3: TypeScript check** — Run `npx tsc --noEmit`. Fix any errors.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/stats/page.tsx
git commit -m "feat: stats — demographic strength benchmarks + frequency percentile"
```

---

## Task 7: Stats Page — Lifetime Numbers Section

Show total impact numbers in "Lebenszeit" mode only.

**Files:**
- Modify: `app/(tabs)/stats/page.tsx`

- [ ] **Step 1: Compute lifetime numbers**

These already exist in the file as `totalWorkouts`, `totalDurH`. Add lifetime volume:

```typescript
const totalVolumeTons = sessions.reduce((sum, s) => sum + s.totalVolume, 0) / 1000;
```

(It may already exist — search for `totalVolume` usages first to avoid duplication.)

- [ ] **Step 2: Add Lifetime Stats section**

Only show when `timeRange === 'lifetime'`. Insert after benchmarks section:

```tsx
{/* ── LIFETIME STATS ── */}
{timeRange === 'lifetime' && (
  <div style={{ marginBottom: spacing[4] }}>
    <h2 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', fontFamily: 'var(--font-barlow)' }}>
      Lebenszeit
    </h2>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
        <p style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-barlow)', margin: 0 }}>
          {totalVolumeTons.toFixed(1)}t
        </p>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-manrope)', marginTop: '4px' }}>Bewegt</p>
      </div>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
        <p style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-barlow)', margin: 0 }}>
          {totalWorkouts}
        </p>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-manrope)', marginTop: '4px' }}>Sessions</p>
      </div>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
        <p style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-barlow)', margin: 0 }}>
          {totalDurH}h
        </p>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-manrope)', marginTop: '4px' }}>Trainiert</p>
      </div>
    </div>
    {/* Fun fact */}
    {totalVolumeTons > 0 && (
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-manrope)', textAlign: 'center', fontStyle: 'italic' }}>
        Du hast {(totalVolumeTons / 7300 * 100).toFixed(1)}% des Eiffelturms gehoben (7.300 Tonnen).
      </p>
    )}
  </div>
)}
```

- [ ] **Step 3: TypeScript check** — Run `npx tsc --noEmit`. Fix any errors.

- [ ] **Step 4: Visual check**

Switch to Lebenszeit mode. The three big numbers should appear. If volume > 7300t the fun fact will show "100%+" which is a fun edge case — no need to handle it.

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/stats/page.tsx
git commit -m "feat: stats — lifetime impact numbers (Tonnen, Sessions, Stunden)"
```

---

## Execution Order

```
Task 1  →  Task 2  →  Task 3  →  Task 4  →  Task 5  →  Task 6  →  Task 7
(Types)    (Score)    (Bench)    (Toggle)   (UI:Scr)   (UI:Ben)   (UI:Life)
```

Tasks 1–3 are pure utilities (no UI) and can be done first. Tasks 4–7 all touch `stats/page.tsx` — do them in order and run `npx tsc --noEmit` after each.

**Note:** Do Paket 1 (Tasks 2+3 of that plan) before starting Task 4 here, since both touch `stats/page.tsx`.
