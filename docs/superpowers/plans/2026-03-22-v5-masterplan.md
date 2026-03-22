# V5 Masterplan Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform MyLife Training App into a visually stunning, professional, feature-complete fitness app with fire heatmap, micro-animations, 1RM calculator, PR Hall of Fame, muscle recovery tracker, and GitHub-style streak calendar.

**Architecture:** Feature modules are independent — each task touches isolated files. ReactBits components are copy-pasted (no npm). Framer Motion handles all animations. New utils are pure functions in `utils/`.

**Tech Stack:** Next.js 14, Framer Motion, Recharts, Zustand, ReactBits (copy-paste), date-fns

---

## Task 1: Heatmap Fire Color Scheme

**Files:**
- Modify: `components/ui/BodyHeatmap.tsx`

The current blue→green→orange→red looks clinical. Replace with a fire/heat scheme: dark background → deep red → orange → bright yellow. Psychologically reads as "body heat" — instantly intuitive for a workout app.

- [ ] **Step 1: Read `components/ui/BodyHeatmap.tsx`** — find `getMuscleColor` or equivalent function and the legend section.

- [ ] **Step 2: Replace color function**

```typescript
function getMuscleColor(sets: number, max: number): { fill: string; fillOpacity: number } {
  if (sets === 0) {
    return { fill: '#FFFFFF', fillOpacity: 0.05 }; // barely visible outline
  }
  const ratio = sets / Math.max(max, 1);

  if (ratio <= 0.25) return { fill: '#6B21A8', fillOpacity: 0.80 }; // deep purple
  if (ratio <= 0.5)  return { fill: '#C2185B', fillOpacity: 0.85 }; // magenta-red
  if (ratio <= 0.75) return { fill: '#EF4444', fillOpacity: 0.85 }; // bright red
  return { fill: '#FACC15', fillOpacity: 0.90 };                    // yellow (max 🔥)
}
```

- [ ] **Step 3: Update legend labels and colors**

```tsx
const LEGEND_ITEMS = [
  { fill: '#FFFFFF', opacity: 0.05, label: 'Kein Training' },
  { fill: '#6B21A8', opacity: 0.80, label: 'Wenig' },
  { fill: '#C2185B', opacity: 0.85, label: 'Aktiv' },
  { fill: '#EF4444', opacity: 0.85, label: 'Intensiv' },
  { fill: '#FACC15', opacity: 0.90, label: 'Max 🔥' },
];
```

- [ ] **Step 4: Build check**
```bash
cd "D:\arved\20_Projekte\MyLife\(GeminiVersion)Training_App_MyLife"
npx tsc --noEmit && npm run build 2>&1 | grep -E "Compiled|Error"
```

- [ ] **Step 5: Commit**
```bash
git add components/ui/BodyHeatmap.tsx
git commit -m "feat: heatmap fire colors — dark-red → orange → yellow heat scheme"
```

---

## Task 2: Animated Score Counter (Count Up)

**Files:**
- Create: `components/ui/CountUp.tsx`
- Modify: `app/workout/summary/page.tsx`

The score should count up from 0 to the final value when the summary page loads — makes the score feel earned and dramatic.

- [ ] **Step 1: Create `components/ui/CountUp.tsx`**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  end: number;
  duration?: number; // ms
  className?: string;
}

export function CountUp({ end, duration = 1200, className }: CountUpProps) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * end));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [end, duration]);

  return <span className={className}>{value}</span>;
}
```

- [ ] **Step 2: Use CountUp in summary page**

In `app/workout/summary/page.tsx`, find where `score.total` is rendered as a number (the big score display). Replace it:

```tsx
import { CountUp } from '@/components/ui/CountUp';

// Replace: <span>{score.total}</span>
// With:
<CountUp end={score.total} duration={1400} />
```

- [ ] **Step 3: Build check + commit**
```bash
npx tsc --noEmit && npm run build 2>&1 | grep -E "Compiled|Error"
git add components/ui/CountUp.tsx app/workout/summary/page.tsx
git commit -m "feat: animated score counter — counts up from 0 on summary reveal"
```

---

## Task 3: Click Spark on Set Completion

**Files:**
- Create: `components/ui/ClickSpark.tsx`
- Modify: `components/workout/SetRow.tsx`

When a set is marked complete (the ✓ button), fire tiny spark particles outward. Micro-delight that makes completing sets feel satisfying.

- [ ] **Step 1: Create `components/ui/ClickSpark.tsx`**

Copy from ReactBits (https://reactbits.dev/animations/click-spark). The component wraps children and fires sparks on click:

```tsx
'use client';

