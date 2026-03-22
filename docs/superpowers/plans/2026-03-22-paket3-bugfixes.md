# Paket 3 — Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vier unabhängige Bug Fixes: "Legs"-Label groß, Body-Stats im Onboarding, Streak-Popup Overhaul, Coach Arved API Key in Vercel.

**Architecture:** Alle Tasks unabhängig, berühren verschiedene Dateien. Kein neues State-System nötig. Streak-Popup nutzt `localStorage` für Once-per-day-Check. Onboarding fügt eine neue Seite zwischen Name und Goal ein.

**Tech Stack:** Next.js 14, TypeScript strict, Zustand, date-fns, Vercel CLI

---

## Task 1: "Legs" Label großschreiben

**Files:**
- Modify: `utils/muscleCoverage.ts`

**Problem:** `MAJOR_MUSCLES` in `muscleRecovery.ts` enthält `'legs'`, aber `MUSCLE_LABELS_DE` hat keinen `legs`-Eintrag → fällt auf den raw string `'legs'` (lowercase) zurück.

- [ ] **Step 1: legs-Eintrag hinzufügen**

In `utils/muscleCoverage.ts`, in `MUSCLE_LABELS_DE` nach `core: 'Core'` hinzufügen:

```typescript
export const MUSCLE_LABELS_DE: Record<string, string> = {
  chest: 'Brust',
  back: 'Rücken',
  shoulders: 'Schultern',
  biceps: 'Bizeps',
  triceps: 'Trizeps',
  quads: 'Beinvorderseite',
  hamstrings: 'Hamstrings',
  glutes: 'Gesäß',
  calves: 'Waden',
  core: 'Core',
  legs: 'Legs',   // ← NEU
};
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add utils/muscleCoverage.ts
git commit -m "fix: muscle recovery — 'legs' label capitalized via MUSCLE_LABELS_DE entry"
```

---

## Task 2: Body-Stats im Onboarding (Gewicht, Größe, Alter)

**Files:**
- Modify: `types/user.ts` — `height?: number` hinzufügen
- Create: `app/onboarding/body/page.tsx` — neue Onboarding-Seite
- Modify: `app/onboarding/name/page.tsx` — Route nach body statt goal
- Modify: `app/onboarding/goal/page.tsx` — Schritt-Label von 2/6 → 3/7

**Problem:** Onboarding fragt nicht nach Körpergröße, Gewicht und Alter. Body weight und age sind bereits im UserProfile-Typ, height fehlt noch.

**Neue Onboarding-Reihenfolge:** name → body → goal → level → days → equipment → generating (7 Schritte)

- [ ] **Step 1: height zu UserProfile hinzufügen**

In `types/user.ts`:

```typescript
export interface UserProfile {
  name?: string;
  goal: WorkoutGoal;
  level: TrainingLevel;
  trainingDays: TrainingDays;
  equipment: EquipmentType;
  weightUnit: 'kg' | 'lbs';
  createdAt: number;
  age?: number;
  bodyWeight?: number;
  height?: number;      // ← NEU: cm
}
```

- [ ] **Step 2: Neue Onboarding-Seite anlegen**

