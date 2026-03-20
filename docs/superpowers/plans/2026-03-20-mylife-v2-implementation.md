# MY LIFE Training V2 — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform MY LIFE Training into a world-class fitness tracking app — Strong-level UX, intelligent score system, exercise variation tracking with per-variation PRs, and a redesigned dashboard with muscle coverage signals.

**Architecture:** Parallel tracks — data model changes first (Chunk 1), then Active Workout UX (Chunk 2), Score Engine (Chunk 3), Dashboard (Chunk 4), Splits (Chunk 5), AI Coach (Chunk 6), Sharing/PDF (Chunk 7). Figma runs on a separate parallel track.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Zustand + persist, Framer Motion, Recharts, @dnd-kit/core (new), @react-pdf/renderer (new)

**Spec:** `docs/superpowers/specs/2026-03-20-mylife-training-v2-design.md`

**Verification command (no tests):** `npx tsc --noEmit && npm run build`

---

## Chunk 1: Foundation — Design System + Data Model + Dependencies

**Goal:** Install new deps, update tokens, extend types for variations/gyms/score. Everything else builds on this.

### Task 1.1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install new packages**

```bash
cd "D:\arved\20_Projekte\MyLife\(GeminiVersion)Training_App_MyLife"
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @react-pdf/renderer
npm install --save-dev @types/react-pdf
```

- [ ] **Step 2: Verify TypeScript still passes**

```bash
npx tsc --noEmit
```
Expected: no errors (or same errors as before install)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install @dnd-kit and @react-pdf/renderer"
```

---

### Task 1.2: Design Token Updates

**Files:**
- Modify: `constants/tokens.ts`

- [ ] **Step 1: Open `constants/tokens.ts` and add/update these values**

Add to `colors`:
```typescript
ghost:        '#FFFFFF22',   // verblasste Ghost-Values in Inputs
ghostText:    '#FFFFFF35',   // Ghost-Text Farbe
warning:      '#FF9F0A',     // bereits vorhanden? Wenn nicht: hinzufügen
prColor:      '#FFD700',     // PR Gold — bereits vorhanden? Wenn nicht: hinzufügen
volumeColor:  '#60A5FA',     // Blau für Volumen-Metriken
```

Update `radius` — alles großzügiger abrunden:
```typescript
export const radius = {
  sm:   '6px',
  md:   '10px',
  lg:   '14px',
  xl:   '20px',
  '2xl':'28px',
  full: '9999px',
} as const;
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Remove rep-range color highlighting from SetRow**

In `components/workout/SetRow.tsx`:
- Find any conditional color/background that changes based on reps being in/out of repRange
- Remove that styling — inputs should have neutral styling regardless of rep count
- Keep the repRange display in the ExerciseCard header (as a target info badge), just remove the ugly color coding on the input fields themselves

- [ ] **Step 4: Verify build**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add constants/tokens.ts components/workout/SetRow.tsx
git commit -m "design: update tokens for rounder UI, remove rep-range color highlighting"
```

---

### Task 1.3: Extend Type Definitions

**Files:**
- Modify: `types/workout.ts`
- Create: `types/gym.ts`
- Create: `types/score.ts`

- [ ] **Step 1: Create `types/gym.ts`**

```typescript
export interface Gym {
  id: string;        // e.g. "mcfit-berlin-mitte"
  name: string;      // e.g. "McFit Berlin Mitte"
  createdAt: string; // ISO date
}
```

- [ ] **Step 2: Create `types/score.ts`**

```typescript
export interface WorkoutScore {
  total: number;           // 0–100
  volumeScore: number;     // 0–100
  intensityScore: number;  // 0–100
  coverageScore: number;   // 0–100
  durationScore: number;   // 0–100
  rpeScore: number | null; // 0–100, null if no RPE given
  percentileBetter: number; // 0–100, better than X% of own sessions
  weakPoints: WeakPoint[];
  tips: string[];
}

export interface WeakPoint {
  muscle: string;           // e.g. "Trizeps"
  subMuscle?: string;       // e.g. "Long Head"
  message: string;          // e.g. "Trizeps Long Head nicht trainiert"
  suggestedExercise?: string; // e.g. "Overhead Tricep Extension"
}

