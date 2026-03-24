# Workout Polish — 1RM, Rep Range, Unilateral, Heatmap Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish 5 specific rough spots in the active workout experience: heatmap color vibrancy, rep range control usability, set row completion aesthetics, unilateral display clarity, and 1RM labeling.

**Architecture:** All 4 tasks are independent and touch separate files — they can be executed in parallel. Tasks 1 and 2 are self-contained (one component each). Task 3 handles SetRow in one commit (completion styling + unilateral + 1RM repositioning) to avoid file conflicts. Task 4 adds 1RM to the records system.

**Tech Stack:** Next.js 14, TypeScript strict (no `any`), CSS Modules, lucide-react icons, design tokens from `constants/tokens.ts`, existing `colors.volumeColor` / `colors.success` / `colors.accent` etc.

---

## File Structure

### Files Modified:
| File | What changes |
|------|-------------|
| `components/ui/BodyHeatmap.tsx` | `LEGEND_ITEMS` + `getMuscleColor` — color values only |
| `components/workout/ExerciseSettingsSheet.tsx` | Replace broken slider section (lines 238–255) with preset chips + steppers |
| `components/workout/ExerciseSettingsSheet.module.css` | Remove `.slider`/`.rangeLabel`, add `.rangeStepperRow`, `.rangeStepper`, `.stepperBtn`, `.rangeValue`, `.rangeSeparator` |
| `components/workout/SetRow.tsx` | Completed row styling; unilateral edit→summary mode; 1RM moved to volume column |
| `components/workout/SetRow.module.css` | `.setRowCompleted` border-left; `.unilateralReps` flat; new `.unilateralSummary`, `.ormHint`; `.volumeContainer` wider |
| `utils/personalRecords.ts` | Add `bestOneRepMax` + `bestOneRepMaxDate` to `PersonalRecord`, compute in loop |
| `app/(tabs)/log/records/page.tsx` | Add 1RM stat block after MAX GEWICHT column |

---

## Chunk 1: Heatmap + Rep Range

### Task 1: Heatmap — Full-Opacity Vivid Colors

**Files:**
- Modify: `components/ui/BodyHeatmap.tsx:15-30`

The current colors use `fillOpacity` 0.75–0.90 which makes them look washed out against the dark SVG body. Raising to 1.0 and using more saturated hues makes the heat zones pop.

- [ ] **Step 1: Read current `components/ui/BodyHeatmap.tsx` lines 15–30 to confirm exact text before editing**

- [ ] **Step 2: Replace `LEGEND_ITEMS` and `getMuscleColor` (lines 15–30)**

```typescript
const LEGEND_ITEMS = [
  { fill: '#FFFFFF',  opacity: 0.05,  label: 'Kein Training' },
  { fill: '#FACC15',  opacity: 1.0,   label: 'Wenig' },
  { fill: '#FB923C',  opacity: 1.0,   label: 'Mittel' },
  { fill: '#EF4444',  opacity: 1.0,   label: 'Viel' },
  { fill: '#8B5CF6',  opacity: 1.0,   label: 'Maximum' },
];

function getMuscleColor(sets: number, max: number): { fill: string; fillOpacity: number } {
  if (sets === 0) return { fill: '#FFFFFF', fillOpacity: 0.05 };
  const ratio = sets / Math.max(max, 1);
  if (ratio <= 0.25) return { fill: '#FACC15', fillOpacity: 1.0 };  // bright yellow — low
  if (ratio <= 0.5)  return { fill: '#FB923C', fillOpacity: 1.0 };  // vivid orange — moderate
  if (ratio <= 0.75) return { fill: '#EF4444', fillOpacity: 1.0 };  // punch red — high
  return { fill: '#8B5CF6', fillOpacity: 1.0 };                     // bright purple — max
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd "D:\arved\20_Projekte\MyLife\(GeminiVersion)Training_App_MyLife"
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add components/ui/BodyHeatmap.tsx
git commit -m "feat: heatmap — full-opacity vivid colors, punch red at high intensity"
```

