# MyLife Training App V4 — Masterplan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix critical bugs in the active workout settings panel, add unilateral L/R support, rework the workout score system, improve the heatmap, enhance stats, add more exercises, and implement auto-rest-day streak protection.

**Architecture:** Bug-first approach — fix broken interactions first (settings panel, score logic), then enhance UX (heatmap, stats, auto rest day). All changes are incremental; no new packages needed.

**Tech Stack:** Next.js 14, TypeScript strict, Zustand, CSS Modules, lucide-react, Recharts, date-fns

---

## Chunk 1: Active Workout — Fix Settings Panel + Unilateral L/R

### Task 1: Fix Exercise Settings Panel (Critical Bug)

**Root cause:** `onUpdateExercise` prop is never passed to `SortableExerciseCard` in `app/workout/active/page.tsx`. All settings changes (equipment, gym, warmup, rep range, notes) silently fail because the optional `?.` call on `undefined` is a no-op.

**Files:**
- Modify: `store/workoutStore.ts` — add `updateWorkoutExercise` action
- Modify: `app/workout/active/page.tsx` — pass `onUpdateExercise` prop

- [ ] **Step 1: Add `updateWorkoutExercise` to workoutStore**

Open `store/workoutStore.ts`. After the `toggleUnilateral` entry in the interface (line ~40), add:

```typescript
updateWorkoutExercise: (exerciseId: string, updates: Partial<WorkoutExercise>) => void;
```

In the implementation (find the `toggleUnilateral:` implementation, add after it):

```typescript
updateWorkoutExercise: (exerciseId, updates) => set((state) => {
  if (!state.activeWorkout) return state;
  return {
    activeWorkout: {
      ...state.activeWorkout,
      exercises: state.activeWorkout.exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, ...updates } : ex
      ),
    },
  };
}),
```

- [ ] **Step 2: Pass `onUpdateExercise` in active/page.tsx**

In `app/workout/active/page.tsx`, find the `<SortableExerciseCard` usage (line ~519). Add one prop:

```tsx
onUpdateExercise={(updates) => updateWorkoutExercise(workoutExercise.id, updates)}
```

Also destructure `updateWorkoutExercise` from `useWorkoutStore()` at the top of the component.

- [ ] **Step 3: Verify TypeScript + build**

```bash
npx tsc --noEmit
npm run build
```

Expected: 0 errors, 33 pages built.

- [ ] **Step 4: Commit**

```bash
git add store/workoutStore.ts app/workout/active/page.tsx
git commit -m "fix: pass onUpdateExercise to SortableExerciseCard — settings panel now works"
```

---

### Task 2: Unilateral L/R — Split Set Row into Left/Right

**What:** When `workoutExercise.isUnilateral === true`, each set row shows two weight inputs side by side: **L** and **R**, instead of one shared weight. Sets get `weightL` and `weightR` fields.

**Files:**
- Modify: `types/workout.ts` — add `weightL?: number; weightR?: number` to `SetEntry`
- Modify: `components/workout/SetRow.tsx` — split display when unilateral
- Modify: `components/workout/SetRow.module.css` — L/R layout

- [ ] **Step 1: Read current `SetEntry` type**

Read `types/workout.ts` — find `SetEntry` interface to see current fields.

- [ ] **Step 2: Add L/R fields to SetEntry**

In `types/workout.ts`, add to `SetEntry`:

```typescript
weightL?: number; // unilateral left weight
weightR?: number; // unilateral right weight
```

- [ ] **Step 3: Modify SetRow to support L/R**

In `components/workout/SetRow.tsx`, read the current weight input. The component receives `set: SetEntry` and `isUnilateral?: boolean` prop (check if it already receives this; if not, add it).

When `isUnilateral` is true, replace the single weight input with:

```tsx
{isUnilateral ? (
  <div className={styles.unilateralInputs}>
    <div className={styles.sideInput}>
      <span className={styles.sideLabel}>L</span>
      <input
        type="number"
        value={set.weightL ?? set.weight}
        onChange={(e) => onUpdate({ weightL: Number(e.target.value) })}
        className={styles.weightInput}
        step={0.5}
      />
    </div>
    <div className={styles.sideInput}>
      <span className={styles.sideLabel}>R</span>
      <input
        type="number"
        value={set.weightR ?? set.weight}
        onChange={(e) => onUpdate({ weightR: Number(e.target.value) })}
        className={styles.weightInput}
        step={0.5}
      />
    </div>
  </div>
) : (
  /* existing single weight input */
)}
```

