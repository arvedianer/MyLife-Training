# Onboarding Rework + App Tour + Bugfixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two live bugs (Forum Chat black screen + Start-Tab always Restday), completely rework onboarding to be auth-first with Arved persona, and add a 24-step interactive guided App Tour.

**Architecture:** Bugs are fixed first (independent). Type/store foundations come next (other tasks depend on them). Onboarding rework follows top-to-bottom (new screens + updated screens). TourOverlay is a global component in `(tabs)/layout.tsx` driven by `tourStore`. Settings integration adds two new actions at the end.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Zustand + zustandStorage, Framer Motion, lucide-react, Supabase

---

## File Map

**New files:**
- `components/forum/ChatErrorBoundary.tsx` — React error boundary wrapping the chat page
- `store/tourStore.ts` — Zustand store: tourActive, tourStep, tourCompleted
- `components/tour/TourOverlay.tsx` — Global spotlight overlay + speech bubble
- `app/onboarding/welcome/page.tsx` — New Screen 1: Arved intro
- `app/onboarding/confirm-body/page.tsx` — New Zwischenscreen A: body data confirmation
- `app/onboarding/plan-preview/page.tsx` — New Zwischenscreen B: plan insight
- `app/onboarding/done/page.tsx` — New Screen 8: plan ready, launch tour

**Modified files:**
- `types/workout.ts` — Add `'alles'` to WorkoutGoal; add `'experte'` to TrainingLevel
- `types/user.ts` — Add `trainingWeekdays: number[]`, `secondaryGoal?: WorkoutGoal | null`; fix currentStep comment
- `store/userStore.ts` — Update `completeOnboarding` to `currentStep: 8`
- `store/planStore.ts` — Update `getTodaysSplitDay` to respect `trainingWeekdays`
- `hooks/useOnboardingGuard.ts` — Redirect to `/onboarding/welcome` instead of `/onboarding/name`
- `app/page.tsx` — Redirect to `/onboarding/welcome` instead of `/onboarding/name`
- `app/(tabs)/layout.tsx` — Mount `<TourOverlay />`
- `app/(tabs)/forum/[channelId]/page.tsx` — Wrap with ChatErrorBoundary, null-guard channelMeta
- `app/onboarding/name/page.tsx` — Arved text, progress dots, new subtext
- `app/onboarding/body/page.tsx` — Arved text, progress dots
- `app/onboarding/goal/page.tsx` — Add 'alles' card, dual-select (max 2), save secondaryGoal
- `app/onboarding/level/page.tsx` — 4 time-based options, map to new type values
- `app/onboarding/days/page.tsx` — Replace numeric input with Mo–So weekday toggle buttons
- `app/onboarding/equipment/page.tsx` — 3 cards only (remove 'minimalistisch' option)
- `app/onboarding/generating/page.tsx` — Animated checklist with real data
- `app/settings/page.tsx` — Add "Profil bearbeiten" + "App-Tour wiederholen" sections

---

## Task 1: Forum Chat — Error Boundary

**Files:**
- Create: `components/forum/ChatErrorBoundary.tsx`
- Modify: `app/(tabs)/forum/[channelId]/page.tsx`

- [ ] **Step 1: Create the ChatErrorBoundary component**

```typescript
// components/forum/ChatErrorBoundary.tsx
'use client';
import React from 'react';
import { colors, typography, spacing } from '@/constants/tokens';

interface State { hasError: boolean; error?: Error }

export class ChatErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bgPrimary,
          padding: spacing[6],
          gap: spacing[4],
        }}>
          <p style={{ ...typography.h3, color: colors.textPrimary, textAlign: 'center' }}>
            Chat konnte nicht geladen werden.
          </p>
          <p style={{ ...typography.body, color: colors.textMuted, textAlign: 'center' }}>
            Seite neu laden oder später nochmal versuchen.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: colors.accent,
              color: colors.bgPrimary,
              border: 'none',
              borderRadius: 8,
              padding: `${spacing[3]}px ${spacing[5]}px`,
              cursor: 'pointer',
              ...typography.label,
            }}
          >
            Neu laden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: Add null-guard for channelMeta in the chat page**

In `app/(tabs)/forum/[channelId]/page.tsx`, find the section that renders the channel header/messages. Before the main return, add a loading guard:

```typescript
// After channelMeta is loaded from useChannel:
if (loading) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPrimary }}>
      <p style={{ ...typography.body, color: colors.textMuted }}>Laden...</p>
    </div>
  );
}

if (!channelMeta) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPrimary }}>
      <p style={{ ...typography.body, color: colors.textMuted }}>Kanal nicht gefunden.</p>
    </div>
  );
}
```

- [ ] **Step 3: Wrap the chat page's main content with ChatErrorBoundary**

In `app/(tabs)/forum/[channelId]/page.tsx`, find the top-level return statement. Wrap the outer container with `<ChatErrorBoundary>`:

```typescript
import { ChatErrorBoundary } from '@/components/forum/ChatErrorBoundary';

// In the component return:
return (
  <ChatErrorBoundary>
    {/* existing outer div/container */}
  </ChatErrorBoundary>
);
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add components/forum/ChatErrorBoundary.tsx app/(tabs)/forum/[channelId]/page.tsx
git commit -m "fix: forum chat — Error Boundary + null guard for channelMeta"
```

---

## Task 2: Start-Tab — Restday Bug Fix

**Files:**
- Modify: `store/planStore.ts`

The current `getTodaysSplitDay()` always returns a split day via `adjustedDay % activeSplit.days.length`. After the onboarding rework, `userStore.profile.trainingWeekdays` will hold exact training days. We need `getTodaysSplitDay()` to return `undefined` (= rest day) when today is not a training day.

- [ ] **Step 1: Update getTodaysSplitDay to check trainingWeekdays**

In `store/planStore.ts`, replace the `getTodaysSplitDay` function (lines ~164–174):

```typescript
getTodaysSplitDay: () => {
  const state = get();
  const activeSplit = state.splits.find((s) => s.id === state.activeSplitId);
  if (!activeSplit) return undefined;

  const dayOfWeek = new Date().getDay();
  const adjustedDay = (dayOfWeek + 6) % 7; // [0=Mo, 1=Di, ..., 6=So]

  // Access userStore state directly (non-hook access — safe inside a Zustand action)
  // Import at top of planStore.ts: import { useUserStore } from '@/store/userStore';
  // Then call: useUserStore.getState().profile.trainingWeekdays
  const weekdays = (useUserStore.getState() as { profile?: { trainingWeekdays?: number[] } }).profile?.trainingWeekdays;

  if (Array.isArray(weekdays) && weekdays.length > 0) {
    if (!weekdays.includes(adjustedDay)) return undefined; // rest day

    // Map training weekday to split day index
    const sortedWeekdays = [...weekdays].sort((a, b) => a - b);
    const dayIndex = sortedWeekdays.indexOf(adjustedDay);
    return dayIndex >= 0 && dayIndex < activeSplit.days.length
      ? activeSplit.days[dayIndex]
      : undefined;
  }

  // Fallback: rotate through split days (original behavior for profiles without trainingWeekdays)
  const dayIndex = adjustedDay % activeSplit.days.length;
  return activeSplit.days[dayIndex];
},
```

**Important:** Add `import { useUserStore } from '@/store/userStore';` at the top of `store/planStore.ts`. Calling `useUserStore.getState()` outside a React component is safe and is the standard Zustand pattern for cross-store reads.

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add store/planStore.ts
git commit -m "fix: getTodaysSplitDay respects trainingWeekdays, returns undefined on rest days"
```