---

### Task 2: Rep Range — Replace Broken Sliders with Preset Chips + Steppers

**Files:**
- Modify: `components/workout/ExerciseSettingsSheet.tsx:238-255`
- Modify: `components/workout/ExerciseSettingsSheet.module.css`

**Why broken:** Two HTML `<input type="range">` sliders side-by-side are essentially unusable on mobile — tiny touch targets, overlapping drag areas, no clear affordance for which is min vs max.

**Replacement:** Preset chips for common training rep ranges (tap one to set both min/max at once) + manual stepper [−] N [+] buttons for fine-tuning, matching the chip aesthetic used everywhere else in this sheet.

- [ ] **Step 1: Read `components/workout/ExerciseSettingsSheet.tsx` lines 40–45 to find where to insert the presets constant**

- [ ] **Step 2: Add `REP_RANGE_PRESETS` constant after existing constants (after line 43, before the component function)**

```typescript
const REP_RANGE_PRESETS: Array<{ label: string; min: number; max: number }> = [
  { label: '1–5',   min: 1,  max: 5  },
  { label: '5–8',   min: 5,  max: 8  },
  { label: '8–12',  min: 8,  max: 12 },
  { label: '10–15', min: 10, max: 15 },
  { label: '12–20', min: 12, max: 20 },
  { label: '20+',   min: 20, max: 30 },
];
```

- [ ] **Step 3: Replace the entire `{/* WIEDERHOLUNGSBEREICH */}` section (lines 238–255)**

```tsx
{/* WIEDERHOLUNGSBEREICH */}
<div className={styles.section}>
  <div className={styles.sectionLabel}>WIEDERHOLUNGSBEREICH</div>

  {/* Preset chips — tap to set common range instantly */}
  <div className={styles.chipRow}>
    {REP_RANGE_PRESETS.map((preset) => {
      const isActive = safeMin === preset.min && safeMax === preset.max;
      return (
        <button
          key={preset.label}
          onClick={() => onRepRangeChange(preset.min, preset.max)}
          className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
        >
          {preset.label}
        </button>
      );
    })}
  </div>

  {/* Manual steppers for fine-tuning */}
  <div className={styles.rangeStepperRow}>
    <div className={styles.rangeStepper}>
      <span className={styles.rangeStepperLabel}>MIN</span>
      <button
        onClick={() => onRepRangeChange(Math.max(1, safeMin - 1), safeMax)}
        className={styles.stepperBtn}
        aria-label="Min verringern"
      >−</button>
      <span className={styles.rangeValue}>{safeMin}</span>
      <button
        onClick={() => onRepRangeChange(Math.min(safeMax - 1, safeMin + 1), safeMax)}
        className={styles.stepperBtn}
        aria-label="Min erhöhen"
      >+</button>
    </div>
    <span className={styles.rangeSeparator}>—</span>
    <div className={styles.rangeStepper}>
      <span className={styles.rangeStepperLabel}>MAX</span>
      <button
        onClick={() => onRepRangeChange(safeMin, Math.max(safeMin + 1, safeMax - 1))}
        className={styles.stepperBtn}
        aria-label="Max verringern"
      >−</button>
      <span className={styles.rangeValue}>{safeMax}</span>
      <button
        onClick={() => onRepRangeChange(safeMin, Math.min(30, safeMax + 1))}
        className={styles.stepperBtn}
        aria-label="Max erhöhen"
      >+</button>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Update `ExerciseSettingsSheet.module.css` — remove `.slider` + `.rangeLabel`, add new classes**

Find and **delete** these two CSS rules (they are no longer used):
```css
.rangeLabel { ... }
.slider { ... }
```

Then **add** at the end of the file:

```css
.rangeStepperRow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.rangeStepper {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #161616;
  border: 1px solid #262626;
  border-radius: 10px;
  padding: 8px 10px;
  flex: 1;
}

.rangeStepperLabel {
  font-size: 9px;
  font-weight: 700;
  color: #888888;
  letter-spacing: 0.08em;
  width: 26px;
  flex-shrink: 0;
}

