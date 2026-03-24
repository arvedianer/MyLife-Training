# MY LIFE — Training App

## CLAUDE.md · Master Instructions für Claude Code

---

## 0. ÜBER DIESES PROJEKT

**MY LIFE Training App** ist eine Fitness-Tracking App als Teil des größeren "My Life" Ökosystems (Training + Kalorien + Life Improvement). Diese Repo ist ausschließlich die **Training App**.

- **Plattform:** Next.js 14 (App Router) als Web-PWA — läuft im Browser, installierbar auf Mobile
- **Sprache:** TypeScript (strict mode, keine any-Types)
- **Backend:** Supabase (Auth, PostgreSQL, Row Level Security)
- **Status:** MVP vollständig — alle Core-Features implementiert
- **Deployment:** Vercel (`vercel.json` vorhanden)

**WICHTIG:** Bevor du irgendetwas baust, lies dieses Dokument komplett. Jede Entscheidung hier ist bewusst getroffen und dokumentiert.

---

## 1. TECH STACK

```
Next.js 14             — Web-App mit App Router (file-based routing)
TypeScript 5+          — Strict Mode, keine any
Supabase               — Auth, PostgreSQL DB, Row Level Security
Zustand                — Global State Management (kein Redux)
  └─ persist           — localStorage-Persistenz (offline-first)
React Query (TanStack) — Server State, Caching (QueryProvider)
Zod                    — Schema Validation
React Hook Form        — Form Handling
date-fns               — Datum-Operationen (kein moment.js)
Recharts               — Charts & Graphen (Web-optimiert)
Framer Motion          — Animationen
lucide-react           — Icons (konsistentes Line-Style)
@supabase/supabase-js  — Supabase Client v2
```

**PWA-Stack:**
- `public/manifest.json` — App-Manifest (Name, Icons, Theme)
- `public/sw.js` — Service Worker (Stale-while-revalidate, Offline-Fallback)
- `components/PWACheck.tsx` — SW-Registrierung

**Nicht verwenden:**

- ❌ Redux / Redux Toolkit (zu komplex)
- ❌ Moment.js (deprecated, zu groß)
- ❌ Victory Native / Reanimated (React Native — wir sind Web)
- ❌ Hardcoded Farben oder Abstände (immer Design Tokens)
- ❌ any TypeScript Typ

---

## 2. PROJEKTSTRUKTUR

```
my-life-training/
├── app/                          # Expo Router — jede Datei = ein Screen
│   ├── (onboarding)/             # Onboarding Flow (einmalig)
│   │   ├── goal.tsx              # Screen 01 — Ziel auswählen
│   │   ├── level.tsx             # Screen 02 — Erfahrungslevel
│   │   ├── days.tsx              # Screen 03 — Trainingstage
│   │   ├── equipment.tsx         # Screen 04 — Equipment
│   │   └── generating.tsx        # Screen 05 — Plan generieren
│   ├── (tabs)/                   # Haupt-App mit Bottom Navigation
│   │   ├── index.tsx             # Tab: Home (Dashboard)
│   │   ├── log.tsx               # Tab: Log (Trainingshistorie)
│   │   ├── start.tsx             # Tab: Start (Center Button)
│   │   ├── stats.tsx             # Tab: Stats
│   │   └── splits.tsx            # Tab: Splits & Wissenschaft
│   ├── workout/
│   │   ├── active.tsx            # Aktives Workout (Screen 11)
│   │   ├── add-exercise.tsx      # Übung suchen/hinzufügen (Screen 12)
│   │   └── summary.tsx           # Workout Zusammenfassung (Screen 13)
│   ├── log/
│   │   └── [sessionId].tsx       # Session Detail (Screen 09)
│   ├── stats/
│   │   └── exercise/[id].tsx     # Übungs-Detail (Screen 15)
│   ├── splits/
│   │   ├── [splitName].tsx       # Split Detail (Screen 18)
│   │   └── edit.tsx              # Plan bearbeiten (Screen 19)
│   ├── settings.tsx              # Einstellungen (Screen 22)
│   └── _layout.tsx               # Root Layout
├── components/
│   ├── ui/                       # Basis-Komponenten (Button, Card, Badge...)
│   ├── workout/                  # Workout-spezifische Komponenten
│   └── overlays/                 # Modals, Timer, PR-Overlay
├── store/
│   ├── userStore.ts              # User-Profil, Onboarding-Status
│   ├── workoutStore.ts           # Aktives Workout State
│   ├── historyStore.ts           # Trainingshistorie
│   └── planStore.ts              # Trainingsplan & Splits
├── hooks/
│   ├── useWorkout.ts             # Workout-Logik
│   ├── useOverload.ts            # Progressive Overload Berechnung
│   ├── useTimer.ts               # Rest Timer
│   └── useStats.ts               # Statistik-Berechnungen
├── utils/
│   ├── overload.ts               # Overload-Algorithmus
│   ├── splits.ts                 # Split-Generierung & Logik
│   ├── dates.ts                  # Datum-Helpers
│   └── storage.ts                # MMKV Storage Adapter
├── constants/
│   ├── tokens.ts                 # Design Tokens (Farben, Spacing, Radius)
│   ├── exercises.ts              # Übungsdatenbank (60+ Übungen)
│   └── splits.ts                 # Split-Definitionen (Arnold, PPL etc.)
├── types/
│   ├── workout.ts                # TypeScript Types für Workouts
│   ├── user.ts                   # User & Profil Types
│   └── exercises.ts              # Übungs-Types
└── CLAUDE.md                     # Diese Datei
```