---

## Task 3: Type Foundations

**Files:**
- Modify: `types/workout.ts`
- Modify: `types/user.ts`

- [ ] **Step 1: Add 'alles' to WorkoutGoal in types/workout.ts**

Find the `WorkoutGoal` type (currently: `'muskelaufbau' | 'kraft' | 'abnehmen' | 'fitness' | 'ausdauer'`). Add `'alles'`:

```typescript
export type WorkoutGoal =
  | 'muskelaufbau'
  | 'kraft'
  | 'abnehmen'
  | 'fitness'
  | 'ausdauer'
  | 'alles';
```

- [ ] **Step 2: Add 'experte' to TrainingLevel in types/workout.ts**

Find the `TrainingLevel` type (currently: `'anfaenger' | 'fortgeschritten' | 'profi'`). Add `'experte'`:

```typescript
export type TrainingLevel = 'anfaenger' | 'fortgeschritten' | 'profi' | 'experte';
```

- [ ] **Step 3: Add new fields to UserProfile in types/user.ts**

Find the `UserProfile` interface. Add these fields after the existing ones:

```typescript
trainingWeekdays?: number[];             // [0=Mo, 1=Di, ..., 6=So]; conversion: (jsDay + 6) % 7
secondaryGoal?: WorkoutGoal | null;      // zweites Ziel (max. 2 Auswahl im Onboarding)
```

Also update the `currentStep` comment in `OnboardingState` from `// 1-5` to `// 1-8`:

```typescript
currentStep: number; // 1-8
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: possible errors if existing code switches on `TrainingLevel` exhaustively — fix any such exhaustive switch by adding `'experte'` cases (use `'profi'` behavior as fallback).

- [ ] **Step 5: Commit**

```bash
git add types/workout.ts types/user.ts
git commit -m "feat: extend WorkoutGoal + TrainingLevel types, add trainingWeekdays + secondaryGoal to UserProfile"
```

---

## Task 4: userStore — Update completeOnboarding

**Files:**
- Modify: `store/userStore.ts`

- [ ] **Step 1: Update completeOnboarding in userStore.ts**

Find `completeOnboarding` (currently sets `onboardingCompleted: true, onboardingStep: 5`). Change `onboardingStep` or `currentStep` to `8`:

```typescript
completeOnboarding: (profile: Partial<UserProfile>) =>
  set({
    onboardingCompleted: true,
    currentStep: 8,  // was: 5 — new flow has 8 input screens
    profile: { ...get().profile, ...profile },
    weightUnit: profile.weightUnit ?? 'kg',
  }),
```

Note: adapt to the actual field name used in the store (`onboardingStep` vs `currentStep`). Match what `useOnboardingGuard.ts` reads.

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add store/userStore.ts
git commit -m "feat: userStore completeOnboarding sets currentStep to 8 for new 8-screen flow"
```

---

## Task 5: tourStore

**Files:**
- Create: `store/tourStore.ts`

- [ ] **Step 1: Create tourStore.ts**

```typescript
// store/tourStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';

interface TourState {
  tourCompleted: boolean;
  tourActive: boolean;
  tourStep: number;        // 0-based, max 23 (displayed as 1-24)
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  resetTour: () => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set, get) => ({
      tourCompleted: false,
      tourActive: false,
      tourStep: 0,

      startTour: () => set({ tourActive: true, tourStep: 0 }),

      nextStep: () => {
        const { tourStep } = get();
        if (tourStep >= 23) {
          set({ tourActive: false, tourCompleted: true, tourStep: 0 });
        } else {
          set({ tourStep: tourStep + 1 });
        }
      },

      prevStep: () => {
        const { tourStep } = get();
        if (tourStep > 0) set({ tourStep: tourStep - 1 });
      },

      skipTour: () => set({ tourActive: false, tourCompleted: true, tourStep: 0 }),

      resetTour: () => set({ tourCompleted: false, tourActive: false, tourStep: 0 }),
    }),
    {
      name: 'tour-store',
      storage: zustandStorage,
      partialize: (state) => ({
        tourCompleted: state.tourCompleted,
        tourStep: state.tourStep,
      }),
    }
  )
);
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add store/tourStore.ts
git commit -m "feat: tourStore — Zustand store for 24-step App Tour with zustandStorage persistence"
```

---

## Task 6: Navigation Guards — Point to /onboarding/welcome

**Files:**
- Modify: `hooks/useOnboardingGuard.ts`
- Modify: `app/page.tsx`

- [ ] **Step 1: Update useOnboardingGuard.ts**

Find `router.replace('/onboarding/name')` and change to:

```typescript
router.replace('/onboarding/welcome');
```

- [ ] **Step 2: Update app/page.tsx**

Find `router.replace('/onboarding/name')` and change to:

```typescript
router.replace('/onboarding/welcome');
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add hooks/useOnboardingGuard.ts app/page.tsx
git commit -m "feat: onboarding entry point changed from /name to /welcome"
```

---

## Task 7: Onboarding Screen 1 — Welcome (/onboarding/welcome)

**Files:**
- Create: `app/onboarding/welcome/page.tsx`

No progress dots on this screen. No input. CTA button only.

- [ ] **Step 1: Create the Welcome page**

```typescript
// app/onboarding/welcome/page.tsx
'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { colors, spacing, typography, radius } from '@/constants/tokens';

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: colors.bgPrimary,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${spacing[6]}px ${spacing[5]}px`,
      gap: spacing[8],
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ display: 'flex', flexDirection: 'column', gap: spacing[4], maxWidth: 400, width: '100%' }}
      >
        <h1 style={{ ...typography.h1, color: colors.textPrimary, margin: 0 }}>
          Hey. Ich bin Arved.
        </h1>
        <p style={{ ...typography.bodyLg, color: colors.textSecondary, margin: 0 }}>
          Ich hab diese App gebaut weil alle anderen Geld kosten und keine davon wirklich optimal funktioniert.
        </p>
        <p style={{ ...typography.bodyLg, color: colors.textMuted, margin: 0 }}>
          2 Minuten — dann steht dein Plan.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        <button
          onClick={() => router.push('/onboarding/name')}
          style={{
            width: '100%',
            backgroundColor: colors.accent,
            color: colors.bgPrimary,
            border: 'none',
            borderRadius: radius.lg,
            padding: `${spacing[4]}px`,
            cursor: 'pointer',
            ...typography.h3,
          }}
        >
          Los geht's →
        </button>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/onboarding/welcome/page.tsx