import { useRef, useState, useCallback } from 'react';

interface Spark {
  id: number;
  x: number;
  y: number;
  angle: number;
}

interface ClickSparkProps {
  children: React.ReactNode;
  sparkColor?: string;
  sparkCount?: number;
  enabled?: boolean;
}

export function ClickSpark({
  children,
  sparkColor = '#4DFFED',
  sparkCount = 8,
  enabled = true,
}: ClickSparkProps) {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const counterRef = useRef(0);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!enabled) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newSparks: Spark[] = Array.from({ length: sparkCount }, (_, i) => ({
      id: ++counterRef.current,
      x,
      y,
      angle: (360 / sparkCount) * i,
    }));
    setSparks(prev => [...prev, ...newSparks]);
    setTimeout(() => {
      setSparks(prev => prev.filter(s => !newSparks.find(ns => ns.id === s.id)));
    }, 600);
  }, [enabled, sparkCount]);

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }} onClick={handleClick}>
      {children}
      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
      >
        {sparks.map(spark => (
          <line
            key={spark.id}
            x1={spark.x}
            y1={spark.y}
            x2={spark.x + Math.cos((spark.angle * Math.PI) / 180) * 20}
            y2={spark.y + Math.sin((spark.angle * Math.PI) / 180) * 20}
            stroke={sparkColor}
            strokeWidth={2}
            strokeLinecap="round"
            style={{
              animation: 'spark-fade 0.6s ease-out forwards',
            }}
          />
        ))}
      </svg>
      <style>{`
        @keyframes spark-fade {
          0% { opacity: 1; stroke-width: 2; }
          100% { opacity: 0; stroke-width: 0; }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Wrap the complete-set button in SetRow**

In `components/workout/SetRow.tsx`, find the checkmark/complete button. Wrap it:

```tsx
import { ClickSpark } from '@/components/ui/ClickSpark';

// Find the complete button and wrap:
<ClickSpark enabled={!set.isCompleted} sparkColor="#4DFFED">
  <button onClick={handleComplete} className={styles.completeBtn}>
    ✓
  </button>
</ClickSpark>
```

- [ ] **Step 3: Build check + commit**
```bash
npx tsc --noEmit && npm run build 2>&1 | grep -E "Compiled|Error"
git add components/ui/ClickSpark.tsx components/workout/SetRow.tsx
git commit -m "feat: click spark animation on set completion"
```

---

## Task 4: 1RM Calculator in Active Workout

**Files:**
- Create: `utils/oneRepMax.ts`
- Modify: `components/workout/SetRow.tsx`

Show estimated 1RM next to each completed set. Epley formula: `weight * (1 + reps/30)`. Only show when reps ≤ 10 (formula loses accuracy above 10 reps) and weight > 0.

- [ ] **Step 1: Create `utils/oneRepMax.ts`**

```typescript
/**
 * Epley formula: 1RM = weight × (1 + reps/30)
 * Valid for reps 1–10. Above 10, accuracy degrades.
 */
export function estimateOneRepMax(weight: number, reps: number): number | null {
  if (weight <= 0 || reps <= 0 || reps > 10) return null;
  return Math.round(weight * (1 + reps / 30));
}

export function formatOneRepMax(weight: number, reps: number): string | null {
  const orm = estimateOneRepMax(weight, reps);
  if (orm === null) return null;
  return `≈ ${orm} kg 1RM`;
}
```

- [ ] **Step 2: Show 1RM in SetRow after completion**

In `components/workout/SetRow.tsx`, after the checkmark (when `set.isCompleted`), add a small 1RM display:

```tsx
import { formatOneRepMax } from '@/utils/oneRepMax';

// After the complete button, inside the set row:
{set.isCompleted && set.weight > 0 && (
  <span style={{
    fontSize: '10px',
    color: 'var(--text-faint)',
    fontFamily: 'var(--font-courier)',
    marginLeft: '4px',
    flexShrink: 0,
  }}>
    {formatOneRepMax(set.weight, set.reps)}
  </span>
)}
```

- [ ] **Step 3: Build check + commit**
```bash
npx tsc --noEmit && npm run build 2>&1 | grep -E "Compiled|Error"
git add utils/oneRepMax.ts components/workout/SetRow.tsx
git commit -m "feat: 1RM estimate (Epley) shown after completing each set"
```

---

## Task 5: Personal Records Hall of Fame Page

**Files:**
- Create: `app/(tabs)/log/records/page.tsx`
- Modify: `app/(tabs)/log/page.tsx` (add navigation link)

A dedicated page showing all-time PRs per exercise: heaviest weight, best volume session, most reps.

- [ ] **Step 1: Create `utils/personalRecords.ts`**

```typescript
import type { WorkoutSession } from '@/types/workout';

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxWeight: number;       // heaviest single set
  maxReps: number;         // most reps in a set
  maxVolume: number;       // most tonnage in one session
  maxWeightDate: string;
  maxVolumeDate: string;
}