.rangeValue {
  font-family: var(--font-courier, 'Courier New', Courier, monospace);
  font-size: 16px;
  font-weight: 700;
  color: #4DFFED;
  min-width: 28px;
  text-align: center;
  flex: 1;
}

.stepperBtn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #262626;
  background: #0E0E0E;
  color: #FFFFFF;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.1s, border-color 0.1s, color 0.1s;
}

.stepperBtn:active {
  background-color: #4DFFED;
  border-color: #4DFFED;
  color: #000000;
}

.rangeSeparator {
  color: #444444;
  font-size: 18px;
  flex-shrink: 0;
}
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add components/workout/ExerciseSettingsSheet.tsx components/workout/ExerciseSettingsSheet.module.css
git commit -m "feat: rep range — replace broken sliders with preset chips + stepper buttons"
```

---

## Chunk 2: SetRow Polish

### Task 3: SetRow — Completed Styling + Unilateral Overhaul + 1RM in Volume Column

**Context:** All three SetRow concerns are handled in one commit to avoid editing the same two files (`SetRow.tsx` + `SetRow.module.css`) in parallel. Read both files fully before making any edits.

**Files:**
- Modify: `components/workout/SetRow.tsx`
- Modify: `components/workout/SetRow.module.css`

**What's wrong:**
1. `.setRowCompleted` fills the entire row with a dull green rectangle (`rgba(50,215,75,0.05)`) — looks like a filled square, not elegant
2. Unilateral edit mode: two boxed inputs side-by-side is cluttered; completed mode still shows dimmed inputs instead of a clean summary
3. 1RM text (`≈105kg`) is squished between the complete button and delete button at 10px — invisible and unlabeled

**What we're building:**
1. Completed row gets a subtle left green border accent only — the `CheckCircle2` icon with glow is sufficient visual feedback
2. Unilateral edit: flat `L [input] | R [input]` in one flex row (no individual boxes); completed: inline summary text `L 8× · R 7×`
3. 1RM moves to the volume column as a second line: volume on top, `≈105kg` in 9px accent below — properly visible and in context

- [ ] **Step 1: Read `components/workout/SetRow.tsx` in full (230 lines) — understand structure before editing**

- [ ] **Step 2: Read `components/workout/SetRow.module.css` in full — understand all existing class names**

- [ ] **Step 3: Update `.setRowCompleted` in `SetRow.module.css`**

Replace:
```css
.setRowCompleted {
    background-color: var(--success-10, rgba(50, 215, 75, 0.05));
}
```
With:
```css
.setRowCompleted {
    border-left: 2px solid rgba(52, 199, 89, 0.35);
}
```

- [ ] **Step 4: Update `.volumeContainer` in `SetRow.module.css` — wider + column layout for 1RM line**

Replace:
```css
.volumeContainer {
    width: 44px;
    text-align: right;
    flex-shrink: 0;
}
```
With:
```css
.volumeContainer {
    width: 56px;
    text-align: right;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1px;
}
```

- [ ] **Step 5: Update `.unilateralReps` in `SetRow.module.css` — remove box wrappers, flat flex**

Replace:
```css
.unilateralReps {
    display: flex;
    gap: 8px;
    flex: 1;
    min-width: 0;
}
```
With:
```css
.unilateralReps {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
}
```

- [ ] **Step 6: Remove `.sideRepInput` from `SetRow.module.css` (no longer used)**

Delete the entire `.sideRepInput` block:
```css
.sideRepInput {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
    min-width: 0;
    background: var(--bg-elevated, #1E1E1E);
    border: 1px solid var(--border, #262626);
    border-radius: 8px;
    padding: 0 8px;
    min-height: 44px;
}
```

- [ ] **Step 7: Add new CSS classes at end of `SetRow.module.css`**

```css
/* Divider between L and R inputs in unilateral edit mode */
.unilateralDivider {
    color: var(--border, #333333);
    font-size: 14px;
    flex-shrink: 0;
    user-select: none;
    opacity: 0.6;
}

/* Unilateral completed: summary text instead of dimmed inputs */
.unilateralSummary {
    flex: 1;
    display: flex;
    align-items: center;
    opacity: 0.6;
}

.unilateralSummaryText {
    font-family: var(--font-courier, 'Courier New', Courier, monospace);
    font-size: 13px;
    color: var(--text-secondary, #F5F5F5);
    letter-spacing: 0.02em;
    white-space: nowrap;
}

/* 1RM hint shown below volume when set is completed */
.ormHint {
    font-family: var(--font-courier, 'Courier New', Courier, monospace);
    font-size: 9px;
    color: var(--accent, #4DFFED);
    opacity: 0.65;
    white-space: nowrap;
}
```

- [ ] **Step 8: Update `SetRow.tsx` — fix `handleToggle` to also auto-fill `repsL`/`repsR` for unilateral**

Find `handleToggle` (lines 56–69 of `SetRow.tsx`):
```tsx
const handleToggle = () => {
  if (!set.isCompleted) {
    if (set.weight === 0 && previousWeight !== undefined && previousWeight > 0) {
      onUpdateWeight(previousWeight);
    }
    if (set.reps === 0 && previousReps !== undefined && previousReps > 0) {
      onUpdateReps(previousReps);
    }
  }
  onToggleComplete();
};
```

Replace with:
```tsx
const handleToggle = () => {
  if (!set.isCompleted) {
    if (set.weight === 0 && previousWeight !== undefined && previousWeight > 0) {
      onUpdateWeight(previousWeight);
    }
    if (set.reps === 0 && previousReps !== undefined && previousReps > 0) {
      onUpdateReps(previousReps);
    }
    // Unilateral: auto-fill L/R reps from previousReps if neither was entered
    if (isUnilateral && previousReps !== undefined && previousReps > 0) {
      if (!set.repsL && localRepsL === undefined) onUpdateRepsL?.(previousReps);
      if (!set.repsR && localRepsR === undefined) onUpdateRepsR?.(previousReps);
    }
  }
  onToggleComplete();
};
```

This ensures the completed summary text `L N× · R N×` shows real values instead of `L 0× · R 0×` when the user completes a set without explicitly entering reps.

- [ ] **Step 9: Update `SetRow.tsx` — volume column: add 1RM hint as second line**

Find the volume div (currently lines 178–185):
```tsx
{/* Volumen (readonly) */}
<div className={styles.volumeContainer}>
  <div
    className={`${styles.volumeText} ${!(set.weight > 0 && set.reps > 0) ? styles.volumeTextFaint : ''}`}
    style={{ color: set.weight > 0 && set.reps > 0 ? colors.volumeColor : undefined }}
  >
    {set.weight > 0 && set.reps > 0 ? `${set.weight * set.reps}` : '—'}
  </div>
</div>
```

Replace with:
```tsx
{/* Volumen + 1RM hint (readonly) */}
<div className={styles.volumeContainer}>
  <div
    className={`${styles.volumeText} ${!(set.weight > 0 && set.reps > 0) ? styles.volumeTextFaint : ''}`}
    style={{ color: set.weight > 0 && set.reps > 0 ? colors.volumeColor : undefined }}
  >
    {set.weight > 0 && set.reps > 0 ? `${set.weight * set.reps}` : '—'}
  </div>
  {set.isCompleted && formatOneRepMax(set.weight, set.reps) && (
    <div className={styles.ormHint}>
      {formatOneRepMax(set.weight, set.reps)}
    </div>
  )}
</div>
```

- [ ] **Step 10: Update `SetRow.tsx` — remove 1RM span from actionsContainer**

Find and delete this block (currently inside actionsContainer, after the ClickSpark button):
```tsx
{set.isCompleted && set.weight > 0 && set.reps > 0 && (
  <span style={{
    fontSize: '10px',
    color: colors.textFaint,
    fontFamily: 'var(--font-courier, monospace)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    marginLeft: '2px',
  }}>
    {formatOneRepMax(set.weight, set.reps)}
  </span>
)}
```

The actionsContainer after removal should only contain: `ClickSpark+completeBtn` and `deleteBtn`.

- [ ] **Step 11: Update `SetRow.tsx` — replace unilateral reps section**

Find the unilateral reps block (lines 125–157):
```tsx
{isUnilateral ? (
  <div className={styles.unilateralReps} style={{ opacity: set.isCompleted ? 0.55 : 1, transition: 'opacity 0.2s ease' }}>
    <div className={styles.sideRepInput}>
      <span className={styles.sideLabel}>L</span>
      <NumericInput ... />
    </div>
    <div className={styles.sideRepInput}>
      <span className={styles.sideLabel}>R</span>
      <NumericInput ... />
    </div>
  </div>
) : (
  ...
)}
```

Replace the `isUnilateral` branch with:
```tsx
{isUnilateral ? (
  set.isCompleted ? (
    /* Completed: clean summary text, no inputs */
    <div className={styles.unilateralSummary}>
      <span className={styles.unilateralSummaryText}>
        L&nbsp;{set.repsL ?? set.reps}× · R&nbsp;{set.repsR ?? set.reps}×
      </span>
    </div>
  ) : (
    /* Editing: flat L | R layout */
    <div className={styles.unilateralReps}>
      <span className={styles.sideLabel}>L</span>
      <NumericInput
        value={localRepsL ?? set.repsL ?? set.reps}
        onChange={(val) => { setLocalRepsL(val); onUpdateRepsL?.(val); }}
        step={1}
        min={1}
        placeholder={String(set.repsL ?? set.reps ?? previousReps ?? 10)}
        ghost={localRepsL === undefined && !set.repsL && set.reps === 0 && previousReps !== undefined}
        style={{ flex: 1 }}
      />
      <span className={styles.unilateralDivider}>|</span>
      <span className={styles.sideLabel}>R</span>
      <NumericInput
        value={localRepsR ?? set.repsR ?? set.reps}
        onChange={(val) => { setLocalRepsR(val); onUpdateRepsR?.(val); }}
        step={1}
        min={1}
        placeholder={String(set.repsR ?? set.reps ?? previousReps ?? 10)}
        ghost={localRepsR === undefined && !set.repsR && set.reps === 0 && previousReps !== undefined}
        style={{ flex: 1 }}
      />
    </div>
  )
) : (
  <NumericInput
    value={set.reps}
    onChange={onUpdateReps}
    step={1}
    placeholder={
      set.reps === 0 && previousReps !== undefined
        ? String(previousReps)
        : isCardio ? 'min' : '0'
    }
    ghost={set.reps === 0 && previousReps !== undefined}
    style={{
      flex: 1,
      opacity: set.isCompleted ? 0.55 : 1,
      transition: 'opacity 0.2s ease',
    }}
  />
)}
```

- [ ] **Step 12: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors. If there are errors around `set.repsL`/`set.repsR`, verify `types/workout.ts` has `repsL?: number` and `repsR?: number` on `SetEntry`.

- [ ] **Step 13: Commit**

```bash
git add components/workout/SetRow.tsx components/workout/SetRow.module.css
git commit -m "feat: set row — clean border completion, unilateral L·R summary, 1RM in volume column"
```

---

## Chunk 3: PR Hall of Fame — Add 1RM

### Task 4: PR Hall of Fame — Estimated 1RM per Exercise

**Files:**
- Modify: `utils/personalRecords.ts`
- Modify: `app/(tabs)/log/records/page.tsx`

**What's missing:** The PR Hall of Fame shows max weight, best session volume, and max reps — but no 1RM estimate. 1RM is the most universal strength metric and belongs here. Compute it from the best valid set (reps 1–10) using the Epley formula already in `utils/oneRepMax.ts`.

- [ ] **Step 1: Read `utils/personalRecords.ts` fully to understand current structure**

- [ ] **Step 2: Update `PersonalRecord` interface and `computePersonalRecords` in `utils/personalRecords.ts`**

Full file replacement:

```typescript
import type { WorkoutSession } from '@/types/workout';
import { estimateOneRepMax } from '@/utils/oneRepMax';

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxWeight: number;
  maxReps: number;
  maxVolume: number;
  maxWeightDate: string;
  maxVolumeDate: string;
  bestOneRepMax: number | null;
  bestOneRepMaxDate: string | null;
}

export function computePersonalRecords(sessions: WorkoutSession[]): PersonalRecord[] {
  const map = new Map<string, PersonalRecord>();

  for (const session of sessions) {
    for (const ex of session.exercises) {
      const id = ex.exercise?.id ?? '';
      const name = ex.exercise?.nameDE ?? ex.exercise?.name ?? id;
      if (!id) continue;

      const completedSets = ex.sets.filter(s =>
        s.isCompleted || (s.weight > 0 && s.reps > 0)
      );
      if (completedSets.length === 0) continue;

      const sessionVolume = completedSets.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0);
      const maxWeightSet = completedSets.reduce((best, s) => (s.weight ?? 0) > (best.weight ?? 0) ? s : best, completedSets[0]);
      const maxRepsSet = completedSets.reduce((best, s) => (s.reps ?? 0) > (best.reps ?? 0) ? s : best, completedSets[0]);

      // Best estimated 1RM — Epley formula, valid only for reps 1–10
      const validSets = completedSets.filter(s =>
        (s.reps ?? 0) >= 1 && (s.reps ?? 0) <= 10 && (s.weight ?? 0) > 0
      );
      let sessionBest1RM: number | null = null;
      for (const s of validSets) {
        const orm = estimateOneRepMax(s.weight ?? 0, s.reps ?? 0);
        if (orm !== null && (sessionBest1RM === null || orm > sessionBest1RM)) {
          sessionBest1RM = orm;
        }
      }

      const existing = map.get(id);
      if (!existing) {
        map.set(id, {
          exerciseId: id,
          exerciseName: name,
          maxWeight: maxWeightSet.weight ?? 0,
          maxReps: maxRepsSet.reps ?? 0,
          maxVolume: sessionVolume,
          maxWeightDate: session.date,
          maxVolumeDate: session.date,
          bestOneRepMax: sessionBest1RM,
          bestOneRepMaxDate: sessionBest1RM !== null ? session.date : null,
        });
      } else {
        if ((maxWeightSet.weight ?? 0) > existing.maxWeight) {
          existing.maxWeight = maxWeightSet.weight ?? 0;
          existing.maxWeightDate = session.date;
        }
        if ((maxRepsSet.reps ?? 0) > existing.maxReps) {
          existing.maxReps = maxRepsSet.reps ?? 0;
        }
        if (sessionVolume > existing.maxVolume) {
          existing.maxVolume = sessionVolume;
          existing.maxVolumeDate = session.date;
        }
        if (sessionBest1RM !== null && (existing.bestOneRepMax === null || sessionBest1RM > existing.bestOneRepMax)) {
          existing.bestOneRepMax = sessionBest1RM;
          existing.bestOneRepMaxDate = session.date;
        }
      }
    }
  }

  return Array.from(map.values())
    .filter(r => r.maxWeight > 0)
    .sort((a, b) => b.maxVolume - a.maxVolume);
}
```

- [ ] **Step 3: Read `app/(tabs)/log/records/page.tsx` fully — find the stats row (starts around line 93)**

- [ ] **Step 4: Add 1RM stat block in `app/(tabs)/log/records/page.tsx`**

Use the Edit tool to insert. The exact anchor: find this closing `</div>` that ends the MAX GEWICHT stat block (the date line `{format(parseISO(r.maxWeightDate), 'dd.MM.yy')}` followed by its parent div closing):

```tsx
                <div style={{ ...typography.label, color: colors.textFaint, marginTop: '2px' }}>
                  {format(parseISO(r.maxWeightDate), 'dd.MM.yy')}
                </div>
              </div>

              {/* Best Volume */}
```

Insert the 1RM block between `</div>` (end of MAX GEWICHT) and `{/* Best Volume */}`:

```tsx
{/* Estimated 1RM */}
{r.bestOneRepMax !== null && (
  <div>
    <div
      style={{
        ...typography.label,
        color: colors.textMuted,
        marginBottom: '2px',
        letterSpacing: '0.05em',
      }}
    >
      1RM EST.
    </div>
    <div
      style={{
        fontFamily: 'var(--font-courier, monospace)',
        fontSize: '20px',
        fontWeight: 700,
        color: colors.accent,
        lineHeight: 1.1,
      }}
    >
      ≈{r.bestOneRepMax} kg
    </div>
    {r.bestOneRepMaxDate && (
      <div style={{ ...typography.label, color: colors.textFaint, marginTop: '2px' }}>
        {format(parseISO(r.bestOneRepMaxDate), 'dd.MM.yy')}
      </div>
    )}
  </div>
)}
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add utils/personalRecords.ts app/\(tabs\)/log/records/page.tsx
git commit -m "feat: PR hall of fame — add estimated 1RM (Epley) per exercise"
```

---

## Future Work (Intentionally Deferred — Read Before Starting Next Session)

These improvements were identified during code review but are explicitly deferred to avoid scope creep:

### Deferred: Progressive Overload Charts
- **What**: Per-exercise strength progression line chart (Recharts) on the exercise detail page and PR Hall of Fame. Show weight/1RM over time with date axis. Flag plateaus (3+ sessions with no increase).
- **Files to touch**: `app/(tabs)/stats/exercise/[id]/page.tsx`, new `utils/progressionSeries.ts`
- **Dependencies**: Recharts (already installed), date-fns (already installed)
- **Effort estimate**: ~half day

### Deferred: Gamification / Achievement System
- **What**: Achievement badges (e.g. "Erster PR", "30 Tage Streak", "1000kg Session"), milestone pop-up overlays via Framer Motion, achievement gallery page at `/achievements`
- **Files to touch**: New `utils/achievements.ts`, new `components/overlays/AchievementOverlay.tsx`, new `app/achievements/page.tsx`, integrate triggers in `useWorkout.ts` `completeWorkout()`
- **Effort estimate**: ~1 day

### Deferred: Body Weight & Measurement Tracking
- **What**: Daily body weight log (stored in Zustand + Supabase), weight chart in stats page, weight used to enhance bodyweight exercise calculations
- **Files to touch**: New `store/bodyStore.ts`, `app/(tabs)/stats/page.tsx` (add chart section), `app/settings/page.tsx` (add log entry)
- **Effort estimate**: ~1 day

### Deferred: Full UI Polish Pass
- **What**: Skeleton loading screens for all tab pages, animated empty states with lucide-react icons, consistent page-enter animations (`opacity: 0 → 1, y: 8 → 0`) using Framer Motion `AnimatePresence` on tab transitions
- **Files to touch**: All `app/(tabs)/*/page.tsx` screens
- **Effort estimate**: ~1 day

### Deferred: Adaptive Rest Timer (RPE-based)
- **What**: After completing a set, prompt user with optional RPE (Rate of Perceived Exertion) 1–10 input. Automatically adjust rest timer suggestion (RPE < 7 → shorter rest, RPE > 8 → longer rest).
- **Files to touch**: `components/workout/SetRow.tsx` (RPE chip row), `hooks/useWorkout.ts`, `components/overlays/RestTimerOverlay.tsx`
- **Effort estimate**: ~half day

### Deferred: Forum / Social Features (EXPLICITLY SEPARATE PROJECT)
- **User stated**: "das ist ein großes separates Feature"
- **What**: Friends system, shared workout sessions, training sync, community feed
- **Why separate**: Requires Supabase real-time subscriptions, user relationship tables (RLS), new auth flows, and a completely new UI system
- **Effort estimate**: Multiple weeks — full sub-project with its own brainstorm → spec → plan cycle