git commit -m "feat: onboarding welcome screen — Arved intro, CTA to /onboarding/name"
```

---

## Task 8: Onboarding — Shared Progress Dots Component

**Files:**
- Create: `components/onboarding/ProgressDots.tsx`

Used on Screens 2–7 (not on Welcome, Zwischenscreens, Screen 8).

- [ ] **Step 1: Create ProgressDots component**

```typescript
// components/onboarding/ProgressDots.tsx
import { colors, spacing } from '@/constants/tokens';

interface ProgressDotsProps {
  total: number;   // 6 (screens 2–7)
  current: number; // 1-based
}

export function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <div style={{
      display: 'flex',
      gap: spacing[2],
      justifyContent: 'center',
    }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: i + 1 === current ? 20 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i + 1 === current ? colors.accent : colors.border,
            transition: 'width 0.2s ease, background-color 0.2s ease',
          }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/onboarding/ProgressDots.tsx
git commit -m "feat: shared ProgressDots component for onboarding screens 2–7"
```

---

---

> **Note for Tasks 9–16:** Each onboarding screen's `router.push()` to the next screen must pass through a `?edit=true` query param when present. Pattern: read `const isEdit = useSearchParams().get('edit') === 'true';` at the top of each screen, and append `?edit=true` to `router.push(...)` calls when `isEdit` is true. The final screen (equipment, Task 16) navigates to `/settings` instead of `/onboarding/generating` when `isEdit`. Task 22 lists all affected files in its commit.

---

## Task 9: Onboarding Screen 2 — Name (rework)

**Files:**
- Modify: `app/onboarding/name/page.tsx`

- [ ] **Step 1: Update name page**

Replace the existing content with the new Arved persona text, progress dots at top, and navigation to `/onboarding/body`. Key changes:
- Add `<ProgressDots total={6} current={1} />` at the top
- Change heading to: `"Wie soll ich dich nennen?"`
- Change subtext to: `"Damit ich dich nicht die ganze Zeit 'du' nenne."`
- Keep: text input, autofocus, min 2 chars to enable continue button
- Change continue route from wherever it was to `/onboarding/body` (already correct per exploration)
- Remove any "Step X of Y" text label (replaced by dots)

Pattern (adapt existing code, don't rewrite from scratch):
```typescript
import { ProgressDots } from '@/components/onboarding/ProgressDots';

// Add at top of page content (above heading):
<ProgressDots total={6} current={1} />
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/onboarding/name/page.tsx
git commit -m "feat: onboarding name screen — Arved text, progress dots"
```

---

## Task 10: Onboarding Screen 3 — Body (rework)

**Files:**
- Modify: `app/onboarding/body/page.tsx`

- [ ] **Step 1: Update body page**

Key changes:
- Add `<ProgressDots total={6} current={2} />` at the top
- Change heading to: `"Und ein paar Zahlen, [name]."` (read name from `useUserStore`)
- Add subtext: `"Für realistische Gewichtsvorschläge und Leistungsvergleiche."`
- All fields remain optional with "Überspringen" / "Weiter" button
- Change continue route to `/onboarding/confirm-body` (was `/onboarding/goal`)

```typescript
import { ProgressDots } from '@/components/onboarding/ProgressDots';
import { useUserStore } from '@/store/userStore';

const name = useUserStore((s) => s.profile.name);

// Heading:
<h1>Und ein paar Zahlen{name ? `, ${name}` : ''}.</h1>
```

- [ ] **Step 2: TypeScript check + Commit**

```bash
npx tsc --noEmit
git add app/onboarding/body/page.tsx
git commit -m "feat: onboarding body screen — Arved text, progress dots, route to confirm-body"
```

---

## Task 11: Onboarding Zwischenscreen A — confirm-body

**Files:**
- Create: `app/onboarding/confirm-body/page.tsx`

Auto-advances after 2.5s or on tap. Reads data from userStore. No progress dots.

- [ ] **Step 1: Create confirm-body page**

```typescript
// app/onboarding/confirm-body/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { colors, spacing, typography } from '@/constants/tokens';

