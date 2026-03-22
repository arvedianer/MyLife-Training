# Paket 1 — Quick Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three independent UI bug fixes: binary heatmap in Workout Summary, progress-bar recovery cards in Stats, and removal of the confusing "vs. Vorherige Periode" strip.

**Architecture:** All three tasks are self-contained and touch different files. No new utilities needed except adding `recoveryRatio` to `MuscleRecovery`. Each task can be done in under 30 minutes.

**Tech Stack:** Next.js 14, TypeScript strict, CSS-in-JS (inline styles + CSS Modules), Framer Motion, design tokens from `constants/tokens.ts`

---

## File Map

| File | Task | Change |
|------|------|--------|
| `components/ui/BodyHeatmap.tsx` | Task 1 | Add `mode?: 'weekly' \| 'session'` prop; binary color logic in session mode; hide legend |
| `app/workout/summary/page.tsx` | Task 1 | Pass `mode="session"` to `<BodyHeatmap>` |
| `utils/muscleRecovery.ts` | Task 2 | Add `recoveryRatio: number` field to `MuscleRecovery` interface and return value |
| `app/(tabs)/stats/page.tsx` | Task 2 + 3 | Replace recovery pill list with progress-bar grid; delete comparison strip + dead code |

---

## Task 1: Workout Summary Heatmap — Binary Mode

**Problem:** `maxSessionSets = Math.max(...values, 1)`. If only 1 muscle worked 1 set, `maxSessionSets=1` → ratio=1.0 → purple "Maximum". Wrong.

**Fix:** Add `mode="session"` prop to `BodyHeatmap`. In session mode every muscle with sets > 0 gets accent color (`#4DFFED`), regardless of count.

**Files:**
- Modify: `components/ui/BodyHeatmap.tsx`
- Modify: `app/workout/summary/page.tsx`

- [ ] **Step 1: Add `mode` prop to `BodyHeatmapProps`**

In `components/ui/BodyHeatmap.tsx`, change the interface:

```typescript
interface BodyHeatmapProps {
    muscleSets: Record<string, number>;
    maxSets: number;
    compact?: boolean;
    mode?: 'weekly' | 'session';
}
```

- [ ] **Step 2: Add session-mode color function**

Add after `getMuscleColor`:

```typescript
function getMuscleColorSession(sets: number): { fill: string; fillOpacity: number } {
  if (sets === 0) return { fill: '#FFFFFF', fillOpacity: 0.05 };
  return { fill: '#4DFFED', fillOpacity: 1.0 };
}
```

- [ ] **Step 3: Thread `mode` through `getPartStyle`**

Change `getPartStyle` signature and body:

```typescript
function getPartStyle(slug: string, muscleSets: Record<string, number>, maxSets: number, mode?: 'weekly' | 'session'): { fill: string; fillOpacity: number } {
    const keys = slugMap[slug] || [];
    for (const key of keys) {
        if (muscleSets[key]) {
            return mode === 'session'
                ? getMuscleColorSession(muscleSets[key])
                : getMuscleColor(muscleSets[key], maxSets);
        }
    }
    return { fill: '#FFFFFF', fillOpacity: 0.05 };
}
```

- [ ] **Step 4: Pass `mode` in the SVG render calls**

In the `BodyHeatmap` component function, add `mode` to the props destructure and pass it to every `getPartStyle` call:

```typescript
export function BodyHeatmap({ muscleSets, maxSets, compact, mode }: BodyHeatmapProps) {
  // ...
  // In SVG map: replace getPartStyle(slug, muscleSets, maxSets) with:
  //   getPartStyle(slug, muscleSets, maxSets, mode)
```

Search for all occurrences of `getPartStyle(` in this file and add `, mode` before the closing `)`.

- [ ] **Step 5: Conditionally hide legend in session mode**

In `BodyHeatmap`, find the `LEGEND_ITEMS` render block. Wrap it:

```tsx
{mode !== 'session' && (
  <div style={{ /* existing legend styles */ }}>
    {/* existing legend items */}
  </div>
)}
```

And add a label for session mode:

```tsx
{mode === 'session' && (
  <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px', fontFamily: 'var(--font-manrope)' }}>
    Trainierte Muskeln
  </p>
)}
```

- [ ] **Step 6: Pass `mode="session"` in summary page**

In `app/workout/summary/page.tsx`, find the `<BodyHeatmap` usage and add the prop:

```tsx
<BodyHeatmap
  muscleSets={sessionMuscleSets}
  maxSets={maxSessionSets}
  mode="session"
/>
```

`maxSessionSets` can stay — in session mode the value is ignored.

- [ ] **Step 7: TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 8: Verify visually**

Start dev server. Complete a workout with only 1 exercise (e.g. Bankdrücken, 3 sets). Open Summary. The worked muscle should light up cyan, all others dim. No "Maximum" label.

- [ ] **Step 9: Commit**

```bash
git add components/ui/BodyHeatmap.tsx app/workout/summary/page.tsx
git commit -m "fix: workout summary heatmap — binary session mode, trained muscles glow cyan"
```

---

## Task 2: Muscle Recovery — Progress Bar Redesign

**Problem:** Current display is a list of colored pills with raw hour values (e.g. "Brust · 10h"). Looks unfinished and hard to parse at a glance.

**Fix:** 2-column grid of compact recovery cards. Each card: muscle name, progress bar (red→yellow→green), label ("~18h" or "Bereit ✓").

**Files:**
- Modify: `utils/muscleRecovery.ts` — add `recoveryRatio` to return value
- Modify: `app/(tabs)/stats/page.tsx` — replace pill JSX with progress-bar grid