- [ ] **Step 4: Add CSS for L/R layout**

In `components/workout/SetRow.module.css`, add:

```css
.unilateralInputs {
  display: flex;
  gap: 8px;
  flex: 1;
}

.sideInput {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.sideLabel {
  font-family: var(--font-courier);
  font-size: 11px;
  font-weight: 700;
  color: var(--accent);
  width: 12px;
  flex-shrink: 0;
}
```

- [ ] **Step 5: Pass `isUnilateral` from ExerciseCard to SetRow**

Check `components/workout/ExerciseCard.tsx` — find where `<SetRow` is rendered. Pass `isUnilateral={workoutExercise.isUnilateral}` to it.

- [ ] **Step 6: TypeScript + build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add types/workout.ts components/workout/SetRow.tsx components/workout/SetRow.module.css components/workout/ExerciseCard.tsx
git commit -m "feat: unilateral L/R weight inputs in SetRow"
```

---

## Chunk 2: Workout Summary — Smarter Score + Session Heatmap

### Task 3: Rework Workout Score

**Problems with current score:**
1. "Dauer: 100" — meaningless 100/100 just because workout lasted > 30 min
2. Muskelabdeckung counts against a good workout — wrong (coverage is a PLAN issue, not session quality)
3. Intensity is opaque — how is it derived?

**New score logic (replace `calculateWorkoutScore` in `utils/workoutScore.ts` or wherever it lives):**

Score = weighted average of:
- **Volumen** (40%): actual volume vs personal average for same exercises. >avg = 100, 50% of avg = 50.
- **Abschlussrate** (35%): completed sets / planned sets × 100. Simple and clear.
- **Intensität** (25%): avg weight this session / avg weight last 4 sessions for same exercises. >105% = 100, <80% = 20.

Remove Muskelabdeckung from score entirely. Show it separately as info, not as a penalty.

**Files:**
- Find score utility: `grep -rn "calculateWorkoutScore" utils/` to locate the file
- Modify: wherever `calculateWorkoutScore` is defined
- Modify: `app/workout/summary/page.tsx` — update score display labels

- [ ] **Step 1: Find the score calculation file**

```bash
grep -rn "calculateWorkoutScore\|workoutScore\|WorkoutScore" utils/ --include="*.ts"
```

Read that file.

- [ ] **Step 2: Rewrite the score function**

Replace the body of `calculateWorkoutScore` with the new 3-metric system. Keep the return type compatible (or update callers).

New return type:
```typescript
interface WorkoutScore {
  total: number;        // 0-100
  volume: number;       // 0-100
  completionRate: number; // 0-100
  intensity: number;    // 0-100
  label: string;        // "Stark" | "Gut" | "Ok" | "Leicht"
}
```

Logic:
```typescript
export function calculateWorkoutScore(
  session: WorkoutSession,
  previousSessions: WorkoutSession[]
): WorkoutScore {
  const completedSets = session.exercises.flatMap(e => e.sets.filter(s => s.isCompleted));
  const plannedSets = session.exercises.flatMap(e => e.sets);

  const completionRate = plannedSets.length > 0
    ? Math.round((completedSets.length / plannedSets.length) * 100)
    : 100;

  // Volume vs personal avg
  const sessionVolume = completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
  const prevVolumes = previousSessions.slice(0, 8).map(ps =>
    ps.exercises.flatMap(e => e.sets.filter(s => s.isCompleted))
      .reduce((sum, s) => sum + (s.weight * s.reps), 0)
  ).filter(v => v > 0);
  const avgVolume = prevVolumes.length > 0 ? prevVolumes.reduce((a, b) => a + b, 0) / prevVolumes.length : sessionVolume;
  const volumeScore = Math.min(100, Math.round((sessionVolume / Math.max(avgVolume, 1)) * 80));

  // Intensity: avg weight this session vs avg weight previous sessions
  const avgWeightNow = completedSets.length > 0
    ? completedSets.reduce((sum, s) => sum + s.weight, 0) / completedSets.length : 0;
  const prevAvgWeights = previousSessions.slice(0, 4).map(ps =>
    ps.exercises.flatMap(e => e.sets.filter(s => s.isCompleted))
  ).flat();
  const avgWeightPrev = prevAvgWeights.length > 0
    ? prevAvgWeights.reduce((sum, s) => sum + s.weight, 0) / prevAvgWeights.length : avgWeightNow;
  const intensityScore = avgWeightPrev > 0
    ? Math.min(100, Math.round((avgWeightNow / avgWeightPrev) * 90))
    : 80;

  const total = Math.round(volumeScore * 0.4 + completionRate * 0.35 + intensityScore * 0.25);

  const label = total >= 85 ? 'Stark 💪' : total >= 70 ? 'Gut' : total >= 50 ? 'Ok' : 'Leicht';

  return { total, volume: volumeScore, completionRate, intensity: intensityScore, label };
}
```

- [ ] **Step 3: Update summary page display**

In `app/workout/summary/page.tsx`:
- Replace the 5-metric score breakdown with the 3 new metrics (Volumen, Abschlussrate, Intensität)
- Remove "Muskelabdeckung" from the score bars
- Update the score call to use the new signature (remove goal/plannedMuscles params if they were there)
- Show Muskelabdeckung separately as an info line, not a score component

- [ ] **Step 4: TypeScript + build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: rework workout score — volume/completion/intensity, remove muscle coverage penalty"
```