Erstelle `app/onboarding/body/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useUserStore } from '@/store/userStore';

export default function BodyPage() {
  const router = useRouter();
  const { profile } = useUserStore();

  const [age, setAge]         = useState(profile?.age ? String(profile.age) : '');
  const [weight, setWeight]   = useState(profile?.bodyWeight ? String(profile.bodyWeight) : '');
  const [height, setHeight]   = useState(profile?.height ? String(profile.height) : '');

  const handleContinue = () => {
    useUserStore.setState((s) => ({
      profile: {
        ...s.profile,
        age:        age.trim()    ? Number(age)    : undefined,
        bodyWeight: weight.trim() ? Number(weight) : undefined,
        height:     height.trim() ? Number(height) : undefined,
      } as typeof s.profile,
      onboardingStep: 3,
    }));
    router.push('/onboarding/goal');
  };

  const handleSkip = () => {
    useUserStore.setState({ onboardingStep: 3 });
    router.push('/onboarding/goal');
  };

  const inputStyle = (filled: boolean): React.CSSProperties => ({
    width: '100%',
    padding: `${spacing[4]} ${spacing[5]}`,
    backgroundColor: colors.bgCard,
    border: `1px solid ${filled ? colors.accent : colors.border}`,
    borderRadius: radius.lg,
    ...typography.bodyLg,
    color: colors.textPrimary,
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box' as const,
  });

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      padding: spacing[6],
      paddingTop: `calc(${spacing[10]} + env(safe-area-inset-top))`,
      gap: spacing[6],
    }}>
      {/* Progress */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
        <span style={{ ...typography.label, color: colors.textMuted }}>SCHRITT 2 VON 7</span>
        <ProgressBar progress={2 / 7} />
      </div>

      {/* Heading */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
        <h1 style={{ ...typography.h1, color: colors.textPrimary }}>Deine Körperdaten</h1>
        <p style={{ ...typography.body, color: colors.textMuted }}>
          Für präzisere Benchmarks und Stärke-Berechnungen. Alle Felder optional.
        </p>
      </div>

      {/* Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
        <div>
          <label style={{ ...typography.label, color: colors.textMuted, display: 'block', marginBottom: spacing[2] }}>
            ALTER (Jahre)
          </label>
          <input
            type="number"
            placeholder="z.B. 22"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min={10}
            max={120}
            step={1}
            style={inputStyle(!!age.trim())}
          />
        </div>
        <div>
          <label style={{ ...typography.label, color: colors.textMuted, display: 'block', marginBottom: spacing[2] }}>
            KÖRPERGEWICHT (kg)
          </label>
          <input
            type="number"
            placeholder="z.B. 78"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            min={30}
            max={300}
            step={0.5}
            style={inputStyle(!!weight.trim())}
          />
        </div>
        <div>
          <label style={{ ...typography.label, color: colors.textMuted, display: 'block', marginBottom: spacing[2] }}>
            KÖRPERGRÖSSE (cm)
          </label>
          <input
            type="number"
            placeholder="z.B. 180"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            min={100}
            max={250}
            step={1}
            style={inputStyle(!!height.trim())}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
        <button
          onClick={handleSkip}
          style={{
            ...typography.body, color: colors.textMuted,
            background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center',
          }}
        >
          Überspringen
        </button>
        <Button fullWidth size="lg" onClick={handleContinue}>
          Weiter
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: name/page.tsx → route nach /onboarding/body**

In `app/onboarding/name/page.tsx`, ändere beide Stellen wo `router.push('/onboarding/goal')` steht zu `router.push('/onboarding/body')`. Und passe `onboardingStep: 2` zu `onboardingStep: 2` (bleibt gleich — Name ist immer noch Schritt 2 intern).

Auch das Schritt-Label ändern von `SCHRITT 1 VON 6` zu `SCHRITT 1 VON 7` und `progress={1 / 6}` zu `progress={1 / 7}`.

- [ ] **Step 4: Schritt-Labels in den restlichen Onboarding-Seiten aktualisieren**

Passe in allen folgenden Seiten die Schritt-Zahl und den Progress-Wert an:

| Seite | Vorher | Nachher |
|-------|--------|---------|
| `app/onboarding/goal/page.tsx` | `2 VON 6` · `2/6` | `3 VON 7` · `3/7` |
| `app/onboarding/level/page.tsx` | `3 VON 6` · `3/6` | `4 VON 7` · `4/7` |
| `app/onboarding/days/page.tsx` | `4 VON 6` · `4/6` | `5 VON 7` · `5/7` |
| `app/onboarding/equipment/page.tsx` | `5 VON 6` · `5/6` | `6 VON 7` · `6/7` |
| `app/onboarding/generating/page.tsx` | `6 VON 6` · `6/6` | `7 VON 7` · `7/7` |

**Wichtig:** Lies jede Seite zuerst, um die genauen Zeilen zu finden. Ändere NUR die Label-Strings und Progress-Werte, nichts anderes.

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add types/user.ts app/onboarding/body/page.tsx app/onboarding/name/page.tsx \
  app/onboarding/goal/page.tsx app/onboarding/level/page.tsx \
  app/onboarding/days/page.tsx app/onboarding/equipment/page.tsx \
  app/onboarding/generating/page.tsx
git commit -m "feat: onboarding body stats — Alter, Gewicht, Größe als neuer Schritt 2"
```