export function computePersonalRecords(sessions: WorkoutSession[]): PersonalRecord[] {
  const map = new Map<string, PersonalRecord>();

  for (const session of sessions) {
    for (const ex of session.exercises) {
      const id = ex.exercise?.id ?? ex.exerciseId ?? '';
      const name = ex.exercise?.nameDE ?? ex.exercise?.name ?? id;
      if (!id) continue;

      const completedSets = ex.sets.filter(s =>
        s.isCompleted || (s.weight > 0 && s.reps > 0)
      );
      if (completedSets.length === 0) continue;

      const sessionVolume = completedSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
      const maxSet = completedSets.reduce((best, s) =>
        s.weight > best.weight ? s : best, completedSets[0]);
      const maxRepsSet = completedSets.reduce((best, s) =>
        s.reps > best.reps ? s : best, completedSets[0]);

      const existing = map.get(id);
      if (!existing) {
        map.set(id, {
          exerciseId: id,
          exerciseName: name,
          maxWeight: maxSet.weight,
          maxReps: maxRepsSet.reps,
          maxVolume: sessionVolume,
          maxWeightDate: session.date,
          maxVolumeDate: session.date,
        });
      } else {
        if (maxSet.weight > existing.maxWeight) {
          existing.maxWeight = maxSet.weight;
          existing.maxWeightDate = session.date;
        }
        if (maxRepsSet.reps > existing.maxReps) {
          existing.maxReps = maxRepsSet.reps;
        }
        if (sessionVolume > existing.maxVolume) {
          existing.maxVolume = sessionVolume;
          existing.maxVolumeDate = session.date;
        }
      }
    }
  }

  return Array.from(map.values())
    .filter(r => r.maxWeight > 0)
    .sort((a, b) => b.maxVolume - a.maxVolume);
}
```

- [ ] **Step 2: Create `app/(tabs)/log/records/page.tsx`**

```tsx
'use client';