---

### Task 4: Session Heatmap in Workout Summary

**What:** Show `<BodyHeatmap>` in workout summary, but only reflecting the muscles trained in THIS session.

**Files:**
- Modify: `app/workout/summary/page.tsx` — add heatmap section
- Read: `utils/muscleCoverage.ts` — understand `calculateMuscleSets` helper

- [ ] **Step 1: Calculate session-specific muscle sets**

In `app/workout/summary/page.tsx`, after loading the session, compute:

```typescript
import { calculateMuscleSets } from '@/utils/muscleCoverage';
import { BodyHeatmap } from '@/components/ui/BodyHeatmap';

// In component:
const sessionMuscleSets = useMemo(() => {
  if (!session) return {};
  return calculateMuscleSets([session]); // single session
}, [session]);

const maxSessionSets = Math.max(...Object.values(sessionMuscleSets), 1);
```

Check if `calculateMuscleSets` accepts an array of sessions — read `utils/muscleCoverage.ts` first to confirm the signature.

- [ ] **Step 2: Add heatmap section to summary page**

After the score card and before the exercise list, add:

```tsx
{Object.keys(sessionMuscleSets).length > 0 && (
  <section className={styles.heatmapSection}>
    <h3 className={styles.sectionTitle}>Trainierte Muskeln</h3>
    <BodyHeatmap muscleSets={sessionMuscleSets} maxSets={maxSessionSets} />
  </section>
)}
```

Add CSS:
```css
.heatmapSection {
  margin: 16px 0;
}

.sectionTitle {
  font-family: var(--font-barlow);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
}
```

