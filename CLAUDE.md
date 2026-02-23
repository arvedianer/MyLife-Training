# MY LIFE — Training App

## CLAUDE.md · Master Instructions für Claude Code

---

## 0. ÜBER DIESES PROJEKT

**MY LIFE Training App** ist eine Fitness-Tracking App als Teil des größeren "My Life" Ökosystems (Training + Kalorien + Life Improvement). Diese Repo ist ausschließlich die **Training App**.

- **Plattform:** React Native mit Expo (iOS + Android aus einer Codebase)
- **Sprache:** TypeScript (strict mode, keine any-Types)
- **Status:** Aufbauphase — wir folgen dem geplanten Feature-Set (MVP first)
- **Planung:** Feature Map, Design System, App-Struktur und User Flows sind vollständig dokumentiert

**WICHTIG:** Bevor du irgendetwas baust, lies dieses Dokument komplett. Jede Entscheidung hier ist bewusst getroffen und dokumentiert.

---

## 1. TECH STACK

```
React Native 0.73+     — Cross-Platform Mobile
Expo SDK 50+           — Build-System, OTA Updates, native APIs
TypeScript 5+          — Strict Mode, keine any
Expo Router v3         — File-based Navigation (wie Next.js, aber für RN)
Zustand                — Global State Management (leichtgewichtig, kein Redux)
MMKV                   — Lokaler Storage (schneller als AsyncStorage)
React Query (TanStack) — Server State, Caching, Background Refetch
Zod                    — Schema Validation (Forms, API Responses)
React Hook Form        — Form Handling
date-fns               — Datum-Operationen (kein moment.js)
Victory Native XL      — Charts & Graphen (optimiert für React Native)
Reanimated 3           — Animationen (60fps, läuft auf UI Thread)
Gesture Handler        — Touch & Swipe Interaktionen
Haptics (Expo)         — Vibrations-Feedback
```

**Nicht verwenden:**

- ❌ Redux / Redux Toolkit (zu komplex für dieses Projekt)
- ❌ Moment.js (deprecated, zu groß)
- ❌ Animated API (veraltet — nur Reanimated 3)
- ❌ StyleSheet.create mit hardcoded Werten (immer Design Tokens nutzen)
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

## 7. ANIMATIONEN (Reanimated 3)

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

// Standard Screen Fade-In
const opacity = useSharedValue(0);
const translateY = useSharedValue(10);

useEffect(() => {
  opacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) });
  translateY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) });
}, []);
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

- ❌ Muskelgruppen Heatmap (Screen 16)
- ❌ Profil Screen (Screen 23)
- ❌ Backend / Cloud Sync
- ❌ Account-Verknüpfung mit My Life App
- ❌ Supersets
- ❌ Video-Demos
- ❌ Community Features
- ❌ KI-Chat

---

## 9. HÄUFIGE BEFEHLE

```bash
# Dev starten
npx expo start

# iOS Simulator
npx expo run:ios

# Android Emulator
npx expo run:android

# TypeScript Check
npx tsc --noEmit

# Lint
npx eslint . --ext .ts,.tsx

# Tests
npx jest
```

---

## 10. WENN DU EINEN NEUEN SCREEN BAUST

Checkliste für jeden neuen Screen:

1. **Datei anlegen** im richtigen `app/` Ordner
2. **Design Tokens** — keine hardcoded Werte
3. **TypeScript** — alle Props und State-Typen definieren
4. **Navigation** — korrekte Expo Router Links
5. **Dark Mode** — funktioniert automatisch durch Token-System
6. **Loading States** — immer berücksichtigen
7. **Empty States** — was passiert wenn keine Daten da sind?
8. **Animationen** — Screen Fade-In standardmäßig einbauen
9. **Haptics** — bei wichtigen Aktionen (Set abhaken, PR, etc.)
10. **Deutsche UI-Texte** — alle User-sichtbaren Strings auf Deutsch

---

*Letzte Aktualisierung: Feb 2026 · Version 1.0*
*Erstellt auf Basis von: Feature Map v1.0 · Design System v1.0 · App-Struktur v1.0 · User Flows v1.0*