import { useHistoryStore } from '@/store/historyStore';
import { computePersonalRecords } from '@/utils/personalRecords';
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export default function RecordsPage() {
  const { sessions } = useHistoryStore();
  const records = useMemo(() => computePersonalRecords(sessions), [sessions]);

  return (
    <div style={{ padding: '16px', maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{
        fontFamily: 'var(--font-barlow)',
        fontSize: '28px',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: '4px',
      }}>
        Bestleistungen 🏆
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
        Alle Zeiten — {records.length} Übungen
      </p>

      {records.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-faint)', paddingTop: '40px' }}>
          Noch keine abgeschlossenen Trainings
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {records.map(r => (
          <div key={r.exerciseId} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '14px 16px',
          }}>
            <div style={{
              fontFamily: 'var(--font-barlow)',
              fontSize: '17px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '10px',
            }}>
              {r.exerciseName}
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MAX GEWICHT</div>
                <div style={{ fontFamily: 'var(--font-courier)', fontSize: '18px', color: 'var(--accent)', fontWeight: 700 }}>
                  {r.maxWeight} kg
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
                  {format(parseISO(r.maxWeightDate), 'dd.MM.yy')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>BEST VOLUMEN</div>
                <div style={{ fontFamily: 'var(--font-courier)', fontSize: '18px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  {Math.round(r.maxVolume / 1000 * 10) / 10}t
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MAX WDHL</div>
                <div style={{ fontFamily: 'var(--font-courier)', fontSize: '18px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  {r.maxReps}×
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add link in log page**

Read `app/(tabs)/log/page.tsx`. Add a "Bestleistungen →" button/link at the top of the page (after the header).

```tsx
import Link from 'next/link';

// Add near the top of the JSX:
<Link href="/log/records" style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '20px',
  padding: '7px 14px',
  fontSize: '13px',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  marginBottom: '16px',
}}>
  🏆 Bestleistungen
</Link>
```

- [ ] **Step 4: Build check + commit**
```bash
npx tsc --noEmit && npm run build 2>&1 | grep -E "Compiled|Error"
git add utils/personalRecords.ts app/(tabs)/log/records/page.tsx app/(tabs)/log/page.tsx
git commit -m "feat: PR Hall of Fame — Bestleistungen page with max weight, volume, reps per exercise"
```

---

## Task 6: Muscle Recovery Tracker on Dashboard

**Files:**
- Create: `utils/muscleRecovery.ts`
- Modify: `app/(tabs)/dashboard/page.tsx`

Show which muscles are recovered (green ✅), recovering (orange ⏳), or still fatigued (red 🔴) based on last training date. Recovery window: 48h for heavy muscles, 24h for light.

- [ ] **Step 1: Create `utils/muscleRecovery.ts`**

```typescript
import { differenceInHours, parseISO } from 'date-fns';
import type { WorkoutSession } from '@/types/workout';
import { MUSCLE_LABELS_DE } from '@/utils/muscleCoverage';

export type RecoveryStatus = 'recovered' | 'recovering' | 'fatigued';

export interface MuscleRecovery {
  muscle: string;
  label: string;
  status: RecoveryStatus;
  hoursAgo: number;
  lastTrainedDate: string;
}

// Muscles that need 48h vs 24h recovery
const HEAVY_MUSCLES = new Set(['chest', 'back', 'quads', 'glutes', 'hamstrings']);

export function computeMuscleRecovery(
  sessions: WorkoutSession[],
  now: Date = new Date()
): MuscleRecovery[] {
  // Find last date each muscle was trained
  const lastTrained = new Map<string, string>();

  for (const session of sessions) {
    for (const ex of session.exercises) {
      const muscle = ex.exercise?.primaryMuscle ?? ex.primaryMuscle;
      if (!muscle || muscle === 'cardio') continue;
      const existing = lastTrained.get(muscle);
      if (!existing || session.date > existing) {
        lastTrained.set(muscle, session.date);
      }
    }
  }

  const MAJOR_MUSCLES = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'core'];

  return MAJOR_MUSCLES
    .filter(m => lastTrained.has(m))
    .map(muscle => {
      const lastDate = lastTrained.get(muscle)!;
      const hoursAgo = differenceInHours(now, parseISO(lastDate));
      const recoveryHours = HEAVY_MUSCLES.has(muscle) ? 48 : 24;
      const recoveryRatio = hoursAgo / recoveryHours;

      let status: RecoveryStatus;
      if (recoveryRatio >= 1) status = 'recovered';
      else if (recoveryRatio >= 0.5) status = 'recovering';
      else status = 'fatigued';

      return {
        muscle,
        label: (MUSCLE_LABELS_DE as Record<string, string>)[muscle] ?? muscle,
        status,
        hoursAgo,
        lastTrainedDate: lastDate,
      };
    })
    .sort((a, b) => {
      const order = { fatigued: 0, recovering: 1, recovered: 2 };
      return order[a.status] - order[b.status];
    });
}

export const RECOVERY_CONFIG: Record<RecoveryStatus, { icon: string; color: string; label: string }> = {
  fatigued:   { icon: '🔴', color: '#FF3B30', label: 'Erholt sich noch' },
  recovering: { icon: '🟡', color: '#FF9F0A', label: 'Fast erholt' },
  recovered:  { icon: '✅', color: '#34C759', label: 'Bereit' },
};
```

- [ ] **Step 2: Add recovery section to dashboard**

In `app/(tabs)/dashboard/page.tsx`, import the utility and add a section. Read the file first to find the right position (after the heatmap or after the streak section).

```tsx
import { computeMuscleRecovery, RECOVERY_CONFIG } from '@/utils/muscleRecovery';

// In component, after sessions are loaded:
const muscleRecovery = useMemo(
  () => computeMuscleRecovery(sessions),
  [sessions]
);

// In JSX (show only if we have data, max 6 muscles):
{muscleRecovery.length > 0 && (
  <section style={{ marginBottom: '20px' }}>
    <h2 style={{
      fontFamily: 'var(--font-barlow)',
      fontSize: '13px',
      fontWeight: 600,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: '10px',
    }}>
      Muskel-Erholung
    </h2>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {muscleRecovery.slice(0, 6).map(m => {
        const cfg = RECOVERY_CONFIG[m.status];
        return (
          <div key={m.muscle} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-card)',
            border: `1px solid ${cfg.color}33`,
            borderRadius: '20px',
            padding: '6px 12px',
          }}>
            <span style={{ fontSize: '12px' }}>{cfg.icon}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-manrope)' }}>
              {m.label}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
              {m.hoursAgo < 24 ? `${m.hoursAgo}h` : `${Math.round(m.hoursAgo / 24)}T`}
            </span>
          </div>
        );
      })}
    </div>
  </section>
)}
```

- [ ] **Step 3: Build check + commit**
```bash
npx tsc --noEmit && npm run build 2>&1 | grep -E "Compiled|Error"
git add utils/muscleRecovery.ts app/(tabs)/dashboard/page.tsx
git commit -m "feat: muscle recovery tracker on dashboard — shows fatigued/recovering/ready per muscle"
```

---

## Task 7: GitHub-Style Streak Calendar

**Files:**
- Create: `components/ui/StreakCalendar.tsx`
- Modify: `app/(tabs)/stats/page.tsx`

A contribution-graph style calendar showing the last 12 weeks of training activity. Training day = accent colored, rest day = muted, no activity = gray.

- [ ] **Step 1: Create `components/ui/StreakCalendar.tsx`**

```tsx
'use client';

import { useMemo } from 'react';
import { eachDayOfInterval, subWeeks, startOfWeek, format, parseISO, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';

interface StreakCalendarProps {
  trainingDates: string[];  // 'yyyy-MM-dd'
  restDays: string[];       // 'yyyy-MM-dd'
  weeks?: number;
}

type DayType = 'training' | 'rest' | 'none' | 'future';

const DAY_COLORS: Record<DayType, string> = {
  training: '#4DFFED',   // accent cyan
  rest:     '#262626',   // border (labeled rest)
  none:     '#161616',   // bgCard (missed/empty)
  future:   'transparent',
};

export function StreakCalendar({ trainingDates, restDays, weeks = 14 }: StreakCalendarProps) {
  const today = new Date();
  const start = startOfWeek(subWeeks(today, weeks - 1), { weekStartsOn: 1 });

  const days = useMemo(() => {
    return eachDayOfInterval({ start, end: today }).map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const isTraining = trainingDates.includes(dateStr);
      const isRest = restDays.includes(dateStr);
      const isFuture = date > today;
      const type: DayType = isFuture ? 'future' : isTraining ? 'training' : isRest ? 'rest' : 'none';
      return { date, dateStr, type };
    });
  }, [trainingDates, restDays, today]);

  // Group into weeks (columns)
  const columns: typeof days[0][][] = [];
  let currentCol: typeof days[0][] = [];
  days.forEach((day, i) => {
    currentCol.push(day);
    if (currentCol.length === 7 || i === days.length - 1) {
      columns.push(currentCol);
      currentCol = [];
    }
  });

  const MONTH_LABELS = ['Mo', '', 'Mi', '', 'Fr', '', 'So'];

  return (
    <div>
      <div style={{ display: 'flex', gap: '3px', overflowX: 'auto' }}>
        {columns.map((col, ci) => (
          <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {col.map((day, di) => (
              <div
                key={day.dateStr}
                title={`${format(day.date, 'EEE dd.MM', { locale: de })} — ${day.type === 'training' ? 'Training ✓' : day.type === 'rest' ? 'Rest Day 💤' : '—'}`}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: DAY_COLORS[day.type],
                  border: day.type === 'training' ? '1px solid rgba(77,255,237,0.4)' : '1px solid rgba(255,255,255,0.05)',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'center' }}>
        {(['training', 'rest', 'none'] as DayType[]).map(t => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: DAY_COLORS[t], border: '1px solid rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
              {t === 'training' ? 'Training' : t === 'rest' ? 'Rest Day' : 'Kein Eintrag'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add to stats page**

Read `app/(tabs)/stats/page.tsx`. Import and add the calendar after the heatmap section:

```tsx
import { StreakCalendar } from '@/components/ui/StreakCalendar';

// Get restDays from store:
const { sessions, restDays } = useHistoryStore();
const trainingDates = sessions.map(s => s.date);

// In JSX (near top of stats content):
<section style={{ marginBottom: '20px' }}>
  <h2 style={{ /* same heading style as other sections */ }}>
    Aktivitäts-Kalender
  </h2>
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '14px 16px',
  }}>
    <StreakCalendar trainingDates={trainingDates} restDays={restDays} weeks={14} />
  </div>
</section>
```

Note: read the stats page to see how other sections use their heading styles, and match that pattern.

- [ ] **Step 3: Build check + commit**
```bash
npx tsc --noEmit && npm run build 2>&1 | grep -E "Compiled|Error"
git add components/ui/StreakCalendar.tsx app/(tabs)/stats/page.tsx
git commit -m "feat: GitHub-style streak calendar — 14 weeks of training activity"
```

---

## Task 8: Smart Workout Suggestions on Dashboard

**Files:**
- Create: `utils/workoutSuggestions.ts`
- Modify: `app/(tabs)/dashboard/page.tsx`

Smart nudges: "Du hast 5 Tage kein Rücken trainiert" or "Heute wäre ein guter Tag für Beine". Based on last training dates + user's split plan.

- [ ] **Step 1: Create `utils/workoutSuggestions.ts`**

```typescript
import { differenceInDays, parseISO } from 'date-fns';
import type { WorkoutSession } from '@/types/workout';
import { MUSCLE_LABELS_DE } from '@/utils/muscleCoverage';

export interface WorkoutSuggestion {
  type: 'overdue' | 'streak' | 'balance';
  message: string;
  priority: number; // 1=high, 3=low
}

export function generateSuggestions(
  sessions: WorkoutSession[],
  now: Date = new Date()
): WorkoutSuggestion[] {
  const suggestions: WorkoutSuggestion[] = [];
  const MAJOR_MUSCLES = ['chest', 'back', 'shoulders', 'quads', 'hamstrings'];

  // Find last training date per muscle
  const lastTrained = new Map<string, Date>();
  for (const session of sessions) {
    for (const ex of session.exercises) {
      const muscle = ex.exercise?.primaryMuscle ?? ex.primaryMuscle;
      if (!muscle || muscle === 'cardio') continue;
      const date = parseISO(session.date);
      const existing = lastTrained.get(muscle);
      if (!existing || date > existing) lastTrained.set(muscle, date);
    }
  }

  // Overdue muscles (not trained in 5+ days)
  for (const muscle of MAJOR_MUSCLES) {
    const last = lastTrained.get(muscle);
    if (!last) continue;
    const days = differenceInDays(now, last);
    if (days >= 5) {
      const label = (MUSCLE_LABELS_DE as Record<string, string>)[muscle] ?? muscle;
      suggestions.push({
        type: 'overdue',
        message: `${label} seit ${days} Tagen nicht trainiert — Zeit für ein ${label}-Workout!`,
        priority: 1,
      });
    }
  }

  // Streak suggestion
  const lastSession = sessions[sessions.length - 1];
  if (lastSession) {
    const daysSinceLast = differenceInDays(now, parseISO(lastSession.date));
    if (daysSinceLast === 1) {
      suggestions.push({
        type: 'streak',
        message: 'Gestern trainiert — heute wäre perfekt für die Erholung oder einen leichten Tag.',
        priority: 3,
      });
    }
  }

  return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 2);
}
```

- [ ] **Step 2: Add suggestions to dashboard**

In `app/(tabs)/dashboard/page.tsx`, after the muscle recovery section:

```tsx
import { generateSuggestions } from '@/utils/workoutSuggestions';

const suggestions = useMemo(() => generateSuggestions(sessions), [sessions]);

{suggestions.length > 0 && (
  <section style={{ marginBottom: '20px' }}>
    {suggestions.map((s, i) => (
      <div key={i} style={{
        background: s.priority === 1 ? 'var(--accent-bg)' : 'var(--bg-card)',
        border: `1px solid ${s.priority === 1 ? 'rgba(77,255,237,0.15)' : 'var(--border)'}`,
        borderRadius: '10px',
        padding: '10px 14px',
        marginBottom: '8px',
        fontSize: '13px',
        color: 'var(--text-secondary)',
      }}>
        💡 {s.message}
      </div>
    ))}
  </section>
)}
```

- [ ] **Step 3: Build check + commit**
```bash
npx tsc --noEmit && npm run build 2>&1 | grep -E "Compiled|Error"
git add utils/workoutSuggestions.ts app/(tabs)/dashboard/page.tsx
git commit -m "feat: smart workout suggestions on dashboard — overdue muscles + streak tips"
```

---

## Final Check

- [ ] Full TypeScript check: `npx tsc --noEmit`
- [ ] Full build: `npm run build 2>&1 | grep -E "✓|Error"`
- [ ] Verify all 8 commits exist: `git log --oneline -10`