- [ ] **Step 3: TypeScript + build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add app/workout/summary/page.tsx
git commit -m "feat: show session-specific heatmap in workout summary"
```

---

## Chunk 3: Heatmap & Stats Improvements

### Task 5: Smarter Heatmap Colors + Remove Background Tint

**Problems:**
1. Color scale is "low → high volume" which looks the same whether you had 1 session or 100 sessions
2. The heatmap in the dashboard has a slightly different background that looks ugly
3. Week vs month view: same absolute volume values look completely different because month has 4× more sessions

**Solution:**
- Normalize by time period — accept `totalSessions` or `periodDays` prop to scale colors
- Colors: use a progress-based approach: **cyan (accent) → purple (pr-color)** gradient for "trained muscles" instead of orange-red-magenta
- Remove the `bgElevated` background from untrained parts — use transparent or very subtle

**Files:**
- Modify: `components/ui/BodyHeatmap.tsx`
- Modify: `components/ui/BodyHeatmap.module.css` (if it exists, else inline)
- Modify: `app/(tabs)/dashboard/page.tsx` — pass `periodDays` prop

- [ ] **Step 1: Read BodyHeatmap.tsx fully**

Read `components/ui/BodyHeatmap.tsx` to understand the current color logic and SVG structure.

- [ ] **Step 2: Update color logic**

In `BodyHeatmap.tsx`, replace the 4-step heat palette with a smooth cyan→purple gradient:

```typescript
function getMuscleFill(sets: number, max: number): string {
  if (sets === 0) return 'transparent'; // no fill for untrained — cleaner
  const ratio = Math.min(sets / Math.max(max, 1), 1);
  // Interpolate: accent (#3DFFE6) → pr-color (#BF6FFF)
  // Simple: low = cyan, mid = blue-violet, high = purple
  if (ratio < 0.33) return 'rgba(61, 255, 230, 0.6)';   // accent/cyan
  if (ratio < 0.66) return 'rgba(74, 158, 255, 0.7)';    // volume blue
  return 'rgba(191, 111, 255, 0.8)';                       // pr purple
}
```

Add `opacity` to the SVG path instead of different fill colors — cleaner:

```typescript
// Alternative: single color with variable opacity
function getMuscleOpacity(sets: number, max: number): number {
  if (sets === 0) return 0.05; // barely visible outline
  return 0.3 + (sets / Math.max(max, 1)) * 0.65; // 0.3 → 0.95
}
```

Use the opacity approach with `fill={colors.accent}` and `fillOpacity={getMuscleOpacity(sets, max)}`.

- [ ] **Step 3: Add `periodDays` prop for normalization**

```typescript
interface BodyHeatmapProps {
  muscleSets: Record<string, number>;
  maxSets?: number;      // override max for normalization
  periodDays?: number;   // 7 = week, 30 = month — normalizes max
  compact?: boolean;
}
```

If `periodDays` is provided, multiply the color threshold by `periodDays / 7` (so month view needs 4× more sets to reach "max" color).

- [ ] **Step 4: Update dashboard to pass periodDays**

In `app/(tabs)/dashboard/page.tsx`, find where `<BodyHeatmap>` is used. Add `periodDays={7}` (or whatever the current view period is).

- [ ] **Step 5: TypeScript + build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add components/ui/BodyHeatmap.tsx app/(tabs)/dashboard/page.tsx
git commit -m "feat: heatmap smarter colors (opacity-based), transparent untrained, period normalization"
```

---

### Task 6: Stats Page Improvements

**Problems:**
1. X-axis always shows `dd.MM` format — week view should show Mo/Di/Mi/Do/Fr/Sa/So
2. Volume range selector state exists but chart ignores it (dead code)
3. No "missing muscles this week" insight
4. "vs previous period" comparison is useful — keep it

**Files:**
- Modify: `app/(tabs)/stats/page.tsx`

- [ ] **Step 1: Read stats/page.tsx fully**

Read `app/(tabs)/stats/page.tsx` to understand current chart config and dead code.

- [ ] **Step 2: Fix x-axis labels**

Find the Recharts `<BarChart>` / `<XAxis>` for the volume chart. Change the tick formatter:

```typescript
// Determine period from current tab (week vs month)
const xAxisFormatter = (dateStr: string) => {
  const date = parseISO(dateStr); // from date-fns
  if (currentPeriod === 'week') {
    return format(date, 'EEE', { locale: de }).slice(0, 2); // "Mo", "Di" etc.
  }
  return format(date, 'd'); // "1", "15" etc. for month
};
```

Apply to `<XAxis tickFormatter={xAxisFormatter} />`.

- [ ] **Step 3: Fix dead code — wire up volume range selector**

Find `volumeRange` state and `RANGE_WEEKS` constant. Connect it to the chart data so selecting "4 Wochen" / "8 Wochen" / "12 Wochen" actually changes what data is shown.

Look at how session data is currently filtered for the chart — it's probably hardcoded to 8 weeks. Make it dynamic based on `volumeRange`.

- [ ] **Step 4: Add "Fehlende Muskeln diese Woche" section**

After the heatmap section in stats, add an insight panel:

```typescript
// Calculate which muscles haven't been trained this week
const thisWeekStart = startOfWeek(new Date(), { locale: de });
const thisWeekSessions = sessions.filter(s =>
  parseISO(s.date) >= thisWeekStart
);
const trainedMusclesThisWeek = new Set(
  thisWeekSessions.flatMap(s => s.exercises.map(e => e.exercise.primaryMuscle))
);
const MAJOR_MUSCLES = ['chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps', 'core'];
const missingMuscles = MAJOR_MUSCLES.filter(m => !trainedMusclesThisWeek.has(m));
```

Display as a simple list with German names (use `MUSCLE_LABELS_DE`):

```tsx
{missingMuscles.length > 0 && (
  <div className={styles.insightCard}>
    <span className={styles.insightTitle}>Diese Woche noch nicht trainiert:</span>
    <div className={styles.muscleTagRow}>
      {missingMuscles.map(m => (
        <span key={m} className={styles.muscleTag}>
          {MUSCLE_LABELS_DE[m] ?? m}
        </span>
      ))}
    </div>
  </div>
)}
```

CSS:
```css
.insightCard {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
}
.insightTitle {
  font-size: 12px;
  color: var(--text-muted);
  display: block;
  margin-bottom: 8px;
}
.muscleTagRow {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.muscleTag {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 12px;
  color: var(--text-secondary);
}
```

- [ ] **Step 5: TypeScript + build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add app/(tabs)/stats/page.tsx
git commit -m "feat: stats — Mo/Di day labels, wire volume range, missing muscles insight"
```

---

## Chunk 4: Exercises, Splits, Auto Rest Day

### Task 7: More Popular Exercises + Better Sorting

**What:** Add 15+ popular exercises that are missing. Fix popularity sort to put well-known exercises (Bankdrücken, Kniebeugen, Klimmzüge) first.

**Files:**
- Modify: `constants/exercises.ts`

- [ ] **Step 1: Read current exercise list**

```bash
grep -n "nameDE:" constants/exercises.ts | head -50
```

Check which popular exercises are missing.

- [ ] **Step 2: Add missing popular exercises**

Add these exercises if not present (check first!):

```typescript
// Compound — High priority
{ id: 'bench-press', nameDE: 'Bankdrücken', primaryMuscle: 'chest', category: 'compound', popularity: 98, defaultWeight: 60, defaultSets: 4, defaultReps: 8, repRange: { min: 6, max: 10 }, equipment: ['barbell'], restSeconds: 180, ... }
{ id: 'squat', nameDE: 'Kniebeuge', primaryMuscle: 'quads', category: 'compound', popularity: 97, defaultWeight: 80, defaultSets: 4, defaultReps: 8, ... }
{ id: 'deadlift', nameDE: 'Kreuzheben', primaryMuscle: 'back', category: 'compound', popularity: 96, defaultWeight: 100, ... }
{ id: 'pullup', nameDE: 'Klimmzug', primaryMuscle: 'back', category: 'compound', popularity: 94, defaultWeight: 0, equipment: ['bodyweight'], ... }
{ id: 'lat-pulldown', nameDE: 'Latzug', primaryMuscle: 'back', category: 'compound', popularity: 93, defaultWeight: 60, ... }
{ id: 'ohp', nameDE: 'Schulterdrücken', primaryMuscle: 'shoulders', category: 'compound', popularity: 91, defaultWeight: 40, ... }
{ id: 'dip', nameDE: 'Dips', primaryMuscle: 'triceps', category: 'compound', popularity: 88, defaultWeight: 0, equipment: ['bodyweight'], ... }
{ id: 'row-barbell', nameDE: 'Langhantelrudern', primaryMuscle: 'back', category: 'compound', popularity: 89, defaultWeight: 60, ... }

// Cardio
{ id: 'running', nameDE: 'Laufen', primaryMuscle: 'cardio', category: 'cardio', popularity: 95, ... }
{ id: 'cycling', nameDE: 'Fahrradfahren', primaryMuscle: 'cardio', category: 'cardio', popularity: 85, ... }
{ id: 'rowing-machine', nameDE: 'Rudergerät', primaryMuscle: 'cardio', category: 'cardio', popularity: 78, ... }
{ id: 'jump-rope', nameDE: 'Seilspringen', primaryMuscle: 'cardio', category: 'cardio', popularity: 75, ... }
{ id: 'elliptical', nameDE: 'Ellipsentrainer', primaryMuscle: 'cardio', category: 'cardio', popularity: 72, ... }
```

Read the exact `Exercise` type first to get all required fields. Use `scienceNote: ''` as placeholder if needed.

- [ ] **Step 3: Verify exercises that already exist**

Before adding, check with `grep -n "nameDE: 'Bankdrücken'" constants/exercises.ts` for each one.

- [ ] **Step 4: TypeScript + build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add constants/exercises.ts
git commit -m "feat: add popular exercises — Bankdrücken, Kniebeugen, Latzug, cardio"
```