---

## 3. DESIGN SYSTEM — TOKENS

**KRITISCH: Niemals Farben oder Abstände hardcoden. Immer Tokens aus `constants/tokens.ts` verwenden.**

### Farben (Dark Mode — Standard)

```typescript
// constants/tokens.ts
export const colors = {
  // Hintergründe
  bgPrimary:   '#080808',   // App-Hintergrund
  bgSecondary: '#0E0E0E',   // Sections
  bgCard:      '#161616',   // Cards
  bgElevated:  '#1E1E1E',   // Hover-States
  bgHighest:   '#262626',   // Inputs, Tags

  // Text
  textPrimary:   '#FFFFFF',   // Headlines, wichtiger Text
  textSecondary: '#F5F5F5',   // Normaler Text
  textMuted:     '#AAAAAA',   // Subtexte
  textDisabled:  '#888888',   // Deaktiviert
  textFaint:     '#555555',   // Decorative

  // Akzent
  accent:      '#4DFFED',   // Primärer Akzent (Cyan)
  accentDark:  '#00CCC0',   // Hover-State
  accentBg:    '#0A1F1A',   // Heller Akzent-Hintergrund

  // Status
  danger:      '#FF3B30',   // Fehler, Löschen
  dangerBg:    '#1F0A0A',
  success:     '#34C759',   // PR, Streak, Erfolg
  successBg:   '#0A1A0A',

  // Linien
  border:      '#262626',   // Standard Border
  borderLight: '#1E1E1E',   // Subtile Trennflächen
} as const;
```

### Typografie

```typescript
export const typography = {
  // Barlow Condensed — Headlines
  displayXL: { fontFamily: 'BarlowCondensed_800ExtraBold', fontSize: 64, lineHeight: 60 },
  display:   { fontFamily: 'BarlowCondensed_700Bold',      fontSize: 48, lineHeight: 46 },
  h1:        { fontFamily: 'BarlowCondensed_700Bold',      fontSize: 36, lineHeight: 34 },
  h2:        { fontFamily: 'BarlowCondensed_700Bold',      fontSize: 28, lineHeight: 28 },
  h3:        { fontFamily: 'BarlowCondensed_600SemiBold',  fontSize: 22, lineHeight: 22 },

  // Manrope — Body Text
  bodyLg:  { fontFamily: 'Manrope_500Medium',  fontSize: 16, lineHeight: 24 },
  body:    { fontFamily: 'Manrope_400Regular', fontSize: 14, lineHeight: 21 },
  bodySm:  { fontFamily: 'Manrope_400Regular', fontSize: 12, lineHeight: 18 },
  label:   { fontFamily: 'Manrope_700Bold',    fontSize: 11, lineHeight: 16 },

  // Courier Prime / Mono — Zahlen & Stats
  monoLg:  { fontFamily: 'CourierPrime_600SemiBold', fontSize: 24, lineHeight: 28 },
  mono:    { fontFamily: 'CourierPrime_600SemiBold', fontSize: 14, lineHeight: 20 },
  monoSm:  { fontFamily: 'CourierPrime_400Regular',  fontSize: 11, lineHeight: 16 },
} as const;
```

---

## 4. KOMPONENTEN-REGELN

### Basis-Struktur einer Komponente

```typescript
// ✅ RICHTIG — so sieht jede Komponente aus
import { View, Text, Pressable } from 'react-native';
import { colors, spacing, radius, typography } from '@/constants/tokens';

interface CardProps {
  title: string;
  onPress?: () => void;
}

export function Card({ title, onPress }: CardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.bgElevated : colors.bgCard,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        padding: spacing[4],
      })}
    >
      <Text style={[typography.h3, { color: colors.textPrimary }]}>
        {title}
      </Text>
    </Pressable>
  );
}
```