export interface MuscleSubGroup {
  muscle: string;      // primary muscle ID e.g. "triceps"
  subGroup: string;    // e.g. "long-head"
  labelDE: string;     // e.g. "Langer Kopf"
  trainedBy: string[]; // exercise IDs that train this sub-group
}
```

- [ ] **Step 3: Extend `types/workout.ts`**

Add `variationKey` to `SetEntry`:
```typescript
export interface SetEntry {
  id: string;
  weight: number;
  reps: number;
  isCompleted: boolean;
  isPR: boolean;
  type?: 'normal' | 'warmup' | 'dropset' | 'superset' | 'fail';
  side?: 'both' | 'left' | 'right';
  rpe?: number;
  note?: string;
  variationKey?: string; // NEW: "{exerciseId}::{equipment}::{gymId}"
}
```

Add `variationKey`, `equipment`, `gymId` to `WorkoutExercise`:
```typescript
export interface WorkoutExercise {
  id: string;
  exercise: Exercise;
  sets: SetEntry[];
  isUnilateral: boolean;
  unilateralSync: boolean;
  restSecondsCustom?: number;
  note?: string;
  // NEW fields:
  equipment?: ExerciseEquipment;   // active equipment selection
  gymId?: string;                  // active gym selection
  warmupSetsCount?: number;        // 0–3
  warmupEnabled?: boolean;
}
```

Add equipment type:
```typescript
export type ExerciseEquipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'other';
```

Add PR record type:
```typescript
export interface PRRecord {
  variationKey: string;    // "{exerciseId}::{equipment}::{gymId}"
  weight: number;
  reps: number;
  estimated1RM: number;    // Epley: weight * (1 + reps/30)
  date: string;
  sessionId: string;
}
```

Add session score to `WorkoutSession`:
```typescript
export interface WorkoutSession {
  // ...existing fields...
  score?: WorkoutScore;    // NEW: calculated after session
  rpe?: number;            // NEW: user-provided RPE 0–10
  shareToken?: string;     // NEW: for shareable link
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```
Fix any type errors from the new fields.

- [ ] **Step 5: Commit**

```bash
git add types/
git commit -m "feat: extend types for variations, gyms, PRs, and workout score"
```

---

### Task 1.4: Gym Store

**Files:**
- Create: `store/gymStore.ts`

- [ ] **Step 1: Create `store/gymStore.ts`**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import type { Gym } from '@/types/gym';

interface GymState {
  gyms: Gym[];
  addGym: (name: string) => Gym;
  removeGym: (gymId: string) => void;
  getGymById: (gymId: string) => Gym | undefined;
}

function generateGymId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36);
}

export const useGymStore = create<GymState>()(
  persist(
    (set, get) => ({
      gyms: [],

      addGym: (name: string) => {
        const gym: Gym = {
          id: generateGymId(name),
          name: name.trim(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ gyms: [...state.gyms, gym] }));
        return gym;
      },

      removeGym: (gymId: string) => {
        set((state) => ({ gyms: state.gyms.filter((g) => g.id !== gymId) }));
      },

      getGymById: (gymId: string) => {
        return get().gyms.find((g) => g.id === gymId);
      },
    }),
    {
      name: 'gym-storage',
      storage: zustandStorage,
    }
  )
);
```

- [ ] **Step 2: Create PR store**

Create `store/prStore.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import type { PRRecord } from '@/types/workout';
import { buildVariationKey } from '@/utils/variations'; // single source of truth

interface PRState {
  records: PRRecord[];
  checkAndUpdatePR: (variationKey: string, weight: number, reps: number, sessionId: string, date: string) => boolean;
  getPRForVariation: (variationKey: string) => PRRecord | undefined;
  getAllPRsForExercise: (exerciseId: string) => PRRecord[];
}

function epley1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export { buildVariationKey }; // re-export for convenience — source is utils/variations.ts

export const usePRStore = create<PRState>()(
  persist(
    (set, get) => ({
      records: [],

      checkAndUpdatePR: (variationKey, weight, reps, sessionId, date) => {
        const current = get().records.find((r) => r.variationKey === variationKey);
        const new1RM = epley1RM(weight, reps);
        const isNewPR = !current || new1RM > current.estimated1RM;

        if (isNewPR) {
          const newRecord: PRRecord = { variationKey, weight, reps, estimated1RM: new1RM, date, sessionId };
          set((state) => ({
            records: [
              ...state.records.filter((r) => r.variationKey !== variationKey),
              newRecord,
            ],
          }));
        }
        return isNewPR;
      },

      getPRForVariation: (variationKey) => {
        return get().records.find((r) => r.variationKey === variationKey);
      },

      getAllPRsForExercise: (exerciseId) => {
        return get().records.filter((r) => r.variationKey.startsWith(`${exerciseId}::`));
      },
    }),
    {
      name: 'pr-storage',
      storage: zustandStorage,
    }
  )
);
```

- [ ] **Step 3: Create variation key utility**

Create `utils/variations.ts`:

```typescript
import type { ExerciseEquipment } from '@/types/workout';

export function buildVariationKey(
  exerciseId: string,
  equipment: ExerciseEquipment | string,
  gymId?: string
): string {
  return `${exerciseId}::${equipment}::${gymId ?? 'global'}`;
}

export function parseVariationKey(key: string): {
  exerciseId: string;
  equipment: string;
  gymId: string;
} {
  const [exerciseId, equipment, gymId] = key.split('::');
  return { exerciseId, equipment, gymId };
}

/** Normalize weight for cross-variation comparison (approximate) */
export function normalizeWeightForVariation(
  weight: number,
  equipment: string,
  isUnilateral: boolean
): number {
  // Unilateral: multiply by 2 for bilateral equivalent
  if (isUnilateral) return weight * 2;
  // Cable with pulley factor: approximate 0.9 factor
  if (equipment === 'cable') return weight * 0.9;
  return weight;
}

export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Langhantel',
  dumbbell: 'Kurzhantel',
  cable: 'Kabelturm',
  machine: 'Maschine',
  bodyweight: 'Eigengewicht',
  other: 'Andere',
};
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add store/gymStore.ts store/prStore.ts utils/variations.ts
git commit -m "feat: add gym store, PR store with variation keys, variation utilities"
```

---

## Chunk 2: Active Workout Screen — Full UX Overhaul

**Goal:** Strong-level UX — drag & drop, ghost weights, ⚙️ settings bottom sheet, strikethrough on complete, progressive overload chip.

### Task 2.1: Exercise Settings Bottom Sheet Component

**Files:**
- Create: `components/workout/ExerciseSettingsSheet.tsx`
- Create: `components/workout/ExerciseSettingsSheet.module.css`

- [ ] **Step 1: Create the bottom sheet component**

Create `components/workout/ExerciseSettingsSheet.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';
import { colors, spacing, radius, typography } from '@/constants/tokens';
import { useGymStore } from '@/store/gymStore';
import { EQUIPMENT_LABELS } from '@/utils/variations';
import type { ExerciseEquipment } from '@/types/workout';
import type { Exercise } from '@/types/exercises';
import styles from './ExerciseSettingsSheet.module.css';

interface ExerciseSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise;
  // Current values
  equipment: ExerciseEquipment;
  gymId?: string;
  isUnilateral: boolean;
  restSeconds: number;
  warmupEnabled: boolean;
  warmupCount: number;
  repRangeMin: number;
  repRangeMax: number;
  note?: string;
  // Callbacks
  onEquipmentChange: (eq: ExerciseEquipment) => void;
  onGymChange: (gymId: string | undefined) => void;
  onUnilateralChange: (val: boolean) => void;
  onRestChange: (seconds: number) => void;
  onWarmupChange: (enabled: boolean, count: number) => void;
  onRepRangeChange: (min: number, max: number) => void;
  onNoteChange: (note: string) => void;
  onRemoveExercise: () => void;
  onReplaceExercise: () => void;
  // History
  onShowHistory: () => void;
}

const EQUIPMENT_OPTIONS: ExerciseEquipment[] = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'other'];
const REST_PRESETS = [60, 90, 120, 180, 300];
const WARMUP_COUNTS = [1, 2, 3];

export function ExerciseSettingsSheet({
  isOpen, onClose, exercise,
  equipment, gymId, isUnilateral, restSeconds, warmupEnabled, warmupCount,
  repRangeMin, repRangeMax, note,
  onEquipmentChange, onGymChange, onUnilateralChange, onRestChange,
  onWarmupChange, onRepRangeChange, onNoteChange,
  onRemoveExercise, onReplaceExercise, onShowHistory,
}: ExerciseSettingsSheetProps) {
  const { gyms, addGym } = useGymStore();
  const [showAddGym, setShowAddGym] = useState(false);
  const [newGymName, setNewGymName] = useState('');

  const handleAddGym = () => {
    if (!newGymName.trim()) return;
    const gym = addGym(newGymName.trim());
    onGymChange(gym.id);
    setNewGymName('');
    setShowAddGym(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
              zIndex: 100,
            }}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            onDragEnd={(_, info) => { if (info.offset.y > 80) onClose(); }}
            className={styles.sheet}
          >
            {/* Handle */}
            <div className={styles.handle} />

            {/* Header */}
            <div className={styles.sheetHeader}>
              <div>
                <div className={styles.sheetTitle}>{exercise.nameDE}</div>
                <div className={styles.sheetSubtitle}>Übungseinstellungen</div>
              </div>
              <button onClick={onClose} className={styles.closeBtn}>
                <X size={20} color={colors.textMuted} />
              </button>
            </div>

            <div className={styles.scrollContent}>
              {/* EQUIPMENT */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>EQUIPMENT</div>
                <div className={styles.chipRow}>
                  {EQUIPMENT_OPTIONS.map((eq) => (
                    <button
                      key={eq}
                      onClick={() => onEquipmentChange(eq)}
                      className={`${styles.chip} ${equipment === eq ? styles.chipActive : ''}`}
                    >
                      {EQUIPMENT_LABELS[eq]}
                    </button>
                  ))}
                </div>
              </div>

              {/* SEITIG */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>SEITIG</div>
                <div className={styles.chipRow}>
                  <button
                    onClick={() => onUnilateralChange(false)}
                    className={`${styles.chip} ${!isUnilateral ? styles.chipActive : ''}`}
                  >
                    Bilateral
                  </button>
                  <button
                    onClick={() => onUnilateralChange(true)}
                    className={`${styles.chip} ${isUnilateral ? styles.chipActive : ''}`}
                  >
                    Unilateral
                  </button>
                </div>
              </div>

              {/* GYM */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>GYM (optional)</div>
                <div className={styles.chipRow}>
                  <button
                    onClick={() => onGymChange(undefined)}
                    className={`${styles.chip} ${!gymId ? styles.chipActive : ''}`}
                  >
                    Kein Gym
                  </button>
                  {gyms.map((gym) => (
                    <button
                      key={gym.id}
                      onClick={() => onGymChange(gym.id)}
                      className={`${styles.chip} ${gymId === gym.id ? styles.chipActive : ''}`}
                    >
                      {gym.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowAddGym(true)}
                    className={styles.chip}
                  >
                    + Gym hinzufügen
                  </button>
                </div>
                {showAddGym && (
                  <div style={{ display: 'flex', gap: spacing[2], marginTop: spacing[2] }}>
                    <input
                      value={newGymName}
                      onChange={(e) => setNewGymName(e.target.value)}
                      placeholder="Gym Name..."
                      onKeyDown={(e) => e.key === 'Enter' && handleAddGym()}
                      className={styles.gymInput}
                      autoFocus
                    />
                    <button onClick={handleAddGym} className={styles.chipActive + ' ' + styles.chip}>OK</button>
                    <button onClick={() => setShowAddGym(false)} className={styles.chip}>
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* REST TIMER */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>PAUSE NACH SATZ</div>
                <div className={styles.chipRow}>
                  {REST_PRESETS.map((s) => (
                    <button
                      key={s}
                      onClick={() => onRestChange(s)}
                      className={`${styles.chip} ${restSeconds === s ? styles.chipActive : ''}`}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
              </div>

              {/* WARM-UP SÄTZE */}
              <div className={styles.section}>
                <div className={styles.sectionLabelRow}>
                  <span className={styles.sectionLabel}>WARM-UP SÄTZE</span>
                  <button
                    onClick={() => onWarmupChange(!warmupEnabled, warmupCount)}
                    className={`${styles.toggle} ${warmupEnabled ? styles.toggleActive : ''}`}
                  >
                    {warmupEnabled ? 'AN' : 'AUS'}
                  </button>
                </div>
                {warmupEnabled && (
                  <div className={styles.chipRow}>
                    {WARMUP_COUNTS.map((n) => (
                      <button
                        key={n}
                        onClick={() => onWarmupChange(true, n)}
                        className={`${styles.chip} ${warmupCount === n ? styles.chipActive : ''}`}
                      >
                        {n} Satz{n > 1 ? 'e' : ''}
                      </button>
                    ))}
                  </div>
                )}
                {warmupEnabled && (
                  <p className={styles.hint}>Warm-up Sätze zählen nicht in Stats oder Score</p>
                )}
              </div>

              {/* WIEDERHOLUNGSBEREICH */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>WIEDERHOLUNGSBEREICH</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                  <span className={styles.rangeLabel}>{repRangeMin}</span>
                  <input
                    type="range" min={1} max={repRangeMax - 1} value={repRangeMin}
                    onChange={(e) => onRepRangeChange(Number(e.target.value), repRangeMax)}
                    className={styles.slider}
                  />
                  <input
                    type="range" min={repRangeMin + 1} max={30} value={repRangeMax}
                    onChange={(e) => onRepRangeChange(repRangeMin, Number(e.target.value))}
                    className={styles.slider}
                  />
                  <span className={styles.rangeLabel}>{repRangeMax}</span>
                </div>
              </div>

              {/* NOTIZEN */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>NOTIZEN</div>
                <textarea
                  value={note ?? ''}
                  onChange={(e) => onNoteChange(e.target.value)}
                  placeholder="Ausführungshinweise, Cues..."
                  className={styles.textarea}
                  rows={2}
                />
              </div>

              {/* ERWEITERT */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>ERWEITERT</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                  <button onClick={onShowHistory} className={styles.extendedBtn}>
                    Letzte 5 Einheiten →
                  </button>
                </div>
              </div>

              {/* DANGER ZONE */}
              <div className={styles.dangerSection}>
                <button onClick={onReplaceExercise} className={styles.replaceBtn}>
                  Übung ersetzen
                </button>
                <button onClick={onRemoveExercise} className={styles.removeBtn}>
                  Übung entfernen
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Create CSS module for the sheet**

Create `components/workout/ExerciseSettingsSheet.module.css`:

```css
.sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #0E0E0E;
  border-top: 1px solid #262626;
  border-radius: 28px 28px 0 0;
  z-index: 101;
  max-height: 85dvh;
  display: flex;
  flex-direction: column;
}

.handle {
  width: 40px;
  height: 4px;
  background-color: #262626;
  border-radius: 9999px;
  margin: 12px auto 0;
  flex-shrink: 0;
}

.sheetHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid #1E1E1E;
  flex-shrink: 0;
}

.sheetTitle {
  font-size: 16px;
  font-weight: 700;
  color: #FFFFFF;
  line-height: 1.3;
}

.sheetSubtitle {
  font-size: 11px;
  color: #888888;
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.closeBtn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #888888;
}

.scrollContent {
  overflow-y: auto;
  padding: 0 20px 40px;
  flex: 1;
}

.section {
  padding: 16px 0;
  border-bottom: 1px solid #1E1E1E;
}

.sectionLabel {
  font-size: 10px;
  font-weight: 700;
  color: #888888;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 10px;
}

.sectionLabelRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.chipRow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 6px 14px;
  border-radius: 9999px;
  border: 1px solid #262626;
  background: #161616;
  color: #AAAAAA;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.chip:active { opacity: 0.7; }

.chipActive {
  background-color: #0A1F1A;
  border-color: #4DFFED;
  color: #4DFFED;
}

.toggle {
  padding: 4px 12px;
  border-radius: 9999px;
  border: 1px solid #262626;
  background: #161616;
  color: #888888;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.toggleActive {
  background-color: #0A1F1A;
  border-color: #4DFFED;
  color: #4DFFED;
}