---

### Task 8: Simplify Splits Page — Remove Confusing Score

**Problem:** The plan score (calculated by `calculatePlanScore`) shows a number that users don't understand. Green/amber/red by score threshold adds visual noise.

**Solution:** Remove the score display from split cards. Replace with simple, clear info: days/week, muscle groups covered (as chips), last performed date.

**Files:**
- Modify: `app/(tabs)/splits/page.tsx`

- [ ] **Step 1: Read splits/page.tsx**

Read the file to find the score display and card structure.

- [ ] **Step 2: Remove score display from cards**

Find the `planScore` rendering (color-coded score bar/badge). Remove it entirely from split cards. Do NOT remove `calculatePlanScore` from utils (it might be used elsewhere).

- [ ] **Step 3: Add muscle group chips instead**

For each split's days, collect unique muscle groups and show them as small chips:

```typescript
const splitMuscles = split.days.flatMap(d =>
  d.exercises.map(e => {
    const exercise = EXERCISES.find(ex => ex.id === e.exerciseId);
    return exercise?.primaryMuscle;
  }).filter(Boolean)
);
const uniqueMuscles = [...new Set(splitMuscles)].slice(0, 4);
```

Display:
```tsx
<div className={styles.muscleChips}>
  {uniqueMuscles.map(m => (
    <span key={m} className={styles.muscleChip}>
      {MUSCLE_LABELS_DE[m!] ?? m}
    </span>
  ))}
  {uniqueMuscles.length === 0 && <span className={styles.emptyMuscles}>Keine Übungen</span>}
</div>
```

- [ ] **Step 4: TypeScript + build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/splits/page.tsx
git commit -m "feat: splits — remove confusing score, show muscle group chips instead"
```

---

### Task 9: Auto Rest Day — Protect Streak on Missed Days

**What:** When the app loads and yesterday had no training AND no rest day:
- Automatically add yesterday as a rest day
- Show a dismissible notification: "Du hattest gestern vermutlich einen Rest Day — wurde automatisch eingetragen."
- If 2+ consecutive missed days: still add rest day for yesterday (streak protection) but show: "Mehrere Tage ohne Training — Rest Day für gestern eingetragen."
- Cap: max 1 auto-rest-day per streak gap (don't fill every missed day, just protect yesterday)

**Files:**
- Modify: `store/historyStore.ts` — add `autoRestDays: string[]` to distinguish auto vs manual
- Modify: `app/(tabs)/dashboard/page.tsx` OR `app/layout.tsx` — trigger check on mount
- Create: `hooks/useAutoRestDay.ts` — encapsulate the auto-rest logic
- Modify: `app/(tabs)/dashboard/page.tsx` — show notification banner

- [ ] **Step 1: Add `autoRestDays` to historyStore**

In `store/historyStore.ts`, add alongside `restDays`:

```typescript
autoRestDays: string[]; // automatically added rest days
addAutoRestDay: (date: string) => void;
```

Implementation:
```typescript
addAutoRestDay: (date) => set((state) => ({
  autoRestDays: state.autoRestDays.includes(date) ? state.autoRestDays : [...state.autoRestDays, date],
  restDays: state.restDays.includes(date) ? state.restDays : [...state.restDays, date], // also counts for streak
})),
```

Also add `autoRestDays: []` to initial state.

- [ ] **Step 2: Create `hooks/useAutoRestDay.ts`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useHistoryStore } from '@/store/historyStore';
import { subDays, format, parseISO, isAfter } from 'date-fns';

export function useAutoRestDay() {
  const { sessions, restDays, autoRestDays, addAutoRestDay } = useHistoryStore();
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    const yesterday = subDays(today, 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    // Already handled?
    if (restDays.includes(yesterdayStr) || autoRestDays.includes(yesterdayStr)) return;

    // Did user train yesterday?
    const trainedYesterday = sessions.some(s => s.date === yesterdayStr);
    if (trainedYesterday) return;

    // Check how many consecutive missed days
    const dayBefore = format(subDays(today, 2), 'yyyy-MM-dd');
    const trainedDayBefore = sessions.some(s => s.date === dayBefore) || restDays.includes(dayBefore);

    // Auto-add rest day for yesterday
    addAutoRestDay(yesterdayStr);

    if (!trainedDayBefore) {
      setNotification('Mehrere Tage ohne Training erkannt — Rest Day für gestern automatisch eingetragen.');
    } else {
      setNotification('Du hattest gestern vermutlich einen Rest Day — wurde automatisch eingetragen.');
    }
  }, []); // run once on mount

  return { notification, dismissNotification: () => setNotification(null) };
}
```

