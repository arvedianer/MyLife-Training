# P1 — Unilateral Rework + Equipment Swap
## Implementation Plan

**Goal:** Fix broken unilateral UI (1 shared weight, L/R reps only, wider inputs), add side-strength stats, and implement smart equipment-swap suggestions.

---

## Discovery Findings

**Current state of unilateral (`SetRow.tsx`):**
- Weight: L and R separate inputs (`weightL`, `weightR`) — WRONG, should be 1 shared weight
- Reps: L and R inputs exist (`repsL`, `repsR`) — correct but columns too narrow
- `SetEntry` has `weightL`, `weightR`, `repsL`, `repsR` in types
- `unilateralSync` flag exists in `WorkoutExercise` but not actively used
- CSS: `.unilateralReps { gap: 6px }` — too tight, needs more space

**Current state of equipment swap:**
- `ExerciseSettingsSheet` has equipment selector + "Übung ersetzen" button
- `onReplaceExercise` callback just opens exercise search
- No smart variation suggestion — user has to manually search
- `utils/variations.ts` has `buildVariationKey()` but no variation lookup

**Files to modify:**
- `components/workout/SetRow.tsx` — unilateral UI fix
- `components/workout/SetRow.module.css` — wider inputs
- `store/workoutStore.ts` — update set handling for unilateral (single weight)
- `utils/variations.ts` — add equipment variation suggestion logic
- `components/workout/ExerciseSettingsSheet.tsx` — smart equipment swap UI
- `constants/exercises.ts` — add equipment variation metadata
- New: `utils/unilateralStats.ts` — side comparison stats

---

## Task 1: Unilateral SetRow Rework

**Files:** `components/workout/SetRow.tsx`, `components/workout/SetRow.module.css`, `types/workout.ts`

### What to build:

**Layout change:**
```
[Set#] [WEIGHT - single input] [L reps] | [R reps] [Volume] [✓] [🗑]
```

Instead of current:
```
[Set#] [L weight] [R weight] [L reps] | [R reps] [Volume] [✓] [🗑]
```

**Step 1: Update `types/workout.ts`**
- Remove `weightL` and `weightR` from `SetEntry` (or deprecate — keep for migration but stop using)
- Keep `repsL` and `repsR`
- Weight is always `set.weight` for unilateral (same for both sides)

**Step 2: Update `SetRow.tsx` — unilateral weight section**
Replace the current L/R weight block with single shared weight input:
```tsx
{/* Weight — always single input, even for unilateral */}
<NumericInput
  value={set.weight}
  onChange={onUpdateWeight}
  step={2.5}
  placeholder={...}
  style={{ flex: 1.2, opacity: set.isCompleted ? 0.55 : 1 }}
/>
```

**Step 3: Update `SetRow.tsx` — reps section for unilateral**
Make L/R reps inputs bigger with proper flex values:
```tsx
<div className={styles.unilateralReps}>
  <span className={styles.sideLabel}>L</span>
  <NumericInput value={...} style={{ flex: 1, minWidth: 44 }} />
  <span className={styles.unilateralDivider}>|</span>
  <span className={styles.sideLabel}>R</span>
  <NumericInput value={...} style={{ flex: 1, minWidth: 44 }} />
</div>
```

**Step 4: Update CSS**
```css
.unilateralReps {
  display: flex;
  align-items: center;
  gap: 8px;  /* was 6px */
  flex: 1.8; /* was flex: 1 — needs more space for two inputs */
  min-width: 0;
}
```

**Step 5: Remove `onUpdateWeightL` / `onUpdateWeightR` props** from SetRow interface (no longer needed). Update `ExerciseCard.tsx` to not pass them.

**Step 6: Volume calculation for unilateral**
In the volume display, use average of L/R reps:
```tsx
const avgReps = isUnilateral && set.repsL && set.repsR
  ? (set.repsL + set.repsR) / 2
  : set.reps;
const vol = set.weight > 0 && avgReps > 0 ? set.weight * avgReps : 0;
```

**Commit:** `fix: unilateral rework — single shared weight, L/R reps only, wider inputs`

---

## Task 2: Side-Strength Stats Utility

**Files:** New `utils/unilateralStats.ts`