### Icons

- **Immer:** `lucide-react-native` (konsistentes Line-Style, 1.8px stroke)
- **Größen:** 16 (klein), 20 (standard), 24 (groß)
- **Farbe:** immer aus `colors.*`, nie hardcoded
- **Keine Emojis als UI-Elemente**

---

## 5. STATE MANAGEMENT

| State-Typ                       | Lösung                   |
|---------------------------------|--------------------------|
| Lokaler UI-State (Modal offen?) | `useState`               |
| Screen-übergreifender App-State | Zustand Store            |
| Server/API-Daten                | React Query              |
| Formulare                       | React Hook Form + Zod    |
| Persistenter Storage            | MMKV via Zustand persist |

---

## 6. CODING-STANDARDS

### Allgemein

- **Sprache im Code:** Englisch (Variablen, Kommentare, Types)
- **Sprache in der UI:** Deutsch (alle Texte die der User sieht)
- **Komponenten:** funktional, keine Class Components
- **Exports:** named exports (kein `export default` außer in `app/` für Expo Router)
- **Imports:** absolute Pfade mit `@/` Alias (z.B. `@/components/ui/Button`)

### Datei-Benennung

```
components/     PascalCase    → WorkoutCard.tsx
hooks/          camelCase     → useWorkout.ts
utils/          camelCase     → overload.ts
store/          camelCase     → workoutStore.ts
types/          camelCase     → workout.ts
constants/      camelCase     → tokens.ts
app/ screens    kebab-case    → add-exercise.tsx
```

### Do's & Don'ts

```typescript
// ✅ DO
const weight = 82.5; // immer number, nie string für Gewichte
const sets: SetEntry[] = [];
import { colors } from '@/constants/tokens';

// ❌ DON'T
const weight = "82.5kg"; // nie string
const sets: any[] = []; // niemals any
backgroundColor: '#161616' // nie hardcoded Farben
```

---

## 7. ANIMATIONEN (Framer Motion)

```typescript
import { motion } from 'framer-motion';

// Standard Screen Fade-In
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  {children}
</motion.div>
```

---

## 8. MVP SCOPE — WAS JETZT GEBAUT WIRD

**In Scope (MVP):**

- ✅ Onboarding (Screens 01–05)
- ✅ Dashboard (Screen 06)
- ✅ Trainingshistorie (Screen 08)
- ✅ Session Detail (Screen 09)
- ✅ Workout starten (Screen 10)
- ✅ Aktives Workout (Screen 11) ← Herzstück
- ✅ Übung suchen (Screen 12)
- ✅ Workout Zusammenfassung (Screen 13)
- ✅ Stats Übersicht (Screen 14)
- ✅ Übungs-Detail (Screen 15)
- ✅ Splits Übersicht (Screen 17)
- ✅ Split Detail (Screen 18)
- ✅ Plan bearbeiten (Screen 19)
- ✅ Rest Timer Overlay (Screen 20)
- ✅ PR Moment Overlay (Screen 21)
- ✅ Einstellungen (Screen 22)

**Out of Scope (V2/V3 — nicht anfassen):**

- ❌ Muskelgruppen Heatmap
- ❌ Profil Screen
- ❌ Account-Verknüpfung mit My Life App
- ❌ Supersets
- ❌ Video-Demos
- ❌ KI-Chat

---

## 9. HÄUFIGE BEFEHLE

```bash
# Dev starten
npm run dev

# TypeScript Check
npx tsc --noEmit

# Build
npm run build

# Production starten
npm run start
```

---

## 10. WENN DU EINEN NEUEN SCREEN BAUST

Checkliste für jeden neuen Screen:

1. **Datei anlegen** im richtigen `app/` Ordner
2. **Design Tokens** — keine hardcoded Werte
3. **TypeScript** — alle Props und State-Typen definieren
4. **Navigation** — `next/link` oder `useRouter()` aus `next/navigation`
5. **Dark Mode** — funktioniert automatisch durch Token-System
6. **Loading States** — immer berücksichtigen
7. **Empty States** — was passiert wenn keine Daten da sind?
8. **Animationen** — Framer Motion für Übergänge
9. **Icons** — nur `lucide-react`, keine Emojis als UI-Elemente
10. **Deutsche UI-Texte** — alle User-sichtbaren Strings auf Deutsch