export default function ConfirmBodyPage() {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);

  useEffect(() => {
    const t = setTimeout(() => router.push('/onboarding/goal'), 2500);
    return () => clearTimeout(t);
  }, [router]);

  const hasData = profile.age || profile.bodyWeight || profile.height;
  const summary = [
    profile.age ? `${profile.age} J.` : null,
    profile.bodyWeight ? `${profile.bodyWeight}kg` : null,
    profile.height ? `${profile.height}cm` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div
      onClick={() => router.push('/onboarding/goal')}
      style={{
        minHeight: '100dvh',
        backgroundColor: colors.bgPrimary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${spacing[6]}px ${spacing[5]}px`,
        cursor: 'pointer',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{ maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', gap: spacing[3] }}
      >
        <h2 style={{ ...typography.h2, color: colors.accent, margin: 0 }}>
          {hasData
            ? `${profile.name ? profile.name + '. ' : ''}${summary}`
            : `Alright${profile.name ? `, ${profile.name}` : ''}.`}
        </h2>
        <p style={{ ...typography.bodyLg, color: colors.textSecondary, margin: 0 }}>
          {hasData ? 'Gute Basis. Jetzt: Was willst du?' : 'Kommen wir zu deinen Zielen.'}
        </p>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check + Commit**

```bash
npx tsc --noEmit
git add app/onboarding/confirm-body/page.tsx
git commit -m "feat: onboarding Zwischenscreen A — body data confirmation, auto-advance 2.5s"
```

---

## Task 12: Onboarding Screen 4 — Goal (rework)

**Files:**
- Modify: `app/onboarding/goal/page.tsx`

- [ ] **Step 1: Update goal page**

Key changes:
- Add `<ProgressDots total={6} current={3} />`
- Add `'alles'` card (5th option): Icon `Target` (or any fitting lucide icon), label `"Alles davon"`, subtext `"Rundum besser werden"`
- Allow dual-select: up to 2 goals; first tapped = primary (`goal`), second tapped = `secondaryGoal`
- Save both to store: `updateProfile({ goal: primaryGoal, secondaryGoal: secondaryGoal ?? null })`
- Route continues to `/onboarding/level`

```typescript
import { ProgressDots } from '@/components/onboarding/ProgressDots';

// State:
const [selected, setSelected] = useState<WorkoutGoal[]>([]);

const toggle = (g: WorkoutGoal) => {
  setSelected((prev) => {
    if (prev.includes(g)) return prev.filter((x) => x !== g);
    if (prev.length >= 2) return [prev[0], g]; // replace second
    return [...prev, g];
  });
};

// On continue:
updateProfile({
  goal: selected[0],
  secondaryGoal: selected[1] ?? null,
});
router.push('/onboarding/level');
```

Goals array to pass through:
```typescript
const GOALS = [
  { id: 'kraft' as WorkoutGoal, icon: Zap, label: 'Kraft aufbauen', sub: 'Schwerer heben, Bestleistungen brechen' },
  { id: 'muskelaufbau' as WorkoutGoal, icon: Dumbbell, label: 'Muskeln aufbauen', sub: 'Mehr Masse, bessere Optik' },
  { id: 'abnehmen' as WorkoutGoal, icon: TrendingDown, label: 'Abnehmen', sub: 'Fett verlieren, Form halten' },
  { id: 'fitness' as WorkoutGoal, icon: Activity, label: 'Fit bleiben', sub: 'Energie, Gesundheit, Ausdauer' },
  { id: 'alles' as WorkoutGoal, icon: Target, label: 'Alles davon', sub: 'Rundum besser werden' },
];
```
All icons from `lucide-react`.

- [ ] **Step 2: TypeScript check + Commit**

```bash
npx tsc --noEmit
git add app/onboarding/goal/page.tsx
git commit -m "feat: onboarding goal screen — 'alles' option, dual-select, saves secondaryGoal"
```

---

## Task 13: Onboarding Screen 5 — Level (rework)

**Files:**
- Modify: `app/onboarding/level/page.tsx`

- [ ] **Step 1: Update level page**

Key changes:
- Add `<ProgressDots total={6} current={4} />`
- Replace any 3-option layout with 4 time-based cards (no demotivating labels):

```typescript
const LEVELS = [
  { id: 'anfaenger' as TrainingLevel, label: 'Gerade gestartet', sub: 'Weniger als 6 Monate' },
  { id: 'fortgeschritten' as TrainingLevel, label: 'Ich kenn mich aus', sub: '6 Monate bis 2 Jahre' },
  { id: 'profi' as TrainingLevel, label: 'Ich weiß was ich tue', sub: '2 bis 4 Jahre' },
  { id: 'experte' as TrainingLevel, label: 'Ich trainiere schon lang', sub: '4+ Jahre, ich hab einen Plan' },
];
```
- Single-select, continues to `/onboarding/plan-preview`

- [ ] **Step 2: TypeScript check + Commit**

```bash
npx tsc --noEmit
git add app/onboarding/level/page.tsx
git commit -m "feat: onboarding level screen — 4 time-based options incl. experte, route to plan-preview"
```

---

## Task 14: Onboarding Zwischenscreen B — plan-preview

**Files:**
- Create: `app/onboarding/plan-preview/page.tsx`

Auto-advances after 3s or tap. Reads goal + level from store for dynamic text. No progress dots.

- [ ] **Step 1: Create plan-preview page**

```typescript
// app/onboarding/plan-preview/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { colors, spacing, typography } from '@/constants/tokens';
import type { WorkoutGoal, TrainingLevel } from '@/types/workout';

function getPlanInsight(goal: WorkoutGoal, level: TrainingLevel): { title: string; body: string } {
  const isExperienced = level === 'profi' || level === 'experte';
  if (goal === 'kraft' && isExperienced)
    return { title: 'Progressive Overload.', body: 'Schwere Grundübungen, wöchentliche Steigerung. Genau das was Leute auf deinem Level voranbringt.' };
  if (goal === 'muskelaufbau' && !isExperienced)
    return { title: 'Hypertrophie-Training.', body: 'Volumen und Technik stehen im Vordergrund — das bringt dir Masse.' };
  if (goal === 'abnehmen' && level === 'anfaenger')
    return { title: 'Metabolisches Training.', body: 'Hohe Intensität, kurze Pausen, viel Volumen. Fett weg, Form bleibt.' };
  if (goal === 'alles')
    return { title: 'Vollständiges Programm.', body: 'Kraft, Volumen, Ausdauer — alles ausbalanciert.' };
  return { title: 'Dein Plan.', body: 'Dein Plan passt sich deinen Antworten an. Kommen wir zu den Details.' };
}

export default function PlanPreviewPage() {
  const router = useRouter();
  const { goal, level } = useUserStore((s) => s.profile);

  useEffect(() => {
    const t = setTimeout(() => router.push('/onboarding/days'), 3000);
    return () => clearTimeout(t);
  }, [router]);

  const insight = getPlanInsight(goal ?? 'fitness', level ?? 'anfaenger');

  return (
    <div
      onClick={() => router.push('/onboarding/days')}
      style={{
        minHeight: '100dvh',
        backgroundColor: colors.bgPrimary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${spacing[6]}px ${spacing[5]}px`,
        cursor: 'pointer',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', gap: spacing[3] }}
      >
        <h2 style={{ ...typography.h2, color: colors.accent, margin: 0 }}>{insight.title}</h2>
        <p style={{ ...typography.bodyLg, color: colors.textSecondary, margin: 0 }}>{insight.body}</p>
        <p style={{ ...typography.body, color: colors.textMuted, margin: 0 }}>Jetzt noch wann und wo.</p>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check + Commit**

```bash
npx tsc --noEmit
git add app/onboarding/plan-preview/page.tsx
git commit -m "feat: onboarding Zwischenscreen B — plan insight based on goal + level, auto-advance 3s"
```

---

## Task 15: Onboarding Screen 6 — Days (weekday picker rework)

**Files:**
- Modify: `app/onboarding/days/page.tsx`

Full rework: replace numeric input with Mo–So toggle buttons.

- [ ] **Step 1: Rewrite days page with weekday picker**

```typescript
// app/onboarding/days/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { ProgressDots } from '@/components/onboarding/ProgressDots';
import { colors, spacing, typography, radius } from '@/constants/tokens';
import type { TrainingDays } from '@/types/workout';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function getFeedback(count: number, goal: string): string {
  if (count === 0) return 'Wähle mindestens 2 Tage.';
  if (count === 1) return '1 Tag — wähle noch einen weiteren.';
  if (count === 2) return '2 Tage — Minimalismus. Funktioniert mit dem richtigen Plan.';
  if (count === 3) return `3 Tage — das ideale Volumen${goal ? ' für dein Ziel' : ''}.`;
  if (count === 4) return '4 Tage — solid. Genug Regeneration zwischen den Einheiten.';
  return `${count} Tage — ambitioniert. Schlaf und Ernährung nicht vergessen.`;
}

export default function DaysPage() {
  const router = useRouter();
  const { goal } = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const [selected, setSelected] = useState<number[]>([]); // [0=Mo, ..., 6=So]

  const toggle = (i: number) => {
    setSelected((prev) =>
      prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]
    );
  };

  const canContinue = selected.length >= 2;

  const handleContinue = () => {
    const sorted = [...selected].sort((a, b) => a - b);
    updateProfile({
      trainingWeekdays: sorted,
      trainingDays: Math.min(sorted.length, 6) as TrainingDays,
    });
    router.push('/onboarding/equipment');
  };

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: colors.bgPrimary,
      display: 'flex',
      flexDirection: 'column',
      padding: `${spacing[6]}px ${spacing[5]}px`,
      gap: spacing[6],
    }}>
      <ProgressDots total={6} current={5} />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ display: 'flex', flexDirection: 'column', gap: spacing[5], flex: 1 }}
      >
        <h1 style={{ ...typography.h1, color: colors.textPrimary, margin: 0 }}>
          Wann kannst du trainieren?
        </h1>

        <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
          {WEEKDAYS.map((day, i) => {
            const active = selected.includes(i);
            return (
              <button
                key={day}
                onClick={() => toggle(i)}
                style={{
                  padding: `${spacing[3]}px ${spacing[4]}px`,
                  borderRadius: radius.md,
                  border: `1px solid ${active ? colors.accent : colors.border}`,
                  backgroundColor: active ? colors.accentBg : colors.bgCard,
                  color: active ? colors.accent : colors.textMuted,
                  cursor: 'pointer',
                  ...typography.label,
                  transition: 'all 0.15s ease',
                }}
              >
                {day}
              </button>
            );
          })}
        </div>

        <p style={{ ...typography.body, color: colors.textMuted, margin: 0 }}>
          {getFeedback(selected.length, goal ?? '')}
        </p>
      </motion.div>

      <button
        disabled={!canContinue}
        onClick={handleContinue}
        style={{
          width: '100%',
          backgroundColor: canContinue ? colors.accent : colors.bgHighest,
          color: canContinue ? colors.bgPrimary : colors.textDisabled,
          border: 'none',
          borderRadius: radius.lg,
          padding: `${spacing[4]}px`,
          cursor: canContinue ? 'pointer' : 'not-allowed',
          ...typography.h3,
        }}
      >
        Weiter
      </button>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check + Commit**

```bash
npx tsc --noEmit
git add app/onboarding/days/page.tsx
git commit -m "feat: onboarding days screen — weekday toggle picker Mo–So, saves trainingWeekdays"
```

---

## Task 16: Onboarding Screen 7 — Equipment (rework)

**Files:**
- Modify: `app/onboarding/equipment/page.tsx`

- [ ] **Step 1: Update equipment page to show 3 cards**

Key changes:
- Add `<ProgressDots total={6} current={6} />`
- Replace 4-card grid with 3-card grid (remove `'minimalistisch'` card):

```typescript
const EQUIPMENT_OPTIONS = [
  { id: 'vollausgestattet' as EquipmentType, label: 'Fitnessstudio', sub: 'Freie Gewichte, Kabelzug, Maschinen' },
  { id: 'kurzhanteln' as EquipmentType, label: 'Zuhause + Equipment', sub: 'Hanteln, Stange, Bank' },
  { id: 'eigengewicht' as EquipmentType, label: 'Nur Bodyweight', sub: 'Kein Equipment' },
];
```

- Route continues to `/onboarding/generating` (unchanged)

- [ ] **Step 2: TypeScript check + Commit**

```bash
npx tsc --noEmit
git add app/onboarding/equipment/page.tsx
git commit -m "feat: onboarding equipment screen — 3 cards, progress dots"
```

---

## Task 17: Onboarding Zwischenscreen C — Generating (rework)

**Files:**
- Modify: `app/onboarding/generating/page.tsx`

- [ ] **Step 1: Update generating page with animated checklist**

Replace existing content with animated checklist. Each item fades in sequentially. After all items shown, navigate to `/onboarding/done`.

```typescript
// app/onboarding/generating/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { colors, spacing, typography } from '@/constants/tokens';
import { Check, Loader } from 'lucide-react';

export default function GeneratingPage() {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const [step, setStep] = useState(0);

  const GOAL_LABELS: Record<string, string> = {
    kraft: 'Kraft aufbauen', muskelaufbau: 'Muskeln aufbauen',
    abnehmen: 'Abnehmen', fitness: 'Fit bleiben', alles: 'Alles', ausdauer: 'Ausdauer',
  };
  const EQUIPMENT_LABELS: Record<string, string> = {
    vollausgestattet: 'Fitnessstudio', kurzhanteln: 'Zuhause + Equipment',
    eigengewicht: 'Bodyweight', minimalistisch: 'Minimalistisch',
  };

  const items = [
    '✓ Körperdaten analysiert',
    `✓ Ziel: ${GOAL_LABELS[profile.goal ?? 'fitness'] ?? profile.goal}`,
    `✓ ${profile.trainingWeekdays?.length ?? profile.trainingDays ?? 3} Trainingstage geplant`,
    `✓ Equipment: ${EQUIPMENT_LABELS[profile.equipment ?? 'vollausgestattet'] ?? profile.equipment}`,
    '⏳ Split wird berechnet...',
    '✓ Plan steht.',
  ];

  useEffect(() => {
    if (step < items.length) {
      const t = setTimeout(() => setStep((s) => s + 1), 400);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => router.push('/onboarding/done'), 800);
      return () => clearTimeout(t);
    }
  }, [step, items.length, router]);

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: colors.bgPrimary,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${spacing[6]}px ${spacing[5]}px`,
    }}>
      <div style={{ maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
        <AnimatePresence>
          {items.slice(0, step).map((item, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                ...typography.bodyLg,
                color: i === items.length - 1 ? colors.accent : colors.textSecondary,
                margin: 0,
              }}
            >
              {item}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check + Commit**

```bash
npx tsc --noEmit
git add app/onboarding/generating/page.tsx
git commit -m "feat: onboarding generating screen — animated checklist with real profile data"
```

---

## Task 18: Onboarding Screen 8 — Done (/onboarding/done)

**Files:**
- Create: `app/onboarding/done/page.tsx`

No progress dots. CTA launches the App Tour.

- [ ] **Step 1: Create done page**

```typescript
// app/onboarding/done/page.tsx
'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { useTourStore } from '@/store/tourStore';
import { usePlanStore } from '@/store/planStore';
import { colors, spacing, typography, radius } from '@/constants/tokens';

export default function DonePage() {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const startTour = useTourStore((s) => s.startTour);
  const activeSplit = usePlanStore((s) => s.getActiveSplit());

  const handleStart = () => {
    completeOnboarding(profile);  // sets onboardingCompleted: true
    startTour();                   // sets tourActive: true, tourStep: 0
    router.replace('/');           // navigate to dashboard (tour will take over)
  };

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: colors.bgPrimary,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${spacing[6]}px ${spacing[5]}px`,
      gap: spacing[8],
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', gap: spacing[4] }}
      >
        <h1 style={{ ...typography.h1, color: colors.textPrimary, margin: 0 }}>
          Dein Plan steht{profile.name ? `, ${profile.name}` : ''}.
        </h1>
        {activeSplit && (
          <p style={{ ...typography.bodyLg, color: colors.accent, margin: 0 }}>
            {activeSplit.name} — {profile.trainingDays ?? 3} Tage pro Woche.
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        <button
          onClick={handleStart}
          style={{
            width: '100%',
            backgroundColor: colors.accent,
            color: colors.bgPrimary,
            border: 'none',
            borderRadius: radius.lg,
            padding: `${spacing[4]}px`,
            cursor: 'pointer',
            ...typography.h3,
          }}
        >
          App kennenlernen →
        </button>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check + Commit**

```bash
npx tsc --noEmit
git add app/onboarding/done/page.tsx
git commit -m "feat: onboarding done screen — plan summary, CTA launches App Tour"
```

---

## Task 19: TourOverlay Component

**Files:**
- Create: `components/tour/TourOverlay.tsx`

The TourOverlay is the heart of the App Tour. It renders a dark backdrop, a spotlight "hole" over the target element, and Arved's speech bubble.

**Approach:**
- `box-shadow: 0 0 0 9999px rgba(0,0,0,0.75)` on a positioned div creates the spotlight
- A transparent full-screen backdrop (`pointer-events: auto`) blocks clicks outside the spotlight
- The spotlight div itself: `pointer-events: none` (the target element below remains clickable)
- The target element gets `data-tour-active="true"` attribute set dynamically, which CSS promotes to `z-index: 10000`

- [ ] **Step 1: Add global CSS for tour target elevation**

In `app/globals.css` (or wherever global styles live), add:

```css
[data-tour-active="true"] {
  position: relative !important;
  z-index: 10000 !important;
}
```

- [ ] **Step 2: Define tour steps config**

Create `components/tour/tourSteps.ts`:

```typescript
// components/tour/tourSteps.ts
export interface TourStep {
  id: number;             // 1-based for display
  route: string;          // route to navigate to before showing step
  selector: string;       // CSS selector for spotlight target
  text: string;           // Arved's speech bubble text
  action: 'next' | 'tap'; // 'next' = Weiter button; 'tap' = user taps the highlighted element
}

export const TOUR_STEPS: TourStep[] = [
  { id: 1, route: '/', selector: '[data-tour="streak-card"]', text: 'Das ist dein Dashboard. Streak, Wochenvolumen, Athlete Score — alles auf einen Blick.', action: 'next' },
  { id: 2, route: '/', selector: '[data-tour="athlete-score"]', text: 'Der Athlete Score geht von 0 bis 1000. Fünf Dimensionen — Kraft, Konsistenz, Volumen, Ausdauer, Ausgewogenheit. Keine fake Zahl.', action: 'next' },
  { id: 3, route: '/', selector: '[data-tour="nav-stats"]', text: 'Auf Stats siehst du wie du dich langfristig entwickelst.', action: 'tap' },
  { id: 4, route: '/stats', selector: '[data-tour="heatmap"]', text: 'Die Heatmap zeigt wann du trainiert hast. Grüner = mehr Volumen.', action: 'next' },
  { id: 5, route: '/stats', selector: '[data-tour="benchmarks"]', text: 'Die Benchmarks vergleichen deine Lifts mit Trainierenden auf deinem Level. Ehrlich.', action: 'next' },
  { id: 6, route: '/stats', selector: '[data-tour="nav-splits"]', text: 'Jetzt zu deinem Plan.', action: 'tap' },
  { id: 7, route: '/splits', selector: '[data-tour="active-split-card"]', text: 'Das ist dein Trainingsplan — generiert auf Basis deiner Antworten. Du kannst ihn komplett anpassen.', action: 'tap' },
  { id: 8, route: '/splits/[first-split]', selector: '[data-tour="split-day-card"]', text: 'Das sind deine Trainingstage. Jeder Tag hat seine Übungen. Tippe auf einen Tag.', action: 'tap' },
  { id: 9, route: '/splits/[first-split]/[first-day]', selector: '[data-tour="split-exercise-list"]', text: 'Hier siehst du alle Übungen für diesen Tag. Reihenfolge per Drag & Drop änderbar — halte eine Übung gedrückt.', action: 'next' },
  { id: 10, route: '/', selector: '[data-tour="coach-bubble"]', text: 'Und dann noch das hier.', action: 'tap' },
  { id: 11, route: '/chat', selector: '[data-tour="coach-suggestions"]', text: 'Das bin ich — Coach Arved. Ich kenn deine Daten, deine PRs, deine verpassten Sessions. Frag mich was du willst.', action: 'tap' },
  { id: 12, route: '/chat', selector: '[data-tour="coach-response"]', text: 'Genau so antworte ich. Direkt, ohne Filler.', action: 'next' },
  { id: 13, route: '/chat', selector: '[data-tour="nav-forum"]', text: 'Und das Forum.', action: 'tap' },
  { id: 14, route: '/forum', selector: '[data-tour="forum-tabs"]', text: 'General Chat, Freunde, Community. Im Community-Tab siehst du live wer gerade trainiert.', action: 'next' },
  { id: 15, route: '/forum', selector: '[data-tour="nav-start"]', text: 'Okay. Jetzt das Wichtigste. Dein erstes Workout.', action: 'tap' },
  { id: 16, route: '/start', selector: '[data-tour="start-button"]', text: 'Das ist dein heutiger Plan. Klick auf Training starten.', action: 'tap' },
  { id: 17, route: '/workout/active', selector: '[data-tour="workout-exercise-list"]', text: 'Das ist dein aktives Workout. Alle Übungen für heute. Tippe auf eine Übung.', action: 'tap' },
  { id: 18, route: '/workout/active', selector: '[data-tour="set-input"]', text: 'Trag dein Gewicht und deine Wiederholungen ein. Der Vorschlag basiert auf deinen Angaben. Dann: Haken.', action: 'tap' },
  { id: 19, route: '/workout/active', selector: '[data-tour="rest-timer"]', text: 'Der Timer startet automatisch nach jedem Satz. Du weißt immer wann du wieder loslegen kannst — oder überspringst ihn.', action: 'next' },
  { id: 20, route: '/workout/active', selector: '[data-tour="exercise-options"]', text: 'Das Zahnrad öffnet Optionen für jede Übung — Notizen, Gewichtsverlauf, Übung tauschen.', action: 'tap' },
  { id: 21, route: '/workout/active', selector: '[data-tour="finish-button"]', text: 'Wenn du fertig bist: Training beenden.', action: 'tap' },
  { id: 22, route: '/workout/summary', selector: '[data-tour="summary-stats"]', text: 'Das ist deine Zusammenfassung — Volumen, PRs, Score-Veränderung. Das bleibt gespeichert.', action: 'next' },
  { id: 23, route: '/log', selector: '[data-tour="first-log-entry"]', text: 'Das ist dein erstes Workout in der History. Das war unser Tutorial — du kannst es löschen. Wisch nach links.', action: 'tap' },
  { id: 24, route: '/', selector: 'body', text: 'Das war alles. Du kennst die App jetzt. Dein echter Plan startet hier.', action: 'next' },
];
```

Note: Steps 7–9 have dynamic routes. The TourOverlay will navigate to the first available split/day when reaching those steps. The `[first-split]` and `[first-day]` placeholders in routes will be resolved at runtime.

- [ ] **Step 3: Create TourOverlay component**

```typescript
// components/tour/TourOverlay.tsx
'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTourStore } from '@/store/tourStore';
import { usePlanStore } from '@/store/planStore';
import { TOUR_STEPS } from './tourSteps';
import { colors, spacing, typography, radius } from '@/constants/tokens';

export function TourOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const { tourActive, tourStep, nextStep, prevStep, skipTour } = useTourStore();
  const splits = usePlanStore((s) => s.splits);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [windowHeight, setWindowHeight] = useState(0);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    setWindowHeight(window.innerHeight);
    const handler = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const step = TOUR_STEPS[tourStep];
  if (!step) return null;

  // Resolve dynamic routes for split/day steps
  const resolveRoute = useCallback((route: string): string => {
    if (route.includes('[first-split]')) {
      const firstSplit = splits[0];
      if (!firstSplit) return '/splits';
      const resolved = route.replace('[first-split]', firstSplit.name.toLowerCase().replace(/\s+/g, '-'));
      if (resolved.includes('[first-day]')) {
        const firstDay = firstSplit.days[0];
        return resolved.replace('[first-day]', firstDay?.name?.toLowerCase().replace(/\s+/g, '-') ?? '0');
      }
      return resolved;
    }
    return route;
  }, [splits]);

  // Navigate to required route if not already there
  useEffect(() => {
    if (!tourActive || !step) return;
    const targetRoute = resolveRoute(step.route);
    if (pathname !== targetRoute) {
      router.push(targetRoute);
    }
  }, [tourActive, tourStep, pathname, step, resolveRoute, router]);

  // Find the target element and update spotlight rect
  useEffect(() => {
    if (!tourActive || !step) return;

    const findAndSet = () => {
      const el = document.querySelector(step.selector) as HTMLElement | null;
      if (el) {
        el.setAttribute('data-tour-active', 'true');
        setSpotlightRect(el.getBoundingClientRect());
        return true;
      }
      return false;
    };

    // Clean previous active attribute
    document.querySelectorAll('[data-tour-active]').forEach((el) =>
      el.removeAttribute('data-tour-active')
    );

    if (!findAndSet()) {
      // Retry via MutationObserver if element not found yet (page still loading)
      observerRef.current?.disconnect();
      observerRef.current = new MutationObserver(() => {
        if (findAndSet()) observerRef.current?.disconnect();
      });
      observerRef.current.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      observerRef.current?.disconnect();
      document.querySelectorAll('[data-tour-active]').forEach((el) =>
        el.removeAttribute('data-tour-active')
      );
    };
  }, [tourActive, tourStep, step]);

  // Handle 'tap' action: listen for click on highlighted element
  useEffect(() => {
    if (!tourActive || step?.action !== 'tap') return;
    const el = document.querySelector(step.selector);
    if (!el) return;
    const handler = () => nextStep();
    el.addEventListener('click', handler, { once: true });
    return () => el.removeEventListener('click', handler);
  }, [tourActive, tourStep, step, nextStep]);

  if (!tourActive) return null;

  const padding = 8;
  const sr = spotlightRect;

  return (
    <AnimatePresence>
      {tourActive && (
        <>
          {/* Full-screen backdrop — blocks clicks outside spotlight */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              zIndex: 9997,
              pointerEvents: 'auto',
            }}
            onClick={() => {}} // absorbs clicks
          />

          {/* Spotlight div — creates the dim overlay via box-shadow */}
          {sr && (
            <div
              style={{
                position: 'fixed',
                left: sr.left - padding,
                top: sr.top - padding,
                width: sr.width + padding * 2,
                height: sr.height + padding * 2,
                borderRadius: radius.md,
                boxShadow: `0 0 0 9999px rgba(0,0,0,0.75)`,
                zIndex: 9998,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Skip button */}
          <button
            onClick={skipTour}
            style={{
              position: 'fixed', top: spacing[4], right: spacing[4],
              zIndex: 10001,
              background: 'transparent', border: 'none',
              color: colors.textMuted, cursor: 'pointer',
              ...typography.bodySm,
            }}
          >
            Tour überspringen
          </button>

          {/* Speech bubble */}
          <motion.div
            key={tourStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed',
              zIndex: 10001,
              left: spacing[4],
              right: spacing[4],
              bottom: sr && windowHeight > 0 && sr.top > windowHeight / 2
                ? windowHeight - sr.top + spacing[3]
                : undefined,
              top: sr && (windowHeight === 0 || sr.top <= windowHeight / 2)
                ? sr.bottom + spacing[3]
                : undefined,
              backgroundColor: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.lg,
              padding: spacing[5],
              display: 'flex',
              flexDirection: 'column',
              gap: spacing[4],
            }}
          >
            <p style={{ ...typography.bodyLg, color: colors.textPrimary, margin: 0 }}>
              {step.text}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ ...typography.monoSm, color: colors.textFaint }}>
                Schritt {step.id} von 24
              </span>

              <div style={{ display: 'flex', gap: spacing[3] }}>
                {tourStep > 0 && (
                  <button
                    onClick={prevStep}
                    style={{
                      background: 'transparent', border: `1px solid ${colors.border}`,
                      borderRadius: radius.md, padding: `${spacing[2]}px ${spacing[4]}px`,
                      color: colors.textMuted, cursor: 'pointer', ...typography.bodySm,
                    }}
                  >
                    Zurück
                  </button>
                )}
                {step.action === 'next' && (
                  <button
                    onClick={tourStep === 23 ? skipTour : nextStep}
                    style={{
                      backgroundColor: tourStep === 23 ? colors.success : colors.accent,
                      border: 'none', borderRadius: radius.md,
                      padding: `${spacing[2]}px ${spacing[4]}px`,
                      color: colors.bgPrimary, cursor: 'pointer', ...typography.label,
                    }}
                  >
                    {tourStep === 23 ? 'Los geht\'s 🔥' : 'Weiter'}
                  </button>
                )}
                {step.action === 'tap' && (
                  <span style={{ ...typography.bodySm, color: colors.textMuted }}>
                    Tippe auf das markierte Element
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: TypeScript check + Commit**

```bash
npx tsc --noEmit
git add components/tour/TourOverlay.tsx components/tour/tourSteps.ts
git commit -m "feat: TourOverlay component — spotlight, speech bubble, 24 steps config"
```

---

## Task 20: Mount TourOverlay in (tabs)/layout.tsx

**Files:**
- Modify: `app/(tabs)/layout.tsx`

- [ ] **Step 1: Import and mount TourOverlay**

In `app/(tabs)/layout.tsx`, add `<TourOverlay />` inside the main layout, after `<BottomNav />`:

```typescript
import { TourOverlay } from '@/components/tour/TourOverlay';

// Inside the layout return, after <BottomNav />:
<TourOverlay />
```

- [ ] **Step 2: TypeScript check + Commit**

```bash
npx tsc --noEmit
git add app/(tabs)/layout.tsx
git commit -m "feat: mount TourOverlay in tabs layout"
```

---

## Task 21: Add data-tour Attributes to Target Elements

Each tour step's `selector` uses `data-tour="..."` attributes. These need to be added to the correct elements across the app.

**Files to modify:**
- `app/(tabs)/index.tsx` (Dashboard) — streak card, athlete score, bottom nav items
- `app/(tabs)/stats/page.tsx` — heatmap section, benchmarks section
- `app/(tabs)/splits/page.tsx` — active split card
- `app/(tabs)/start/page.tsx` — start button
- `app/(tabs)/forum/page.tsx` — forum tabs
- `app/workout/active/page.tsx` — exercise list, set input, rest timer, options gear, finish button
- `app/workout/summary/page.tsx` — summary stats
- `app/(tabs)/log/page.tsx` — first log entry
- `components/ui/CoachBubble.tsx` — coach bubble
- `app/(tabs)/layout.tsx` — bottom nav items (stats, splits, forum, start)

- [ ] **Step 1: Add data-tour attributes to Dashboard (app/(tabs)/index.tsx)**

Find the streak card container div and add: `data-tour="streak-card"`
Find the athlete score card/section and add: `data-tour="athlete-score"`

- [ ] **Step 2: Add data-tour to bottom nav items in BottomNav component**

In `components/ui/BottomNav.tsx` (or wherever the nav links are), add:
- Stats link: `data-tour="nav-stats"`
- Splits link: `data-tour="nav-splits"`
- Forum link: `data-tour="nav-forum"`
- Start link: `data-tour="nav-start"`

- [ ] **Step 3: Add data-tour to Stats page**

In `app/(tabs)/stats/page.tsx`:
- Heatmap container: `data-tour="heatmap"`
- Benchmarks section: `data-tour="benchmarks"`

- [ ] **Step 4: Add data-tour to Splits page**

In `app/(tabs)/splits/page.tsx`:
- Active split card: `data-tour="active-split-card"`

In split detail page (`app/splits/[splitName]/page.tsx` or similar):
- First training day card: `data-tour="split-day-card"`

In split day detail:
- Exercise list container: `data-tour="split-exercise-list"` (distinct from workout active page)

- [ ] **Step 5: Add data-tour to CoachBubble**

In `components/ui/CoachBubble.tsx`, add to the outer element: `data-tour="coach-bubble"`

- [ ] **Step 6: Add data-tour to Coach Chat page**

In `app/(tabs)/chat/page.tsx`:
- Suggested questions section: `data-tour="coach-suggestions"`
- First AI response (when it appears): `data-tour="coach-response"`

- [ ] **Step 7: Add data-tour to Forum page**

In `app/(tabs)/forum/page.tsx`:
- Tab bar (General/Freunde/Community): `data-tour="forum-tabs"`

- [ ] **Step 8: Add data-tour to Start page**

In `app/(tabs)/start/page.tsx`:
- Main workout start button: `data-tour="start-button"`

- [ ] **Step 9: Add data-tour to Active Workout page**

In `app/workout/active/page.tsx`:
- Exercise list container: `data-tour="workout-exercise-list"` (distinct from split day's `split-exercise-list`)
- First set input row: `data-tour="set-input"`
- Rest timer component: `data-tour="rest-timer"`
- First exercise options gear: `data-tour="exercise-options"`
- Finish button: `data-tour="finish-button"`

- [ ] **Step 10: Add data-tour to Summary + Log pages**

In `app/workout/summary/page.tsx`:
- Stats section: `data-tour="summary-stats"`

In `app/(tabs)/log/page.tsx`:
- First session entry: `data-tour="first-log-entry"` (on the first item in the list)

- [ ] **Step 11: TypeScript check + Commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "feat: add data-tour attributes to all 24 tour step target elements"
```

---

## Task 22: Settings — Profil bearbeiten + Tour wiederholen

**Files:**
- Modify: `app/settings/page.tsx`

- [ ] **Step 1: Add "Profil bearbeiten" section**

In `app/settings/page.tsx`, add a new section after the existing profile display. The section should navigate to a profile edit flow (screens body → goal → level → days → equipment, without Welcome and Auth):

```typescript
import { useRouter } from 'next/navigation';

// In the settings JSX, add a new section:
<section style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
  <h3 style={{ ...typography.label, color: colors.textMuted, margin: 0 }}>PROFIL</h3>

  <button
    onClick={() => router.push('/onboarding/body?edit=true')}
    style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing[4],
      border: 'none', cursor: 'pointer', width: '100%',
    }}
  >
    <span style={{ ...typography.body, color: colors.textPrimary }}>Profil bearbeiten</span>
    <ChevronRight size={16} color={colors.textMuted} />
  </button>
</section>
```

In the onboarding screens (body, goal, level, days, equipment), add handling for `?edit=true` query param:
- When `edit=true`, the "Weiter" button on the last screen (`equipment`) should navigate to `/settings` instead of `/onboarding/generating`
- Add to `app/onboarding/equipment/page.tsx`:
  ```typescript
  const searchParams = useSearchParams();
  const isEdit = searchParams.get('edit') === 'true';
  // On continue:
  router.push(isEdit ? '/settings' : '/onboarding/generating');
  ```
- Pass `?edit=true` through each screen via `router.push('/onboarding/goal?edit=true')` etc.

- [ ] **Step 2: Add "App-Tour wiederholen" section**

```typescript
import { useTourStore } from '@/store/tourStore';

const resetTour = useTourStore((s) => s.resetTour);
const startTour = useTourStore((s) => s.startTour);

// In the settings JSX, add another button:
<button
  onClick={() => {
    resetTour();
    startTour();
    router.push('/');
  }}
  style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing[4],
    border: 'none', cursor: 'pointer', width: '100%',
  }}
>
  <span style={{ ...typography.body, color: colors.textPrimary }}>App-Tour wiederholen</span>
  <ChevronRight size={16} color={colors.textMuted} />
</button>
```

- [ ] **Step 3: TypeScript check + Commit**

```bash
npx tsc --noEmit
git add app/settings/page.tsx app/onboarding/body/page.tsx app/onboarding/goal/page.tsx app/onboarding/level/page.tsx app/onboarding/days/page.tsx app/onboarding/equipment/page.tsx
git commit -m "feat: settings — Profil bearbeiten + App-Tour wiederholen"
```

---

## Task 23: Final Build Check

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errors. Fix any remaining type errors before proceeding.

- [ ] **Step 2: Build check**

```bash
npm run build
```
Expected: successful build. Fix any Next.js build errors (missing `'use client'`, missing Suspense boundaries for `useSearchParams`, etc.).

Common issues:
- `useSearchParams()` requires a Suspense boundary — wrap the component in `<Suspense>` if needed
- SSR window access in TourOverlay — guard with `useEffect` or `typeof window !== 'undefined'`

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: onboarding rework + app tour + bugfixes — complete implementation"
```

---

## Implementation Order Summary

| Phase | Tasks | Dependency |
|-------|-------|------------|
| 1. Bugs | 1–2 | None — ship immediately |
| 2. Foundations | 3–5 | None — types + stores |
| 3. Navigation | 6 | Task 5 (tourStore) |
| 4. Onboarding | 7–18 | Tasks 3–6 |
| 5. Tour UI | 19–21 | Tasks 3–5 |
| 6. Settings | 22 | Tasks 4, 5, 19 |
| 7. Final check | 23 | All above |

**Tasks 1–2 can be implemented and committed independently** before any other work.
**Tasks 3–5 can be implemented in parallel** (no dependencies between them).