### What to build:

```typescript
export interface SideStats {
  exerciseId: string;
  exerciseName: string;
  dominantSide: 'left' | 'right' | 'balanced';
  leftAvgReps: number;
  rightAvgReps: number;
  imbalancePercent: number; // 0 = balanced, 20 = 20% stronger on one side
  trend: 'improving' | 'stable' | 'worsening'; // is imbalance shrinking?
}

export function computeSideStats(sessions: WorkoutSession[]): SideStats[] {
  // Collect all unilateral sets grouped by exerciseId
  // Calculate average reps L vs R per exercise
  // Compare to determine dominant side + imbalance %
  // Compare recent 5 sessions vs older 5 for trend
}
```

**Where to display:** Stats page → new small section "Seiten-Balance" OR in ExerciseCard during workout as small badge.

For MVP: show in workout as small inline badge after completing a unilateral set:
- "L 12× · R 10× → Rechts schwächer (-17%)"

**Commit:** `feat: unilateral side stats — dominant side + imbalance % per exercise`

---

## Task 3: Equipment Swap Smart Suggestions

**Files:** `utils/variations.ts`, `components/workout/ExerciseSettingsSheet.tsx`, `constants/exercises.ts`

### What to build:

**Step 1: Add equipment variations metadata to exercises**

In `constants/exercises.ts`, add `equipmentVariations` to the `Exercise` type:
```typescript
equipmentVariations?: Partial<Record<ExerciseEquipment, string>>
// Maps equipment → exercise ID of the variation
// e.g. bench-press: { barbell: 'bench-press', dumbbell: 'bench-press-dumbbell', machine: 'chest-press-machine' }
```

Add variation mappings for the 10 most common exercises (Bankdrücken, Rudern, Schulterdrücken, Curls, Trizeps, Kniebeuge, Beinpresse, Latzug, Seitheben, Kreuzheben).

**Step 2: Add `findEquipmentVariation()` to `utils/variations.ts`**
```typescript
export function findEquipmentVariation(
  exercise: Exercise,
  targetEquipment: ExerciseEquipment,
  allExercises: Exercise[]
): Exercise | null {
  // Check exercise.equipmentVariations[targetEquipment]
  // If found, return that exercise from allExercises
  // If not found, search by name similarity + equipment tag
  // Return null if no variation exists
}
```

**Step 3: Update `ExerciseSettingsSheet.tsx`**

When user changes equipment, show a suggestion banner instead of (or alongside) the "Übung ersetzen" button:

```tsx
{suggestedVariation && (
  <div style={{
    background: colors.accentBg,
    border: `1px solid ${colors.accent}33`,
    borderRadius: radius.md,
    padding: `${spacing[2]} ${spacing[3]}`,
    marginTop: spacing[2],
  }}>
    <p style={{ ...typography.bodySm, color: colors.textMuted }}>
      Für {EQUIPMENT_LABELS[equipment]} gibt es:
    </p>
    <button onClick={() => onSwapToVariation(suggestedVariation)}>
      → {suggestedVariation.nameDE} übernehmen
    </button>
  </div>
)}
```

**Step 4: Add `onSwapToVariation` callback** in `ExerciseCard` → `workoutStore.replaceExercise()`

**Commit:** `feat: equipment swap suggestions — smart variation lookup when changing equipment`

---

## Verification

After all tasks:
```bash
npx tsc --noEmit
```

Manual test checklist:
- [ ] Start workout with a unilateral exercise (e.g. Kurzhantel Curl)
- [ ] Single weight input visible, L/R reps inputs both wide enough to type in
- [ ] Completing set shows "L 12× · R 10×" summary
- [ ] Change equipment on Bankdrücken from Langhantel to Maschine → suggestion appears
- [ ] Tap suggestion → exercise swaps

---

## Success Criteria

- [ ] Unilateral sets: 1 weight field, 2 reps fields (L + R), both usable
- [ ] Inputs wide enough on mobile (minWidth 44px each)
- [ ] Side imbalance shown after completing set
- [ ] Equipment change → smart variation suggestion
- [ ] TypeScript clean (0 errors)
- [ ] No regressions on bilateral exercises