.hint {
  font-size: 11px;
  color: #555555;
  margin-top: 8px;
  font-style: italic;
}

.rangeLabel {
  font-size: 14px;
  font-weight: 700;
  color: #4DFFED;
  min-width: 24px;
  text-align: center;
}

.slider {
  flex: 1;
  accent-color: #4DFFED;
}

.gymInput {
  flex: 1;
  background: #161616;
  border: 1px solid #262626;
  border-radius: 10px;
  padding: 8px 12px;
  color: #FFFFFF;
  font-size: 14px;
}

.textarea {
  width: 100%;
  background: #161616;
  border: 1px solid #262626;
  border-radius: 10px;
  padding: 10px 12px;
  color: #FFFFFF;
  font-size: 13px;
  resize: none;
  font-family: inherit;
}

.extendedBtn {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #262626;
  background: #161616;
  color: #AAAAAA;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.dangerSection {
  padding-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.replaceBtn {
  padding: 12px;
  border-radius: 14px;
  border: 1px solid #262626;
  background: #161616;
  color: #AAAAAA;
  font-size: 14px;
  cursor: pointer;
}

.removeBtn {
  padding: 12px;
  border-radius: 14px;
  border: 1px solid #1F0A0A;
  background: #1F0A0A;
  color: #FF3B30;
  font-size: 14px;
  cursor: pointer;
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/workout/ExerciseSettingsSheet.tsx components/workout/ExerciseSettingsSheet.module.css
git commit -m "feat: add ExerciseSettingsSheet bottom sheet component"
```

---

### Task 2.2: Redesign ExerciseCard

**Files:**
- Modify: `components/workout/ExerciseCard.tsx`
- Modify: `components/workout/ExerciseCard.module.css`

Key changes:
1. Replace ArrowUp/ArrowDown with drag handle (≡) — dnd-kit handles the actual sorting
2. Replace inline rest timer editing with ⚙️ icon opening ExerciseSettingsSheet
3. Remove "Warum?" button (moves to settings sheet)
4. Add strikethrough on exercise name when fully completed
5. Show progressive overload chip above sets

- [ ] **Step 1: Update ExerciseCard.tsx**

Replace the entire `ExerciseCard.tsx` with the redesigned version. Key structural changes:

**Header section becomes:**
```typescript
<div className={styles.headerContainer}>
  {/* Drag Handle — actual drag functionality wired in parent */}
  <div className={styles.dragHandle} {...dragHandleProps}>
    <GripVertical size={18} color={colors.textFaint} />
  </div>

  <div style={{ flex: 1, minWidth: 0 }}>
    {/* Exercise Name — strikethrough when fully completed */}
    <h3 className={`${styles.exerciseTitle} ${isFullyCompleted ? styles.exerciseTitleDone : ''}`}>
      {exercise.nameDE}
      {isFullyCompleted && <Check size={16} color={colors.success} style={{ marginLeft: 6 }} />}
    </h3>
    {/* Sub-info row */}
    <div className={styles.subInfo}>
      <span className={styles.muscleLabel}>{MUSCLE_LABELS[exercise.primaryMuscle] ?? exercise.primaryMuscle}</span>
      <span className={styles.dot}>·</span>
      <span className={styles.setsLabel}>{completedSets}/{sets.length} Sätze</span>
      {workoutExercise.equipment && (
        <>
          <span className={styles.dot}>·</span>
          <span className={styles.equipLabel}>{EQUIPMENT_LABELS[workoutExercise.equipment]}</span>
        </>
      )}
    </div>

    {/* Progressive Overload Chip */}
    {overloadSuggestion && !isFullyCompleted && (
      <button onClick={() => onApplySuggestion?.(overloadSuggestion.weight, overloadSuggestion.reps)}
        className={styles.overloadChip}>
        <TrendingUp size={11} color={colors.accent} />
        <span>{overloadSuggestion.weight}kg × {overloadSuggestion.reps} Wdh.</span>
        <span className={styles.overloadReason}>{overloadSuggestion.reason}</span>
      </button>
    )}
  </div>

  {/* Settings Icon — replaces old row of action buttons */}
  <button onClick={() => setShowSettings(true)} className={styles.settingsBtn}>
    <Settings size={18} color={colors.textMuted} />
  </button>
</div>
```

Add `showSettings` state and the `ExerciseSettingsSheet` at the bottom of the component:
```typescript
const [showSettings, setShowSettings] = useState(false);

// ... rest of component ...

<ExerciseSettingsSheet
  isOpen={showSettings}
  onClose={() => setShowSettings(false)}
  exercise={exercise}
  equipment={workoutExercise.equipment ?? getDefaultEquipment(exercise)}
  gymId={workoutExercise.gymId}
  isUnilateral={workoutExercise.isUnilateral}
  restSeconds={restSeconds}
  warmupEnabled={workoutExercise.warmupEnabled ?? false}
  warmupCount={workoutExercise.warmupSetsCount ?? 1}
  repRangeMin={exercise.repRange?.min ?? 6}
  repRangeMax={exercise.repRange?.max ?? 12}
  note={workoutExercise.note}
  onEquipmentChange={(eq) => onUpdateExercise?.({ equipment: eq })}
  onGymChange={(gymId) => onUpdateExercise?.({ gymId })}
  onUnilateralChange={(val) => { onToggleUnilateral?.(); }}
  onRestChange={(s) => onUpdateExercise?.({ restSecondsCustom: s })}
  onWarmupChange={(enabled, count) => onUpdateExercise?.({ warmupEnabled: enabled, warmupSetsCount: count })}
  onRepRangeChange={(min, max) => { /* local state only for now */ }}
  onNoteChange={(note) => onUpdateExercise?.({ note })}
  onRemoveExercise={() => { setShowSettings(false); onRemoveExercise(); }}
  onReplaceExercise={() => { setShowSettings(false); /* open replace modal */ }}
  onShowHistory={() => setShowHistory(true)}
/>
```

Add `onUpdateExercise` callback to the ExerciseCardProps interface:
```typescript
onUpdateExercise?: (updates: Partial<WorkoutExercise>) => void;
```

- [ ] **Step 2: Update ExerciseCard.module.css**

Add new CSS classes:
```css
.dragHandle {
  cursor: grab;
  padding: 4px;
  display: flex;
  align-items: center;
  color: #555555;
  flex-shrink: 0;
  margin-right: 8px;
}

.dragHandle:active { cursor: grabbing; }

.exerciseTitleDone {
  text-decoration: line-through;
  color: #555555;
}

.subInfo {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  flex-wrap: wrap;
}

.muscleLabel, .setsLabel, .equipLabel {
  font-size: 11px;
  color: #888888;
}

.dot { font-size: 11px; color: #555555; }

.settingsBtn {
  padding: 8px;
  border-radius: 10px;
  background: none;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.15s;
}
.settingsBtn:hover { background-color: #1E1E1E; }

.overloadChip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding: 4px 10px;
  background: #0A1F1A;
  border: 1px solid #4DFFED30;
  border-radius: 9999px;
  cursor: pointer;
  font-size: 11px;
  color: #4DFFED;
  max-width: 100%;
  overflow: hidden;
}

.overloadReason {
  font-size: 10px;
  color: #888888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Fix type errors — the new `onUpdateExercise` prop needs to be passed from `active/page.tsx`.

- [ ] **Step 4: Commit**

```bash
git add components/workout/ExerciseCard.tsx components/workout/ExerciseCard.module.css
git commit -m "feat: redesign ExerciseCard with settings icon, strikethrough, drag handle"
```

---

### Task 2.3: Ghost Weight in SetRow

**Files:**
- Modify: `components/workout/SetRow.tsx`

- [ ] **Step 1: Add `previousWeight` and `previousReps` props**

```typescript
interface SetRowProps {
  // ...existing props...
  previousWeight?: number; // from last session — shown as ghost
  previousReps?: number;
  previousVariationKey?: string; // to fetch correct previous
}
```

- [ ] **Step 2: Implement ghost placeholder in inputs**

In the weight input, show previous value as placeholder (ghost):
```typescript
// In the input element for weight:
<input
  type="number"
  value={set.weight === 0 ? '' : set.weight}
  placeholder={previousWeight !== undefined ? String(previousWeight) : '0'}
  onChange={(e) => onUpdateWeight(parseFloat(e.target.value) || 0)}
  className={styles.input}
  style={{
    color: set.weight === 0 && previousWeight !== undefined ? colors.ghostText : colors.textPrimary,
  }}
/>
```

- [ ] **Step 3: One-tap complete with ghost values**

When user taps ✓ and weight/reps are still 0 but ghost values exist:
```typescript
const handleToggle = () => {
  // Auto-fill ghost values before completing
  if (!set.isCompleted && set.weight === 0 && previousWeight) {
    onUpdateWeight(previousWeight);
  }
  if (!set.isCompleted && set.reps === 0 && previousReps) {
    onUpdateReps(previousReps);
  }
  onToggleComplete();
};
```

- [ ] **Step 4: Pass previous values from ExerciseCard**

In `ExerciseCard.tsx`, look up previous session data for this exercise+variation:
```typescript
// In ExerciseCard, get last session's sets for this exercise
import { useHistoryStore } from '@/store/historyStore';

// Inside component:
const { sessions } = useHistoryStore();
const lastSession = sessions
  .filter(s => s.exercises.some(e =>
    e.exercise.id === exercise.id &&
    (!workoutExercise.equipment || e.equipment === workoutExercise.equipment)
  ))[0];
const lastSets = lastSession?.exercises.find(e => e.exercise.id === exercise.id)?.sets ?? [];
```

Pass to each SetRow:
```typescript
<SetRow
  // ...
  previousWeight={lastSets[index]?.weight}
  previousReps={lastSets[index]?.reps}
/>
```

- [ ] **Step 5: Verify TypeScript + build**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add components/workout/SetRow.tsx components/workout/ExerciseCard.tsx
git commit -m "feat: ghost weight/reps from previous session in SetRow inputs"
```

---

### Task 2.4: Drag & Drop Exercise Reordering

**Files:**
- Modify: `app/workout/active/page.tsx`
- Create: `components/workout/SortableExerciseCard.tsx`

- [ ] **Step 1: Create SortableExerciseCard wrapper**

Create `components/workout/SortableExerciseCard.tsx`:

```typescript
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExerciseCard } from './ExerciseCard';
import type { ComponentProps } from 'react';

type Props = ComponentProps<typeof ExerciseCard> & { sortId: string };

export function SortableExerciseCard({ sortId, ...cardProps }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ExerciseCard
        {...cardProps}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Update active workout page with DndContext**

In `app/workout/active/page.tsx`, wrap the exercises list:

```typescript
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { SortableExerciseCard } from '@/components/workout/SortableExerciseCard';

// Inside component:
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
);

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id || !activeWorkout) return;

  const oldIndex = activeWorkout.exercises.findIndex(e => e.id === active.id);
  const newIndex = activeWorkout.exercises.findIndex(e => e.id === over.id);
  const reordered = arrayMove(activeWorkout.exercises, oldIndex, newIndex);
  reorderExercises(reordered);
};

// In the JSX, replace the exercises.map with:
<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext
    items={activeWorkout.exercises.map(e => e.id)}
    strategy={verticalListSortingStrategy}
  >
    {activeWorkout.exercises.map((workoutExercise, index) => (
      <SortableExerciseCard
        key={workoutExercise.id}
        sortId={workoutExercise.id}
        workoutExercise={workoutExercise}
        // ...rest of props...
        onMoveUp={undefined}    // remove old up/down buttons
        onMoveDown={undefined}
      />
    ))}
  </SortableContext>
</DndContext>
```

- [ ] **Step 3: Add `dragHandleProps` to ExerciseCard props**

In `ExerciseCard.tsx` add:
```typescript
dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
```
And spread them on the drag handle div.

- [ ] **Step 4: Verify TypeScript + build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add app/workout/active/ components/workout/SortableExerciseCard.tsx components/workout/ExerciseCard.tsx
git commit -m "feat: drag & drop exercise reordering with @dnd-kit"
```

---

## Chunk 3: Workout Score Engine + New Summary

**Goal:** Deterministic 0–100 score based on sports science, redesigned summary page with score breakdown, weak points, tips, and RPE input.

### Task 3.1: Muscle Subgroup Database

**Files:**
- Create: `constants/muscleSubGroups.ts`

- [ ] **Step 1: Create the subgroup database**

Create `constants/muscleSubGroups.ts`:

```typescript
import type { MuscleSubGroup } from '@/types/score';

export const muscleSubGroups: MuscleSubGroup[] = [
  // CHEST
  { muscle: 'chest', subGroup: 'upper', labelDE: 'Obere Brust', trainedBy: ['incline-barbell-press', 'incline-dumbbell-press', 'cable-fly-high'] },
  { muscle: 'chest', subGroup: 'middle', labelDE: 'Mittlere Brust', trainedBy: ['bench-press', 'dumbbell-press', 'pec-deck', 'seated-cable-fly'] },
  { muscle: 'chest', subGroup: 'lower', labelDE: 'Untere Brust', trainedBy: ['decline-press', 'dip', 'cable-fly-low'] },

  // BACK
  { muscle: 'back', subGroup: 'upper', labelDE: 'Oberer Rücken', trainedBy: ['row-barbell', 'row-dumbbell', 'face-pull'] },
  { muscle: 'back', subGroup: 'lats', labelDE: 'Lats (Breite)', trainedBy: ['lat-pulldown', 'pull-up', 'straight-arm-pulldown'] },
  { muscle: 'back', subGroup: 'lower', labelDE: 'Unterer Rücken', trainedBy: ['deadlift', 'hyperextension', 'good-morning'] },

  // SHOULDERS
  { muscle: 'shoulders', subGroup: 'anterior', labelDE: 'Vordere Schulter', trainedBy: ['overhead-press', 'front-raise', 'incline-barbell-press'] },
  { muscle: 'shoulders', subGroup: 'medial', labelDE: 'Seitliche Schulter', trainedBy: ['lateral-raise', 'cable-lateral-raise', 'upright-row'] },
  { muscle: 'shoulders', subGroup: 'posterior', labelDE: 'Hintere Schulter', trainedBy: ['face-pull', 'reverse-fly', 'row-barbell'] },

  // ARMS
  { muscle: 'triceps', subGroup: 'long-head', labelDE: 'Langer Kopf', trainedBy: ['overhead-tricep-extension', 'skull-crusher', 'cable-overhead-extension'] },
  { muscle: 'triceps', subGroup: 'lateral-head', labelDE: 'Lateraler Kopf', trainedBy: ['pushdown', 'dip', 'close-grip-bench'] },
  { muscle: 'biceps', subGroup: 'long-head', labelDE: 'Langer Kopf', trainedBy: ['incline-curl', 'hammer-curl', 'barbell-curl'] },
  { muscle: 'biceps', subGroup: 'short-head', labelDE: 'Kurzer Kopf', trainedBy: ['preacher-curl', 'concentration-curl', 'cable-curl'] },

  // LEGS
  { muscle: 'quads', subGroup: 'overall', labelDE: 'Quadrizeps', trainedBy: ['squat', 'leg-press', 'leg-extension', 'hack-squat'] },
  { muscle: 'hamstrings', subGroup: 'overall', labelDE: 'Hamstrings', trainedBy: ['romanian-deadlift', 'leg-curl', 'deadlift'] },
  { muscle: 'glutes', subGroup: 'overall', labelDE: 'Gesäß', trainedBy: ['squat', 'hip-thrust', 'deadlift', 'romanian-deadlift'] },
  { muscle: 'calves', subGroup: 'overall', labelDE: 'Waden', trainedBy: ['calf-raise', 'seated-calf-raise'] },

  // CORE
  { muscle: 'core', subGroup: 'overall', labelDE: 'Core', trainedBy: ['plank', 'ab-wheel', 'hanging-leg-raise', 'crunch'] },
];

export function getSubGroupsForMuscle(muscle: string): MuscleSubGroup[] {
  return muscleSubGroups.filter(sg => sg.muscle === muscle);
}

export function getMissingSubGroups(trainedExerciseIds: string[], targetMuscles: string[]): MuscleSubGroup[] {
  const missing: MuscleSubGroup[] = [];
  for (const muscle of targetMuscles) {
    const subGroups = getSubGroupsForMuscle(muscle);
    for (const sg of subGroups) {
      const isTrained = sg.trainedBy.some(id => trainedExerciseIds.includes(id));
      if (!isTrained) missing.push(sg);
    }
  }
  return missing;
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add constants/muscleSubGroups.ts
git commit -m "feat: add muscle sub-group database for score coverage tracking"
```

---

### Task 3.2: Score Calculation Engine

**Files:**
- Create: `utils/scoreEngine.ts`

- [ ] **Step 1: Create the score engine**

Create `utils/scoreEngine.ts`:

```typescript
import type { WorkoutSession } from '@/types/workout';
import type { WorkoutScore, WeakPoint } from '@/types/score';
import { getMissingSubGroups, getSubGroupsForMuscle } from '@/constants/muscleSubGroups';
import { getExerciseById } from '@/constants/exercises';

const MEV_PER_MUSCLE = 10; // Minimum Effective Volume (sets/week)
const MAV_PER_MUSCLE = 20; // Maximum Adaptive Volume (sets/week)
const OPTIMAL_DURATION_MIN = 40; // minutes
const OPTIMAL_DURATION_MAX = 75; // minutes

function epley1RM(weight: number, reps: number): number {
  if (reps <= 0) return weight;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Intensity Score based on Prilepin table zones.
 * Returns 0–100 based on how well % 1RM aligns with user's goal.
 */
function calcIntensityScore(
  sessions: WorkoutSession[],
  currentSession: WorkoutSession,
  goal: string
): number {
  const targetIntensityRange = {
    muskelaufbau: { min: 0.65, max: 0.85 }, // 65–85% 1RM
    kraft: { min: 0.80, max: 0.95 },
    ausdauer: { min: 0.50, max: 0.70 },
    abnehmen: { min: 0.55, max: 0.75 },
    fitness: { min: 0.60, max: 0.80 },
  }[goal] ?? { min: 0.65, max: 0.85 };

  let totalScore = 0;
  let setsWithData = 0;

  for (const ex of currentSession.exercises) {
    // Estimate 1RM from best historical set or current set
    const completedSets = ex.sets.filter(s => s.isCompleted && s.weight > 0 && s.reps > 0);
    if (completedSets.length === 0) continue;

    const best1RM = Math.max(...completedSets.map(s => epley1RM(s.weight, s.reps)));

    for (const set of completedSets) {
      if (best1RM <= 0) continue;
      const relativeIntensity = set.weight / best1RM;
      // Score = how close is intensity to target range
      let setScore: number;
      if (relativeIntensity >= targetIntensityRange.min && relativeIntensity <= targetIntensityRange.max) {
        setScore = 100;
      } else if (relativeIntensity < targetIntensityRange.min) {
        setScore = clamp((relativeIntensity / targetIntensityRange.min) * 100, 0, 100);
      } else {
        // Too heavy (above max) — slightly penalized
        setScore = clamp(100 - ((relativeIntensity - targetIntensityRange.max) / 0.1) * 20, 60, 100);
      }
      totalScore += setScore;
      setsWithData++;
    }
  }

  return setsWithData > 0 ? Math.round(totalScore / setsWithData) : 70;
}

/** Volume score based on MEV/MAV principles */
function calcVolumeScore(currentSession: WorkoutSession): number {
  const muscleSetCounts: Record<string, number> = {};

  for (const ex of currentSession.exercises) {
    const exercise = getExerciseById(ex.exercise.id);
    if (!exercise) continue;
    const workedSets = ex.sets.filter(s => s.isCompleted && s.type !== 'warmup').length;
    const muscle = exercise.primaryMuscle;
    muscleSetCounts[muscle] = (muscleSetCounts[muscle] ?? 0) + workedSets;
  }

  const muscles = Object.keys(muscleSetCounts);
  if (muscles.length === 0) return 50;

  // Score each muscle based on its sets relative to single-session optimal (~4–6 sets)
  const SESSION_OPTIMAL = 5; // sets per muscle per session
  const scores = muscles.map(m => {
    const sets = muscleSetCounts[m];
    if (sets === 0) return 0;
    if (sets >= 3 && sets <= 7) return 100;
    if (sets < 3) return clamp((sets / 3) * 100, 20, 100);
    // Too many sets per session = diminishing returns
    return clamp(100 - ((sets - 7) * 8), 60, 100);
  });

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/** Coverage score based on planned vs. trained muscle sub-groups */
function calcCoverageScore(
  currentSession: WorkoutSession,
  plannedMuscles: string[]
): { score: number; weakPoints: WeakPoint[] } {
  const trainedExerciseIds = currentSession.exercises
    .filter(e => e.sets.some(s => s.isCompleted))
    .map(e => e.exercise.id);

  if (plannedMuscles.length === 0) {
    // No plan — score based on variety
    const musclesCovered = new Set(
      currentSession.exercises.map(e => e.exercise.primaryMuscle)
    ).size;
    return { score: Math.min(musclesCovered * 25, 100), weakPoints: [] };
  }

  const missing = getMissingSubGroups(trainedExerciseIds, plannedMuscles);
  // Use already-imported getSubGroupsForMuscle (no require() — ESM only)
  const totalSubGroups = plannedMuscles.reduce((sum, m) => {
    return sum + (getSubGroupsForMuscle(m).length || 1);
  }, 0);

  const score = totalSubGroups > 0
    ? Math.round(((totalSubGroups - missing.length) / totalSubGroups) * 100)
    : 80;

  const weakPoints: WeakPoint[] = missing.slice(0, 3).map(sg => ({
    muscle: sg.muscle,
    subMuscle: sg.labelDE,
    message: `${sg.labelDE} nicht trainiert`,
    suggestedExercise: sg.trainedBy[0],
  }));

  return { score, weakPoints };
}

/** Duration score — optimal 40–75 min */
function calcDurationScore(durationSeconds: number): number {
  const minutes = durationSeconds / 60;
  if (minutes >= OPTIMAL_DURATION_MIN && minutes <= OPTIMAL_DURATION_MAX) return 100;
  if (minutes < OPTIMAL_DURATION_MIN) {
    return clamp(Math.round((minutes / OPTIMAL_DURATION_MIN) * 100), 20, 100);
  }
  // Over optimal — diminishing returns but not heavily penalized
  return clamp(Math.round(100 - ((minutes - OPTIMAL_DURATION_MAX) / 30) * 40), 40, 100);
}

/** RPE score — optimal RPE 7–8.5 */
function calcRPEScore(rpe: number | undefined): number | null {
  if (rpe === undefined || rpe === null) return null;
  if (rpe >= 7 && rpe <= 8.5) return 100;
  if (rpe < 7) return clamp(Math.round((rpe / 7) * 100), 20, 100);
  return clamp(Math.round(100 - ((rpe - 8.5) / 1.5) * 60), 20, 100);
}

/** Generate deterministic coaching tips */
function generateTips(
  session: WorkoutSession,
  volumeScore: number,
  intensityScore: number,
  coverageScore: number,
  durationScore: number,
  weakPoints: WeakPoint[]
): string[] {
  const tips: string[] = [];

  if (volumeScore < 70) tips.push('Volumen erhöhen: versuche 1–2 Sätze mehr pro Muskelgruppe');
  if (intensityScore < 65) tips.push('Gewicht leicht erhöhen für bessere Intensität');
  if (coverageScore < 70 && weakPoints.length > 0) {
    tips.push(`${weakPoints[0].subMuscle ?? weakPoints[0].muscle} zu wenig trainiert — ${weakPoints[0].suggestedExercise ?? 'geeignete Übung hinzufügen'}`);
  }
  if (durationScore < 60) {
    const minutes = session.durationSeconds / 60;
    if (minutes > OPTIMAL_DURATION_MAX) tips.push('Training war zu lang — fokussierter trainieren, kürzere Pausen');
    else tips.push('Training war sehr kurz — Volumen erhöhen für bessere Adaption');
  }

  // Per-exercise progressive overload tips
  for (const ex of session.exercises) {
    const completed = ex.sets.filter(s => s.isCompleted);
    if (completed.length === 0) continue;
    const exercise = getExerciseById(ex.exercise.id);
    if (!exercise?.repRange) continue;
    const allHitMax = completed.every(s => s.reps >= exercise.repRange!.max);
    if (allHitMax) {
      tips.push(`${exercise.nameDE}: obere Grenze erreicht → +2.5kg beim nächsten Mal`);
    }
  }

  return tips.slice(0, 5); // Max 5 tips
}

/** Main score calculation function */
export function calculateWorkoutScore(
  session: WorkoutSession,
  goal: string,
  plannedMuscles: string[],
  previousSessions: WorkoutSession[]
): WorkoutScore {
  const volumeScore = calcVolumeScore(session);
  const intensityScore = calcIntensityScore(previousSessions, session, goal);
  const { score: coverageScore, weakPoints } = calcCoverageScore(session, plannedMuscles);
  const durationScore = calcDurationScore(session.durationSeconds);
  const rpeScore = calcRPEScore(session.rpe);

  // Weighted total — weights always sum to 1.0
  // When RPE is absent: redistribute its 5% proportionally across other categories
  const hasRPE = rpeScore !== null;
  const total = hasRPE
    ? Math.round(
        volumeScore  * 0.35 +
        intensityScore * 0.25 +
        coverageScore  * 0.25 +
        durationScore  * 0.10 +
        rpeScore!      * 0.05
      )
    : Math.round(
        volumeScore  * 0.368 +  // 0.35 / 0.95
        intensityScore * 0.263 + // 0.25 / 0.95
        coverageScore  * 0.263 + // 0.25 / 0.95
        durationScore  * 0.105   // 0.10 / 0.95 — sums to ~0.999
      );

  // Percentile — how does this compare to own history?
  const allScores = previousSessions
    .filter(s => s.score?.total !== undefined)
    .map(s => s.score!.total);
  const betterThan = allScores.length > 0
    ? Math.round((allScores.filter(s => s < total).length / allScores.length) * 100)
    : 50;

  const tips = generateTips(session, volumeScore, intensityScore, coverageScore, durationScore, weakPoints);

  return {
    total: clamp(total, 0, 100),
    volumeScore,
    intensityScore,
    coverageScore,
    durationScore,
    rpeScore,
    percentileBetter: betterThan,
    weakPoints,
    tips,
  };
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add utils/scoreEngine.ts constants/muscleSubGroups.ts
git commit -m "feat: deterministic workout score engine with sports-science formula"
```

---

### Task 3.3: Redesign Summary Page

**Files:**
- Modify: `app/workout/summary/page.tsx`
- Create: `app/workout/summary/page.module.css`

- [ ] **Step 1: Add RPE input and score calculation to summary**

In `app/workout/summary/page.tsx`:

1. Add state for RPE:
```typescript
const [rpe, setRpe] = useState<number | undefined>(undefined);
```

2. Calculate score (after session loads):
```typescript
import { calculateWorkoutScore } from '@/utils/scoreEngine';
import { useUserStore } from '@/store/userStore';

const { profile } = useUserStore();
const previousSessions = useHistoryStore(state =>
  state.sessions.filter(s => s.id !== sessionId).slice(0, 10)
);

// Calculate score (with current rpe)
const score = session ? calculateWorkoutScore(
  { ...session, rpe },
  profile?.goal ?? 'fitness',
  [], // planned muscles — derive from split if available
  previousSessions
) : null;
```

3. Replace the "DEIN COACH SAGT" AI block with the new score section:

```typescript
{/* SCORE HERO */}
<div style={{
  textAlign: 'center',
  padding: `${spacing[6]} ${spacing[5]} ${spacing[4]}`,
  background: `linear-gradient(180deg, ${colors.accentBg} 0%, ${colors.bgPrimary} 100%)`,
}}>
  <CheckCircle2 size={44} color={colors.success} style={{ marginBottom: spacing[3] }} />
  <div style={{ ...typography.displayXL, color: colors.accent, lineHeight: 1 }}>
    {score?.total ?? '--'}
  </div>
  <div style={{ ...typography.label, color: colors.textMuted, marginTop: spacing[1] }}>
    / 100 · {getScoreLabel(score?.total)}
  </div>
  {score && score.percentileBetter > 0 && (
    <div style={{ ...typography.bodySm, color: colors.textMuted, marginTop: spacing[2] }}>
      Besser als {score.percentileBetter}% deiner Einheiten
    </div>
  )}
</div>

{/* RPE INPUT */}
<div style={{ padding: `0 ${spacing[5]} ${spacing[4]}` }}>
  <div style={{ ...typography.label, color: colors.textMuted, marginBottom: spacing[2] }}>
    WIE ANSTRENGEND WAR ES? (RPE)
  </div>
  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
    <input
      type="range" min={0} max={10} step={0.5}
      value={rpe ?? 7}
      onChange={(e) => setRpe(parseFloat(e.target.value))}
      style={{ flex: 1, accentColor: colors.accent }}
    />
    <span style={{ ...typography.monoLg, color: colors.accent, minWidth: '36px' }}>
      {rpe?.toFixed(1) ?? '--'}
    </span>
  </div>
</div>

{/* SCORE BREAKDOWN */}
<div style={{ padding: `0 ${spacing[5]}` }}>
  <div style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
    Aufschlüsselung
  </div>
  <ScoreBar label="Volumen" score={score?.volumeScore} />
  <ScoreBar label="Intensität" score={score?.intensityScore} />
  <ScoreBar label="Muskelabdeckung" score={score?.coverageScore} warn={score?.coverageScore !== undefined && score.coverageScore < 70} />
  <ScoreBar label="Dauer" score={score?.durationScore} />
  {score?.rpeScore !== null && <ScoreBar label="RPE" score={score?.rpeScore ?? undefined} />}
</div>

{/* WEAK POINTS */}
{score?.weakPoints && score.weakPoints.length > 0 && (
  <div style={{ padding: `${spacing[4]} ${spacing[5]}` }}>
    <div style={{ ...typography.label, color: colors.warning, marginBottom: spacing[2] }}>
      ⚠ SCHWACHSTELLEN
    </div>
    {score.weakPoints.map((wp, i) => (
      <div key={i} style={{
        padding: spacing[3], backgroundColor: `${colors.warning}10`,
        border: `1px solid ${colors.warning}30`, borderRadius: radius.lg,
        marginBottom: spacing[2],
      }}>
        <div style={{ ...typography.body, color: colors.textPrimary }}>{wp.message}</div>
        {wp.suggestedExercise && (
          <div style={{ ...typography.bodySm, color: colors.textMuted, marginTop: '2px' }}>
            → {wp.suggestedExercise} hinzufügen
          </div>
        )}
      </div>
    ))}
  </div>
)}

{/* TIPS */}
{score?.tips && score.tips.length > 0 && (
  <div style={{ padding: `0 ${spacing[5]} ${spacing[4]}` }}>
    <div style={{ ...typography.label, color: colors.accent, marginBottom: spacing[2] }}>
      💡 NÄCHSTES MAL
    </div>
    {score.tips.map((tip, i) => (
      <div key={i} style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[2] }}>
        <span style={{ color: colors.accent, flexShrink: 0 }}>›</span>
        <span style={{ ...typography.bodySm, color: colors.textPrimary }}>{tip}</span>
      </div>
    ))}
  </div>
)}
```

4. Add helper functions:
```typescript
function getScoreLabel(score?: number): string {
  if (!score) return '';
  if (score >= 90) return 'AUSGEZEICHNET';
  if (score >= 75) return 'GUT';
  if (score >= 60) return 'SOLIDE';
  if (score >= 45) return 'AUSBAUBAR';
  return 'SCHWACH';
}

function ScoreBar({ label, score, warn }: { label: string; score?: number; warn?: boolean }) {
  return (
    <div style={{ marginBottom: spacing[3] }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ ...typography.bodySm, color: warn ? colors.warning : colors.textMuted }}>{label}</span>
        <span style={{ ...typography.mono, color: warn ? colors.warning : colors.textPrimary }}>{score ?? '--'}</span>
      </div>
      <div style={{ height: '4px', backgroundColor: colors.bgElevated, borderRadius: radius.full }}>
        <div style={{
          height: '100%',
          width: `${score ?? 0}%`,
          backgroundColor: warn ? colors.warning : colors.accent,
          borderRadius: radius.full,
          transition: 'width 0.8s ease-out',
        }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/workout/summary/
git commit -m "feat: new summary page with score breakdown, RPE input, weak points, tips"
```

---

## Chunk 4: Dashboard — Heatmap + Muscle Coverage Signal

**Goal:** Dashboard gets mini heatmap inline, muscle coverage warning, and "wow this is professional" first impression.

### Task 4.1: Muscle Coverage Algorithm

**Files:**
- Create: `utils/muscleCoverage.ts`

- [ ] **Step 1: Create coverage utility**

Create `utils/muscleCoverage.ts`:

```typescript
import type { WorkoutSession } from '@/types/workout';
import { getExerciseById } from '@/constants/exercises';
import { subDays, parseISO, isAfter } from 'date-fns';

export interface MuscleStatus {
  muscleId: string;
  labelDE: string;
  setsThisWeek: number;
  targetSets: number; // MEV = 10/week, but per session ~3–5
  isAdequate: boolean;
}

const MUSCLE_LABELS_DE: Record<string, string> = {
  chest: 'Brust', back: 'Rücken', shoulders: 'Schultern',
  biceps: 'Bizeps', triceps: 'Trizeps',
  quads: 'Beinvorderseite', hamstrings: 'Hamstrings', glutes: 'Gesäß',
  calves: 'Waden', core: 'Core',
};

export function getWeeklyMuscleStatus(sessions: WorkoutSession[]): MuscleStatus[] {
  const oneWeekAgo = subDays(new Date(), 7);
  const thisWeekSessions = sessions.filter(s => isAfter(parseISO(s.date), oneWeekAgo));

  const setsPerMuscle: Record<string, number> = {};

  for (const session of thisWeekSessions) {
    for (const ex of session.exercises) {
      const exercise = getExerciseById(ex.exercise.id);
      if (!exercise) continue;
      const workedSets = ex.sets.filter(s => s.isCompleted && s.type !== 'warmup').length;
      setsPerMuscle[exercise.primaryMuscle] = (setsPerMuscle[exercise.primaryMuscle] ?? 0) + workedSets;
      // Count secondary muscles at half weight
      for (const sec of exercise.secondaryMuscles ?? []) {
        setsPerMuscle[sec] = (setsPerMuscle[sec] ?? 0) + Math.floor(workedSets / 2);
      }
    }
  }

  const MIN_SETS_PER_WEEK = 6; // minimum effective for meaningful stimulus
  return Object.keys(MUSCLE_LABELS_DE).map(muscleId => ({
    muscleId,
    labelDE: MUSCLE_LABELS_DE[muscleId],
    setsThisWeek: setsPerMuscle[muscleId] ?? 0,
    targetSets: MIN_SETS_PER_WEEK,
    isAdequate: (setsPerMuscle[muscleId] ?? 0) >= MIN_SETS_PER_WEEK,
  }));
}

export function getMissingMuscles(sessions: WorkoutSession[], activeSplitMuscles: string[]): string[] {
  const status = getWeeklyMuscleStatus(sessions);
  return activeSplitMuscles.filter(m => {
    const s = status.find(st => st.muscleId === m);
    return !s || !s.isAdequate;
  });
}

export function getRemainingWeekDays(): number {
  const today = new Date().getDay(); // 0=Sun, 6=Sat
  const daysUntilSunday = today === 0 ? 0 : 7 - today;
  return daysUntilSunday;
}
```

- [ ] **Step 2: Verify TypeScript + commit**

```bash
npx tsc --noEmit
git add utils/muscleCoverage.ts
git commit -m "feat: muscle coverage algorithm for weekly training signal"
```

---

### Task 4.2: Dashboard Redesign

**Files:**
- Modify: `app/(tabs)/dashboard/page.tsx`

- [ ] **Step 1: Integrate muscle coverage signal into dashboard**

In `app/(tabs)/dashboard/page.tsx`:

1. Import and use coverage utilities:
```typescript
import { getMissingMuscles, getRemainingWeekDays } from '@/utils/muscleCoverage';
import { BodyHeatmap } from '@/components/ui/BodyHeatmap';

// Inside component:
const daysLeft = getRemainingWeekDays();
const activeSplitMuscles = activeSplit?.days?.flatMap(d => d.exercises?.map(e =>
  getExerciseById(e.exerciseId)?.primaryMuscle
).filter(Boolean) as string[]) ?? [];
const missingMuscles = getMissingMuscles(sessions, activeSplitMuscles);
const showMuscleWarning = daysLeft > 0 && missingMuscles.length > 0;
```

2. Add Muscle Coverage Signal section (after the stats row):
```typescript
{showMuscleWarning && (
  <div style={{
    backgroundColor: `${colors.warning}10`,
    border: `1px solid ${colors.warning}30`,
    borderRadius: radius.xl,
    padding: spacing[4],
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] }}>
      <span style={{ fontSize: '16px' }}>⚠️</span>
      <span style={{ ...typography.body, color: colors.warning, fontWeight: '700' }}>
        Noch {daysLeft} Tag{daysLeft !== 1 ? 'e'  : ''} — folgende Muskeln zu wenig:
      </span>
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
      {missingMuscles.slice(0, 4).map(m => (
        <span key={m} style={{
          padding: `3px ${spacing[2]}`,
          backgroundColor: `${colors.warning}20`,
          border: `1px solid ${colors.warning}40`,
          borderRadius: radius.full,
          ...typography.label,
          color: colors.warning,
        }}>
          {MUSCLE_LABELS_DE[m] ?? m}
        </span>
      ))}
    </div>
  </div>
)}
```

3. Move mini heatmap to dashboard (side by side with stats):
```typescript
{/* Heatmap + Stats Row */}
<div style={{ display: 'flex', gap: spacing[4], alignItems: 'stretch' }}>
  {/* Mini Heatmap */}
  <div style={{
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xl,
    padding: spacing[3],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }}>
    <BodyHeatmap
      sessions={sessions}
      compact
      style={{ height: '100px', width: '50px' }}
    />
  </div>

  {/* Stats */}
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[2], flex: 1 }}>
    <StatCard ... />
    <StatCard ... />
    <StatCard ... />
    <StatCard ... />
  </div>
</div>
```

- [ ] **Step 2: Check BodyHeatmap supports compact prop**

Read `components/ui/BodyHeatmap.tsx` — add `compact?: boolean` prop that renders a smaller version if needed.

- [ ] **Step 3: Verify TypeScript + build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/dashboard/ components/ui/BodyHeatmap.tsx utils/muscleCoverage.ts
git commit -m "feat: dashboard with muscle coverage signal and inline heatmap"
```

---

## Chunk 5: Workout Sharing — Link + PDF

**Goal:** Share workouts as a public link (view without login) and as a PDF download.

### Task 5.1: Share Token + Public Route

**Files:**
- Create: `app/share/[token]/page.tsx`
- Modify: `store/historyStore.ts`
- Create: `utils/shareToken.ts`

- [ ] **Step 1: Add share token utility**

Create `utils/shareToken.ts`:
```typescript
export function generateShareToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function buildShareUrl(token: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/share/${token}`;
}
```

- [ ] **Step 2: Add shareToken to historyStore**

In `store/historyStore.ts`, add action:
```typescript
generateShareToken: (sessionId: string) => string;
```

Implementation:
```typescript
generateShareToken: (sessionId: string) => {
  const token = generateShareToken();
  set(state => ({
    sessions: state.sessions.map(s =>
      s.id === sessionId ? { ...s, shareToken: token } : s
    )
  }));
  return token;
},
```

- [ ] **Step 3: Create public share page**

Create `app/share/[token]/page.tsx`:

```typescript
'use client';

import { use } from 'react';
import { useHistoryStore } from '@/store/historyStore';
import { useUserStore } from '@/store/userStore';
// Reuse summary components but without navigation, in read-only mode
// Show: score (if available), exercises, heatmap, PRs

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { sessions } = useHistoryStore();
  const { profile } = useUserStore();

  const session = sessions.find(s => s.shareToken === token);

  if (!session) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Training nicht gefunden</h2>
        <p>Dieser Link ist abgelaufen oder ungültig.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#080808', padding: '20px' }}>
      {/* Attribution banner */}
      <div style={{ textAlign: 'center', padding: '12px', marginBottom: '16px',
        backgroundColor: '#161616', border: '1px solid #262626', borderRadius: '14px' }}>
        <span style={{ fontSize: '12px', color: '#888888' }}>Training von </span>
        <span style={{ fontSize: '12px', color: '#4DFFED', fontWeight: '700' }}>
          {session.exercises[0]?.exercise ? 'Arved' : 'Unbekannt'}
        </span>
        <span style={{ fontSize: '12px', color: '#888888' }}> · MY LIFE Training</span>
      </div>

      {/* Score hero (same component logic as summary) */}
      {session.score && (
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '64px', fontWeight: '800', color: '#4DFFED', lineHeight: 1 }}>
            {session.score.total}
          </div>
          <div style={{ fontSize: '12px', color: '#888888', marginTop: '4px' }}>/ 100 Punkte</div>
        </div>
      )}

      {/* Exercises list */}
      <h3 style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>
        Übungen ({session.exercises.length})
      </h3>
      {session.exercises.map((ex, i) => {
        const done = ex.sets.filter(s => s.isCompleted);
        const maxW = done.length > 0 ? Math.max(...done.map(s => s.weight)) : 0;
        return (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', backgroundColor: '#161616',
            border: '1px solid #262626', borderRadius: '14px', marginBottom: '8px',
          }}>
            <span style={{ color: '#FFFFFF', fontSize: '14px' }}>{ex.exercise.nameDE}</span>
            <span style={{ color: '#888888', fontSize: '12px' }}>
              {done.length} × {maxW > 0 ? `${maxW}kg` : 'EG'}
            </span>
          </div>
        );
      })}

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: '32px', padding: '20px',
        backgroundColor: '#0A1F1A', border: '1px solid #4DFFED30', borderRadius: '20px' }}>
        <p style={{ color: '#4DFFED', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>
          Tracke auch dein Training
        </p>
        <p style={{ color: '#888888', fontSize: '12px' }}>MY LIFE Training — kostenlos im Browser</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update summary share button**

In `app/workout/summary/page.tsx`, update `handleShare`:
```typescript
const handleShare = async () => {
  const token = generateShareTokenForSession(session.id); // calls historyStore action
  const url = buildShareUrl(token);

  if (navigator.share) {
    await navigator.share({ title: 'Mein Workout', url });
  } else {
    await navigator.clipboard.writeText(url);
    // Show toast: "Link kopiert!"
  }
};
```

- [ ] **Step 5: Verify TypeScript + commit**

```bash
npx tsc --noEmit
git add app/share/ utils/shareToken.ts store/historyStore.ts
git commit -m "feat: workout sharing via public link with share token"
```

---

### Task 5.2: PDF Export

**Files:**
- Create: `app/api/export/workout-pdf/route.ts`
- Create: `components/pdf/WorkoutSummaryPDF.tsx`

- [ ] **Step 1: Create PDF template component**

Create `components/pdf/WorkoutSummaryPDF.tsx`:

```typescript
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { WorkoutSession } from '@/types/workout';
import type { WorkoutScore } from '@/types/score';

const styles = StyleSheet.create({
  page: { backgroundColor: '#080808', padding: 30, color: '#FFFFFF', fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottom: '1px solid #262626', paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#4DFFED' },
  subtitle: { fontSize: 12, color: '#888888', marginTop: 4 },
  score: { fontSize: 48, fontWeight: 'bold', color: '#4DFFED', textAlign: 'center', marginVertical: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8, marginTop: 16 },
  exerciseRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottom: '1px solid #1E1E1E' },
  exerciseName: { fontSize: 12, color: '#FFFFFF' },
  exerciseStats: { fontSize: 11, color: '#888888' },
  tip: { fontSize: 11, color: '#F5F5F5', marginBottom: 4 },
  footer: { position: 'absolute', bottom: 20, left: 30, right: 30, textAlign: 'center', fontSize: 9, color: '#555555' },
});

interface Props {
  session: WorkoutSession;
  score?: WorkoutScore | null;
  userName?: string;
}

export function WorkoutSummaryPDF({ session, score, userName }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{session.splitName ?? 'Freies Training'}</Text>
          <Text style={styles.subtitle}>
            {userName ? `Training von ${userName} · ` : ''}
            {new Date(session.date).toLocaleDateString('de-DE', { dateStyle: 'full' })}
          </Text>
        </View>

        {score && <Text style={styles.score}>{score.total} / 100</Text>}

        <Text style={styles.sectionTitle}>ÜBUNGEN</Text>
        {session.exercises.map((ex, i) => {
          const done = ex.sets.filter(s => s.isCompleted);
          const maxW = done.length > 0 ? Math.max(...done.map(s => s.weight)) : 0;
          return (
            <View key={i} style={styles.exerciseRow}>
              <Text style={styles.exerciseName}>{ex.exercise.nameDE}</Text>
              <Text style={styles.exerciseStats}>{done.length} Sätze · {maxW}kg max</Text>
            </View>
          );
        })}

        {score?.tips && score.tips.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>TIPPS FÜR NÄCHSTES MAL</Text>
            {score.tips.map((tip, i) => (
              <Text key={i} style={styles.tip}>› {tip}</Text>
            ))}
          </>
        )}

        <Text style={styles.footer}>MY LIFE Training App · mylife.training</Text>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 2: Create API route for PDF**

Create `app/api/export/workout-pdf/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { WorkoutSummaryPDF } from '@/components/pdf/WorkoutSummaryPDF';
import { createElement } from 'react';

export async function POST(req: NextRequest) {
  try {
    const { session, score, userName } = await req.json();

    const pdfBuffer = await renderToBuffer(
      createElement(WorkoutSummaryPDF, { session, score, userName })
    );

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="workout-${session.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Add PDF download button to summary page**

In `app/workout/summary/page.tsx`:
```typescript
const handleDownloadPDF = async () => {
  const res = await fetch('/api/export/workout-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session, score, userName: profile?.name }),
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `workout-${session.id.slice(0, 8)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};
```

- [ ] **Step 4: Verify TypeScript + build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add app/api/export/ components/pdf/
git commit -m "feat: PDF export of workout summary via @react-pdf/renderer"
```

---

## Chunk 6: Splits Page + Plan Score + History Re-use

**Goal:** Cleaner splits UI, plan quality score, restart-from-history feature.

### Task 6.1: Splits Page Cleanup

**Files:**
- Modify: `app/(tabs)/splits/page.tsx`
- Create: `utils/planScore.ts`

- [ ] **Step 1: Create plan score utility**

Create `utils/planScore.ts`:

```typescript
import { getExerciseById } from '@/constants/exercises';

interface PlanScoreResult {
  total: number;   // 0–100
  frequencyScore: number;
  balanceScore: number;
  varietyScore: number;
  tips: string[];
}

export function calculatePlanScore(split: {
  days: Array<{ exercises: Array<{ exerciseId: string }>; isRestDay?: boolean }>;
}): PlanScoreResult {
  const trainingDays = split.days.filter(d => !d.isRestDay);

  // 1. Frequency score — optimal: 3–5 training days/week
  const frequencyScore = trainingDays.length === 0 ? 0
    : trainingDays.length >= 3 && trainingDays.length <= 5 ? 100
    : trainingDays.length < 3 ? Math.round(trainingDays.length / 3 * 100)
    : Math.max(60, 100 - (trainingDays.length - 5) * 15);

  // 2. Balance score — count push vs pull exercises using exercise DB
  const PUSH_MUSCLES = ['chest', 'shoulders', 'triceps'];
  const PULL_MUSCLES = ['back', 'biceps'];
  let pushCount = 0, pullCount = 0, legCount = 0;
  for (const day of trainingDays) {
    for (const ex of day.exercises ?? []) {
      const exercise = getExerciseById(ex.exerciseId);
      if (!exercise) continue;
      if (PUSH_MUSCLES.includes(exercise.primaryMuscle)) pushCount++;
      else if (PULL_MUSCLES.includes(exercise.primaryMuscle)) pullCount++;
      else if (['quads', 'hamstrings', 'glutes', 'calves'].includes(exercise.primaryMuscle)) legCount++;
    }
  }
  const total = pushCount + pullCount + legCount;
  const balanceScore = total === 0 ? 50 : Math.round(
    Math.max(0, 100 - Math.abs(pushCount - pullCount) * 8 - (legCount < total * 0.2 ? 20 : 0))
  );

  // 3. Variety score — check compound + isolation mix
  let compoundCount = 0, isolationCount = 0;
  for (const day of trainingDays) {
    for (const ex of day.exercises ?? []) {
      const exercise = getExerciseById(ex.exerciseId);
      if (!exercise) continue;
      if (exercise.category === 'compound') compoundCount++;
      else if (exercise.category === 'isolation') isolationCount++;
    }
  }
  const exTotal = compoundCount + isolationCount;
  const idealCompoundRatio = 0.5; // 50% compound, 50% isolation
  const actualRatio = exTotal > 0 ? compoundCount / exTotal : 0.5;
  const varietyScore = Math.round(Math.max(40, 100 - Math.abs(actualRatio - idealCompoundRatio) * 120));

  const score = Math.round(frequencyScore * 0.35 + balanceScore * 0.35 + varietyScore * 0.30);
  const tips: string[] = [];
  if (frequencyScore < 60) tips.push('Mehr Trainingstage für optimale Frequenz (Ziel: 3–5 Tage)');
  if (balanceScore < 60) tips.push(`Push/Pull Balance anpassen: ${pushCount} Push vs. ${pullCount} Pull`);
  if (legCount < total * 0.2 && total > 0) tips.push('Beintraining zu wenig vertreten');
  if (varietyScore < 60) tips.push('Mix aus Compound und Isolationsübungen verbessern');

  return { total: score, frequencyScore, balanceScore, varietyScore, tips };
}
```

- [ ] **Step 2: Add "Restart" button to session detail**

In `app/(tabs)/log/[sessionId]/page.tsx`, add restart functionality:
```typescript
import { useWorkoutStore } from '@/store/workoutStore';
import { useRouter } from 'next/navigation';

const { startWorkout, addExercise } = useWorkoutStore();
const router = useRouter();

const handleRestartWorkout = () => {
  startWorkout(session.splitName);
  for (const ex of session.exercises) {
    addExercise(ex.exercise);
  }
  router.push('/workout/active');
};
```

Add button to session detail page:
```typescript
<Button onClick={handleRestartWorkout} variant="secondary">
  ↺ Nochmal trainieren
</Button>
```

- [ ] **Step 3: Verify TypeScript + commit**

```bash
npx tsc --noEmit
git add utils/planScore.ts app/(tabs)/splits/ app/(tabs)/log/
git commit -m "feat: plan quality score, restart-from-history button"
```

---

## Chunk 7: AI Coach Overhaul

**Goal:** Replace slang-heavy AI responses with professional personal-trainer tone. Add guided question chips. Reduce API calls.

### Task 7.1: Update AI Prompts

**Files:**
- Modify: `app/api/ai-coach/route.ts`
- Modify: `app/api/chat/route.ts`

- [ ] **Step 1: Read the current AI coach system prompt**

```bash
# Both files contain AI prompts — read them first
```

Read `app/api/ai-coach/route.ts` — look for `systemPrompt`, `system:`, or the first string passed to the AI SDK.
Read `app/api/chat/route.ts` — same.

- [ ] **Step 2: Replace system prompt in `app/api/ai-coach/route.ts`**

Find the system prompt string and replace with:

```typescript
const SYSTEM_PROMPT = `Du bist ein professioneller Personal Trainer. Deine Antworten sind:
- Präzise und fachkundig — keine Umgangssprache, kein Slang
- Kurz und strukturiert — maximal 3–4 Sätze oder eine knappe Aufzählung
- Fordernd aber unterstützend — du stellst Rückfragen bevor du Empfehlungen gibst
- Nie: Trainingspläne als erste Antwort geben
- Immer: Fehlende Informationen erfragen bevor du konkrete Empfehlungen machst
- Keine Emojis
- Antworte immer auf Deutsch

Wenn der User nach einem Trainingsplan fragt, stelle zuerst diese Fragen:
1. Was ist dein konkretes Ziel?
2. Wie viele Tage pro Woche kannst du trainieren?
3. Welche Ausrüstung steht dir zur Verfügung?
Erst wenn du diese Antworten hast, mache einen konkreten Plan.`;
```

- [ ] **Step 3: Add suggested questions to chat UI**

In `app/(tabs)/chat/page.tsx`, add quick reply chips after each AI response:

```typescript
const QUICK_REPLIES: Record<string, string[]> = {
  default: [
    'Warum dieser Score?',
    'Trainingsplan anpassen',
    'Welche Übung für Brust?',
    'Progressive Overload erklären',
  ],
  post_workout: [
    'Was kann ich verbessern?',
    'Nächste Einheit planen',
    'War das Volumen ausreichend?',
  ],
};

// After AI response, show chips:
<div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], padding: spacing[3] }}>
  {quickReplies.map(reply => (
    <button
      key={reply}
      onClick={() => handleSend(reply)}
      style={{
        padding: `${spacing[2]} ${spacing[3]}`,
        borderRadius: radius.full,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.bgCard,
        color: colors.textSecondary,
        fontSize: '13px',
        cursor: 'pointer',
      }}
    >
      {reply}
    </button>
  ))}
</div>
```

- [ ] **Step 4: Verify TypeScript + build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add app/api/ai-coach/ app/(tabs)/chat/
git commit -m "feat: professional AI coach tone, quick reply chips, no unsolicited plans"
```

---

## Chunk 8: Exercise Database Expansion

**Goal:** Expand exercise DB to 150+ exercises with variations, popularity data per muscle group.

### Task 8.1: Exercise Type Extension

**Files:**
- Modify: `types/exercises.ts`
- Modify: `constants/exercises.ts`

- [ ] **Step 1: Add popularity and variation fields to Exercise type**

In `types/exercises.ts`:
```typescript
export interface Exercise {
  // ...existing fields...
  popularity?: number;     // 1–100, based on real-world usage data
  variationOf?: string;    // parent exercise ID (e.g. 'bench-press')
  variationLabel?: string; // e.g. 'Kurzhantel', 'Kabel', 'Maschine'
  isCardio?: boolean;
  tags?: string[];         // e.g. ['compound', 'beginner-friendly', 'home']
}
```

- [ ] **Step 2: Add 80+ new exercises to constants/exercises.ts**

Each exercise follows this exact shape (copy from existing exercises as template):

```typescript
// EXAMPLE — Barbell Curl
{
  id: 'barbell-curl',
  name: 'Barbell Curl',
  nameDE: 'Langhantel Curl',
  primaryMuscle: 'biceps',
  secondaryMuscles: ['forearms'],
  equipment: ['barbell'],
  category: 'isolation',
  defaultSets: 3,
  defaultReps: 10,
  defaultWeight: 30,
  repRange: { min: 8, max: 12 },
  restSeconds: 75,
  popularity: 95,
  scienceNote: 'Supinated grip maximizes bicep long-head activation. Avoid body swing.',
},
```

Add in this order (use existing exercises as format reference):

**BICEPS** — Barbell Curl (popularity:95), Hammer Curl (90), Preacher Curl (85), Incline Dumbbell Curl (80), Cable Curl (82), Spider Curl (70), Concentration Curl (72)

**TRICEPS** — Overhead Tricep Extension (88), Skull Crusher (85), Cable Pushdown (92), Dip (90), Close Grip Bench (83), Tate Press (65), Overhead Cable Extension (78)

**SHOULDERS** — Arnold Press (85), Cable Lateral Raise (82), Rear Delt Fly Machine (80), Upright Row (75), Face Pull (88, add if missing), Bradford Press (60)

**BACK** — Cable Row (90), T-Bar Row (85), Chest-Supported Row (80), Straight-Arm Pulldown (75), Seal Row (70), Barbell Row (92)

**CHEST** — Cable Crossover (85), Push-Up (88), Decline Bench Press (75), Dips for Chest (80), Cable Fly Low (70)

**LEGS** — Bulgarian Split Squat (88), Hack Squat (85), Leg Press (95), Leg Curl (90), Leg Extension (90), Hip Thrust (92), Romanian Deadlift (95), Calf Raise (90), Seated Calf Raise (80), Nordic Curl (70), Sumo Deadlift (82)

**CORE** — Plank (90), Ab Wheel (85), Hanging Leg Raise (82), Cable Crunch (80), Side Plank (75), Russian Twist (72)

**CARDIO** — add with `isCardio: true` flag:
```typescript
{
  id: 'running',
  name: 'Running',
  nameDE: 'Laufen',
  primaryMuscle: 'cardio',
  secondaryMuscles: [],
  equipment: [],
  category: 'cardio',
  isCardio: true,
  defaultSets: 1,
  defaultReps: 30,  // minutes
  defaultWeight: 0, // km
  popularity: 98,
  restSeconds: 0,
  scienceNote: 'Zone 2 cardio (60–70% max HR) optimizes mitochondrial density and fat oxidation.',
},
```
Cardio exercises to add: Laufen, Radfahren, Rudergerät, Springseil, Stairmaster, Schwimmen

- [ ] **Step 3: Add "most popular" section to exercise search**

In `app/workout/add-exercise/page.tsx` and `app/(tabs)/exercises/page.tsx`:
- Group exercises by `primaryMuscle`
- Sort by `popularity` descending within each group
- Show "Beliebteste" badge on exercises with popularity >= 80

- [ ] **Step 4: Verify TypeScript + build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add types/exercises.ts constants/exercises.ts app/workout/add-exercise/ app/(tabs)/exercises/
git commit -m "feat: expand exercise DB to 150+, add popularity data and variation links"
```

---

## Chunk 9: Figma Redesign Track (Parallel)

**Goal:** Professional Figma designs for all 10 screens — to be implemented AFTER code functionality is complete.

This chunk is executed as a **separate parallel agent** using Figma MCP tools.

### Screens to Design

1. **Dashboard** — mini heatmap, muscle signal, start CTA
2. **Active Workout** — new ExerciseCard design, drag handles, ⚙️ icon
3. **Exercise Settings Sheet** — bottom sheet with all options
4. **Workout Summary** — score hero, breakdown bars, tips
5. **Exercise List** — variations, popularity, muscle group sections
6. **Splits Overview** — plan score, share button
7. **Log / History** — session cards with score badge
8. **Stats / Exercise Detail** — variation selector tabs, charts
9. **Share Page** — public view of workout
10. **Onboarding** — clean, on-brand

### Design Principles
- All corners: `border-radius: 20–28px` (nothing sharp)
- Accent: `#4DFFED` used sparingly
- Background hierarchy: `#080808` → `#0E0E0E` → `#161616` → `#1E1E1E`
- Typography: Barlow Condensed (headlines) + Manrope (body)
- Inspired by: Strong (clarity), TitanPro (data density)
- First impression must communicate: "premium, professional, powerful"

### Agent Instructions for Figma Track

Use `figma:implement-design` or `figma:create-design-system-rules` skills. For each screen:
1. Get existing Figma file context if available
2. Create high-fidelity screen design
3. Export as PNG for review

---

## Final Verification

After all chunks complete:

- [ ] **Full TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Production build**

```bash
npm run build
```
Expected: successful build, no warnings about missing exports

- [ ] **Manual smoke test on mobile**
  - Start a workout, add 3 exercises
  - Drag to reorder
  - Open ⚙️ settings, change equipment and gym
  - Complete sets — verify ghost weight, strikethrough, overload chip
  - Finish workout — verify score shows, RPE slider works, tips appear
  - Share as link — verify public page loads
  - Download PDF — verify PDF opens

- [ ] **Final commit**

```bash
# Stage specific tracked files only — never git add . to avoid committing .env or binaries
git add \
  constants/ types/ store/ utils/ components/ app/ public/ \
  docs/superpowers/
git commit -m "feat: MY LIFE Training V2 — score engine, drag&drop, variation PRs, dashboard heatmap"
```