- [ ] **Step 1: Add `recoveryRatio` to `MuscleRecovery` interface**

In `utils/muscleRecovery.ts`:

```typescript
export interface MuscleRecovery {
  muscle: string;
  label: string;
  status: RecoveryStatus;
  hoursAgo: number;
  recoveryRatio: number;   // 0.0 = just trained, 1.0+ = fully recovered
}
```

- [ ] **Step 2: Compute and return `recoveryRatio`**

In `computeMuscleRecovery`, add `recoveryRatio` to the mapped object:

```typescript
return {
  muscle,
  label: (MUSCLE_LABELS_DE as Record<string, string>)[muscle] ?? muscle,
  status,
  hoursAgo,
  recoveryRatio: Math.min(ratio, 1),  // cap at 1.0
};
```

- [ ] **Step 3: TypeScript check** — Run `npx tsc --noEmit`. Fix any errors.

- [ ] **Step 4: Replace pill list in stats page**

In `app/(tabs)/stats/page.tsx`, find the `{/* ── MUSCLE RECOVERY ── */}` section (lines ~359–398). Replace the entire `<section>` block with:

```tsx
{/* ── MUSCLE RECOVERY ── */}
{muscleRecovery.length > 0 && (
  <section style={{ marginBottom: '20px' }}>
    <h2 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', fontFamily: 'var(--font-barlow)' }}>
      Muskel-Erholung
    </h2>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
      {muscleRecovery.slice(0, 8).map(m => {
        const pct = Math.round(m.recoveryRatio * 100);
        const isReady = m.recoveryRatio >= 0.9;
        const barColor = m.recoveryRatio < 0.33
          ? '#FF3B30'
          : m.recoveryRatio < 0.66
          ? '#FF9F0A'
          : '#34C759';
        return (
          <div key={m.muscle} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '10px 12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-manrope)' }}>
                {m.label}
              </span>
              <span style={{ fontSize: '11px', color: isReady ? '#34C759' : 'var(--text-muted)', fontFamily: 'var(--font-manrope)' }}>
                {isReady ? 'Bereit ✓' : `~${m.hoursAgo}h`}
              </span>
            </div>
            <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`, maxWidth: '100%',
                background: barColor, borderRadius: '2px',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  </section>
)}
```

- [ ] **Step 5: TypeScript check** — Run `npx tsc --noEmit`. Fix any errors.

- [ ] **Step 6: Visual check**

Open Stats tab. If you have recent sessions, the recovery section should show a 2-column grid with progress bars. "Bereit ✓" in green for recovered muscles, "~Xh" in muted for recovering/fatigued.

- [ ] **Step 7: Commit**

```bash
git add utils/muscleRecovery.ts app/(tabs)/stats/page.tsx
git commit -m "feat: muscle recovery — replace pills with progress-bar grid"
```

---

## Task 3: Remove "vs. Vorherige Periode"

**Problem:** The comparison strip is confusing and no one understands what "Vorherige Periode" means. Remove without replacement.

**Files:**
- Modify: `app/(tabs)/stats/page.tsx`

- [ ] **Step 1: Delete the comparison strip JSX**

In `app/(tabs)/stats/page.tsx`, find and delete lines ~420–436:

```tsx
{/* ── PERIOD COMPARISON STRIP ── */}
{(prevWorkouts > 0 || periodWorkouts > 0) && (
  <div style={{ ... }}>
    <span>vs. Vorherige Periode</span>
    <div>
      <CompareChip ... />
      <CompareChip ... />
      <CompareChip ... />
    </div>
  </div>
)}
```

Delete this entire block.

- [ ] **Step 2: Delete `prevPeriodSessions` and derived values**

Find and delete lines ~205–213:

```typescript
// Previous period (for comparison strip)
const { start: prevStart, end: prevEnd } = useMemo(() => getPreviousPeriodRange(period), [period]);
const prevPeriodSessions = useMemo(
  () => sessions.filter(s => { const d = parseISO(s.date); return d >= prevStart && d <= prevEnd; }),
  [sessions, prevStart, prevEnd],
);
const prevWorkouts = prevPeriodSessions.length;
const prevVolume = prevPeriodSessions.reduce((sum, s) => sum + s.totalVolume, 0);
const prevDurSec = prevPeriodSessions.reduce((sum, s) => sum + s.durationSeconds, 0);
```

- [ ] **Step 3: Delete `getPreviousPeriodRange` function**

Find and delete lines ~58–78:

```typescript
function getPreviousPeriodRange(period: Period): { start: Date; end: Date } {
  // ...
}
```

- [ ] **Step 4: Clean up unused imports**

Check if `subWeeks`, `subMonths` are still used elsewhere in the file. If only used in `getPreviousPeriodRange`, remove them from the `date-fns` import line.

Check if `CompareChip` component is still used. If not, find its definition in this file and delete it too.

- [ ] **Step 5: TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors. If TypeScript complains about unused variables, they were missed — delete them.

- [ ] **Step 6: Verify**

Open Stats. The "vs. Vorherige Periode" strip should be gone. Page should still render normally with period selector, heatmap, 3 metric cards, training calendar.

- [ ] **Step 7: Commit**

```bash
git add app/(tabs)/stats/page.tsx
git commit -m "chore: remove 'vs. Vorherige Periode' comparison strip — confusing, no replacement"
```

---

## Done

All three tasks are independent. They can be executed in any order or in parallel. Each produces a clean TypeScript build and a tested UI state before commit.