---

## Task 3: Streak-Popup Overhaul

**Files:**
- Modify: `app/(tabs)/dashboard/page.tsx`

**Probleme:**
1. Popup erscheint bei jedem Dashboard-Besuch (sollte max. einmal täglich)
2. Nach 1 verpasstem Training → kein Popup, stattdessen auto-Rest-Day
3. Popup ist am unteren Rand (nicht zentriert)
4. "Training starten" Button ist verwirrend → entfernen
5. Kein X-Button zum Schließen

**Logik (neu):**
- Streak-Popup erscheint NUR wenn: User hat 2+ Tage verpasst (d.h. nicht trainiert und kein Rest Day für gestern UND vorgestern)
- Bei nur 1 versäumtem Tag: still einen Rest Day für gestern eintragen
- Popup nur einmal täglich zeigen (localStorage-Key `streakWarningShown`)
- Popup hat nur einen Button: "Rest Day für heute" (trägt Rest Day ein)
- X-Button zum Schließen ohne Aktion

- [ ] **Step 1: Dashboard-Seite lesen**

Lies `app/(tabs)/dashboard/page.tsx` vollständig, um:
- Den `useEffect` für `showStreakModal` (ca. Zeile 58–66) zu finden
- Den JSX-Block `{/* Streak Warning Modal */}` (ca. Zeile 408–464) zu finden
- Den Import von `addRestDay` oder äquivalent aus `historyStore` zu prüfen (oder ob es `markRestDay` heißt)

```bash
grep -n "restDay\|addRest\|markRest\|setRestDay" store/historyStore.ts | head -10
```

- [ ] **Step 2: historyStore Rest-Day-Funktion prüfen**

Lies `store/historyStore.ts` um die korrekte Methode zum Hinzufügen eines Rest Days zu finden. Typischerweise `addRestDay(date: string)` oder `toggleRestDay(date: string)`.

- [ ] **Step 3: useEffect für Streak-Popup ersetzen**

Ersetze den bestehenden `useEffect` (der `showStreakModal` setzt) mit dieser neuen Logik:

```typescript
useEffect(() => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const dayBefore  = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

  // Once-per-day guard
  const lastShown = localStorage.getItem('streakWarningShown');
  if (lastShown === today) return;

  const trainedToday     = sessions.some(s => s.date === today);
  const trainedYesterday = sessions.some(s => s.date === yesterday);
  const restYesterday    = restDays?.includes(yesterday);
  const restToday        = restDays?.includes(today);

  // Auto-Rest-Day: 1 verpasster Tag → still Rest Day für gestern eintragen
  if (!trainedToday && !restToday && !trainedYesterday && !restYesterday && streak > 0) {
    // Prüfe ob der Tag davor auch nicht trainiert wurde → echter Streak-Bruch
    const trainedDayBefore = sessions.some(s => s.date === dayBefore);
    const restDayBefore    = restDays?.includes(dayBefore);
    if (trainedDayBefore || restDayBefore) {
      // Nur 1 Tag verpasst → auto Rest Day für gestern
      addRestDay(yesterday);   // Methode aus historyStore — Name aus Step 2 anpassen
      return; // Kein Popup
    }
    // 2+ Tage verpasst → Popup zeigen
    if (streak > 1) {
      setShowStreakModal(true);
      localStorage.setItem('streakWarningShown', today);
    }
  }
}, [sessions, restDays, streak]);
```

**Wichtig:** `addRestDay` durch die tatsächliche Methode aus Step 2 ersetzen. Lies den Store vorher.

- [ ] **Step 4: Streak-Popup JSX ersetzen**

Finde den Block `{/* Streak Warning Modal */}` und ersetze ihn vollständig:

```tsx
{/* Streak Warning Modal */}
{showStreakModal && (
  <div
    style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 16px',
    }}
    onClick={() => setShowStreakModal(false)}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: colors.bgElevated, border: `1px solid ${colors.border}`,
        borderRadius: radius['2xl'], padding: spacing[6],
        width: '100%', maxWidth: '360px', position: 'relative',
      }}
    >
      {/* X-Button */}
      <button
        onClick={() => setShowStreakModal(false)}
        style={{
          position: 'absolute', top: spacing[4], right: spacing[4],
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <X size={18} color={colors.textMuted} />
      </button>

      {/* Icon */}
      <div style={{ textAlign: 'center', marginBottom: spacing[3] }}>
        <Flame size={36} color={colors.danger} />
      </div>

      <h3 style={{
        fontFamily: 'var(--font-barlow)', fontSize: '22px', fontWeight: 700,
        color: colors.textPrimary, textAlign: 'center', marginBottom: spacing[2],
      }}>
        Streak in Gefahr!
      </h3>
      <p style={{
        ...typography.body, color: colors.textMuted,
        textAlign: 'center', marginBottom: spacing[5],
      }}>
        Du hast mehrere Tage nicht trainiert. Trag einen Rest Day ein um deinen Streak zu retten.
      </p>

      <div style={{ display: 'flex', gap: spacing[3] }}>
        <button
          onClick={() => setShowStreakModal(false)}
          style={{
            flex: 1, padding: spacing[4], borderRadius: radius.xl,
            background: colors.bgCard, border: `1px solid ${colors.border}`,
            color: colors.textMuted, fontSize: '14px', cursor: 'pointer',
            fontFamily: 'var(--font-manrope)',
          }}
        >
          Schliessen
        </button>
        <button
          onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            addRestDay(today);   // Methode aus Step 2 anpassen
            setShowStreakModal(false);
          }}
          style={{
            flex: 1, padding: spacing[4], borderRadius: radius.xl,
            background: colors.accent, border: 'none',
            color: colors.bgPrimary, fontSize: '14px', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font-manrope)',
          }}
        >
          Rest Day
        </button>
      </div>
    </div>
  </div>
)}
```

**Wichtig:** `X` und `Flame` müssen aus `lucide-react` importiert werden. Prüfe die bestehende Import-Zeile und ergänze fehlende Icons. `colors` und `radius` müssen importiert sein (sind es bereits).

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add app/(tabs)/dashboard/page.tsx
git commit -m "fix: streak popup — once-per-day, auto rest day after 1 miss, centered, no Training-starten"
```

---

## Task 4: Coach Arved — GROQ_API_KEY in Vercel

**Files:**
- Kein Code-Change nötig

**Problem:** `GROQ_API_KEY` ist lokal in `.env.local` gesetzt, aber fehlt in Vercel Production → Coach Arved funktioniert nicht (API-Fehler).

- [ ] **Step 1: API Key zu Vercel hinzufügen**

```bash
cd "D:\arved\20_Projekte\MyLife\(GeminiVersion)Training_App_MyLife"
npx vercel env add GROQ_API_KEY production
```

Wenn interaktiv nach dem Wert gefragt wird: den Key aus `.env.local` einfügen (`gsk_...`).

Alternativ nicht-interaktiv:

```bash
echo "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" | npx vercel env add GROQ_API_KEY production
```

- [ ] **Step 2: Verify**

```bash
npx vercel env ls
```

Expected: `GROQ_API_KEY` in der Liste bei Environment `Production`.

- [ ] **Step 3: Neu deployen damit Key aktiv wird**

```bash
npx vercel --prod
```

Expected: Deployment erfolgreich. Coach Arved funktioniert jetzt in Production.

- [ ] **Step 4: Commit (kein Code-Change, nur Notiz)**

```bash
git commit --allow-empty -m "fix: add GROQ_API_KEY to Vercel production — Coach Arved now works"
```

---

## Done

Alle 4 Tasks unabhängig und in beliebiger Reihenfolge ausführbar. Jeder produziert einen sauberen TypeScript-Build vor dem Commit.