---

---

## 11. NEUE UTILITIES (März 2026)

Diese Utilities existieren — vor Neubau prüfen ob sie passen:

| Datei | Funktion | Rückgabe |
|-------|----------|----------|
| `utils/athleteScore.ts` | `computeAthleteScore(sessions, bodyWeight)` | `AthleteScoreResult` (total 0–1000, 5 Dimensionen) |
| `utils/athleteScore.ts` | `athleteScoreLabel(score)` | Tier-String: Einsteiger → Legende |
| `utils/strengthStandards.ts` | `computeStrengthPercentiles(ormMap, bodyWeight)` | Percentile 0–99 für 4 Hauptübungen |
| `utils/oneRepMax.ts` | `estimateOneRepMax(weight, reps)` | Epley-Formel, nur reps 1–10, sonst `null` |
| `utils/muscleRecovery.ts` | `computeMuscleRecovery(sessions)` | `MuscleRecovery[]` — hat `recoveryRatio: number` (0–1) |
| `utils/personalRecords.ts` | `computePersonalRecords(sessions)` | PRs inkl. `bestOneRepMax` |

**Exercise-IDs für Strength Standards:** `'bench-press'` · `'squat'` · `'deadlift'` · `'overhead-press'`

---

## 12. STORE-ERWEITERUNGEN (März 2026)

**`userStore`:**
- `lifetimeAthleteScore: number` — Athleten-Score, sinkt nie (`Math.max`)
- `updateLifetimeAthleteScore(score)` — persistierte Lifetime-Best-Logik

**`UserProfile`** (in `types/user.ts`):
- `age?: number` — Alter in Jahren
- `bodyWeight?: number` — Körpergewicht **immer in kg**, egal was `weightUnit` sagt

---

## 13. GOTCHAS — UNBEDINGT LESEN

Diese Fehler haben schon Zeit gekostet. Nie wieder:

- **Settings-Datei:** liegt bei `app/settings/page.tsx` — **NICHT** `app/(tabs)/settings.tsx`
- **Stale `.next` Cache:** Nach Hintergrund-Agent-Edits → `rm -rf .next` + Dev-Server neu starten, sonst RSC-Fehler
- **`eachDayOfInterval` + Lifetime-Mode:** Ohne Guard generiert das zehntausende Tage und crasht. Immer `{timeRange !== 'lifetime' && ...}` drumrum
- **`ex.exercise?.primaryMuscle` Typ:** Ist `MuscleGroup` (string union) — kein `as string | undefined` Cast nötig, TypeScript meckert sonst
- **Side-Effects nie in `useMemo`:** Store-Updates (z.B. Score persistieren) gehören in `useEffect`, nicht `useMemo` — Linter wirft sonst Fehler
- **Worktrees:** `.worktrees/` existiert bereits und ist gitignored — direkt per `git worktree add .worktrees/<name> -b <branch>` nutzbar
- **Stats-Page `Period` → `TimeRange`:** Der alte 4-Tab Selektor (`thisWeek/lastWeek/thisMonth/lastMonth`) wurde durch einen 3-Button Toggle (`week/month/lifetime`) ersetzt. `getPeriodRange` gibt jetzt `{ start, end, sessions }` zurück — nicht mehr nur `{ start, end }`

---

## 14. STATS-SEITE ARCHITEKTUR (nach Rework März 2026)

Reihenfolge der Sections in `app/(tabs)/stats/page.tsx`:

```
TimeRange Toggle (Woche / Monat / Lebenszeit)
  ↓
Heatmap (reagiert auf Toggle)
  ↓
Fehlende Muskelgruppen
  ↓
Muskel-Erholung (Progress-Bar-Grid, status-basiert)
  ↓
Athleten-Score (0–1000, Lifetime-Rekord, Tier-Label)
  ↓
5 Dimensionen (2×2+1 Grid: Stärke/Konsistenz/Volumen/Ausdauer/Ausgewogenheit)
  ↓
Benchmarks (ExRx Percentile + Frequenz-Vergleich)
  ↓
Lebenszeit-Zahlen (nur in Lifetime-Mode: Tonnen/Sessions/Stunden + Eiffelturm-Fun-Fact)
  ↓
3 Key Metrics (Einheiten / Volumen / Ø Dauer)
  ↓
Trainingskalender (nur in Week/Month-Mode)
  ↓
Volumen-Chart
```

---

*Letzte Aktualisierung: März 2026 · Version 1.2*
*Stack: Next.js 14 + Supabase + Zustand + Recharts + Framer Motion*