- [ ] **Step 3: Use the hook in dashboard**

In `app/(tabs)/dashboard/page.tsx`:

```typescript
import { useAutoRestDay } from '@/hooks/useAutoRestDay';

// In component:
const { notification, dismissNotification } = useAutoRestDay();

// In JSX, add at the top of the page content:
{notification && (
  <div className={styles.autoRestNotification}>
    <span>{notification}</span>
    <button onClick={dismissNotification} className={styles.dismissBtn}>✕</button>
  </div>
)}
```

CSS:
```css
.autoRestNotification {
  background: var(--accent-bg);
  border: 1px solid rgba(61, 255, 230, 0.25);
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}
.dismissBtn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 14px;
  flex-shrink: 0;
}
```

- [ ] **Step 4: TypeScript + build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add store/historyStore.ts hooks/useAutoRestDay.ts app/(tabs)/dashboard/page.tsx
git commit -m "feat: auto rest day — protect streak on missed days with notification"
```

---

### Task 10: Start Screen — Improve Plus/Start Flow

**Problem:** The start screen's "Schnellstart" section is confusing — 3 separate cards for free/rest/repeat are not intuitive. The plus button flow needs to be cleaner.

**What to build:**
- Cleaner hierarchy: planned workout is PRIMARY (big card), free workout is SECONDARY (smaller button)
- If no plan is active: show "Workout starten" as primary action + "Freies Workout" secondary
- Rest Day: move to a small button below (not equal prominence to a workout start)
- Repeat last workout: keep as a quick action chip, not a full card

**Files:**
- Modify: `app/(tabs)/start/page.tsx`
- Modify: `app/(tabs)/start/page.module.css` (or wherever the start page CSS lives)

- [ ] **Step 1: Read the current start page structure**

Read `app/(tabs)/start/page.tsx` fully. Understand what `handleStartFree`, `handleStartPlanned`, and the rest day section currently do.

- [ ] **Step 2: Restructure the start page UI**

The page should have this hierarchy:

```
[TODAY'S PLANNED WORKOUT — big primary card, if split active]
  → Exercise list preview (first 4 exercises)
  → "Training starten" CTA button

[If no plan: "Freies Workout starten" — primary card]

[Quick Actions — horizontal row]
  → "Letztes wiederholen" chip
  → "Rest Day" chip (small, unobtrusive)

[Rest of page: split selection cards]
```

Key changes:
- Remove the 3-card grid for Schnellstart
- "Rest Day" becomes a small chip/button, not a full card
- The planned workout card is visually dominant (bigger, accent border)

Rewrite the Schnellstart section. Keep all existing handler functions — just change the JSX layout.

- [ ] **Step 3: TypeScript + build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/start/page.tsx
git commit -m "feat: start screen redesign — planned workout primary, rest day as chip"
```

---

## Execution Notes

**Subagent order:** Tasks 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 (sequential, each builds on previous)

**Priority if time is limited:**
1. Task 1 (settings panel fix) — critical bug, users can't use settings
2. Task 3 (score rework) — score is actively misleading
3. Task 9 (auto rest day) — streak protection UX
4. Task 6 (stats improvements) — quality of life
5. Tasks 7, 8, 10 — enhancements

**Before each task:** Subagent MUST read the files listed first — the line numbers in this plan are approximate.

**Test after each task:** `npx tsc --noEmit && npm run build` — expect 0 errors, 33+ pages.
