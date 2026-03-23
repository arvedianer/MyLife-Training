# Design Spec: Onboarding Rework + App Tour + Bugfixes
**Datum:** 2026-03-22
**Status:** Approved
**Scope:** Auth-First Onboarding Rework, Guided App Tour, Forum Chat Bugfix, Start-Tab Restday Bugfix, Settings-Integration

---

## Teil 1: Bugs

### Bug 1: Forum Chat — Schwarzer Screen

**Symptom:** Öffnen von General Chat oder DM aus Community → App wird komplett schwarz, keine Fehlermeldung, Seite muss neu geladen werden.

**Ursache:** `app/(tabs)/forum/[channelId]/page.tsx` crasht mit unbehandeltem Fehler wenn:
- Supabase Channel-Daten nicht geladen (RLS-Policy blockiert oder Race Condition)
- `channelMeta` null ist während ein Render-Zyklus läuft
- DM-Erstellung aus Community (`ProfileSheet → createDMChannel → router.push`) schlägt fehl oder Channel-Page rendert bevor Daten da

**Fix:**
1. Error-Boundary-Komponente um die gesamte Chat-Page
2. Supabase RLS-Policies für `channels` und `messages` prüfen — sicherstellen dass authentifizierte User eigene Channels + Messages lesen können
3. Robustes Loading-State: wenn `channelMeta` null → Lade-Screen statt Crash
4. `createDMChannel` aus `ProfileSheet` mit try-catch + Fehler-Toast statt silent fail

**Betroffene Dateien:**
- `app/(tabs)/forum/[channelId]/page.tsx`
- `components/forum/ProfileSheet.tsx`
- `lib/forum.ts`
- Supabase RLS Policies (via MCP)

---

### Bug 2: Start-Tab immer Restday

**Symptom:** Start-Tab zeigt immer Restday unabhängig vom echten Wochentag.

**Ursache:** `getTodaysSplitDay()` in `store/planStore.ts` berechnet den aktuellen Trainingstag falsch — wahrscheinlich Wochentag-Index off-by-one oder Timezone-Problem.

**Fix:** `getTodaysSplitDay()` debuggen — Wochentag (0=Sonntag in JS) gegen die geplanten Trainingstage des aktiven Splits matchen. Sicherstellen dass Restday nur returned wenn der Tag tatsächlich kein Trainingstag ist.

**Betroffene Dateien:**
- `store/planStore.ts`
- `app/(tabs)/start/page.tsx`

---

### Bug 3: Link teilen → landet auf Name-Prompt

**Symptom:** Neuer User öffnet geteilten Link → landet auf `/onboarding/name` ohne Account.

**Analyse:** Root-Page (`app/page.tsx`) checkt Supabase-Session korrekt und leitet zu `/auth/login`. Aber `useOnboardingGuard` in `(tabs)/layout.tsx` leitet zu `/onboarding/name` wenn `onboardingCompleted = false`. Nach Auth ist `onboardingCompleted` korrekt false → Onboarding startet. Das ist eigentlich richtig — aber der Welcome-Screen muss klar machen dass ein Account existiert. Kein eigenständiger Fix nötig — wird durch Onboarding-Rework behoben (Auth kommt vor Onboarding).

---

## Teil 2: Onboarding Rework

### Konzept

Auth-First: User erstellt zuerst einen Account, dann folgt das Onboarding. Arved spricht in erster Person, direkte lockere Sprache. Keine Formular-Ästhetik — Einzelfragen mit klarem Fokus. Drei Zwischenscreens geben dem User personalisiertes Feedback basierend auf bereits gegebenen Antworten.

### Neuer Flow (11 Screens)

#### Screen 0 — Auth
**Route:** `/auth/login` + `/auth/signup` *(existiert, kein Rework)*
Signup: E-Mail + Passwort. Nach Signup → `onboardingCompleted = false` → Onboarding.

---

#### Screen 1 — Welcome
**Route:** `/onboarding/welcome` *(neu)*
**Kein Input.**

> **"Hey. Ich bin Arved.**
> Ich hab diese App gebaut weil alle anderen Geld kosten und keine davon wirklich optimal funktioniert.
> 2 Minuten — dann steht dein Plan."

CTA-Button: `Los geht's →`

Progress-Dots: nicht sichtbar (noch nicht gestartet)

---

#### Screen 2 — Name
**Route:** `/onboarding/name` *(existiert, rework)*

> *"Wie soll ich dich nennen?"*

- Text-Input, autofokus, Keyboard sofort offen
- Subtext klein: *"Damit ich dich nicht die ganze Zeit 'du' nenne."*
- Weiter-Button disabled bis min. 2 Zeichen

Speichert: `userStore.profile.name`

---

#### Screen 3 — Körperdaten
**Route:** `/onboarding/body` *(existiert oder neu)*

> *"Und ein paar Zahlen, [Name]."*

Drei Inputs auf einem Screen:
- **Alter** — Zahl-Input (Keyboard numeric), Range 13–70
- **Gewicht** — Zahl-Input mit Toggle kg / lbs
- **Größe** — Zahl-Input mit Toggle cm / ft

Subtext: *"Für realistische Gewichtsvorschläge und Leistungsvergleiche."*
Alle Felder optional überspringbar (aber empfohlen).

Speichert: `userStore.profile.age`, `userStore.profile.bodyWeight`, `userStore.profile.height`

---

#### 🔵 Zwischenscreen A — Daten-Confirmation
**Route:** `/onboarding/confirm-body` *(neu)*
**Kein Input. Auto-Advance nach 2,5s oder Tap.**

> **"[Name]. [Alter] J. · [Gewicht]kg · [Größe]cm."**
> *"Gute Basis. Jetzt: Was willst du?"*

Falls Felder leer: *"Alright, [Name]. Kommen wir zu deinen Zielen."*

---

#### Screen 4 — Ziel
**Route:** `/onboarding/goal` *(existiert, rework)*

> *"Was willst du erreichen?"*

5 Cards (große Touch-Targets, Icon + Headline + 1 Zeile Erklärung):

| Card | Icon | Subtext |
|------|------|---------|
| Kraft aufbauen | 🏋️ | Schwerer heben, Bestleistungen brechen |
| Muskeln aufbauen | 💪 | Mehr Masse, bessere Optik |
| Abnehmen | 📉 | Fett verlieren, Form halten |
| Fit bleiben | ⚡ | Energie, Gesundheit, Ausdauer |
| Alles davon | 🎯 | Rundum besser werden |

Mehrfachauswahl: max. 2. Primäres Ziel = erstes getippte.

Speichert: `userStore.profile.goal`

---

#### Screen 5 — Level
**Route:** `/onboarding/level` *(existiert, rework)*

> *"Wie lange trainierst du schon?"*

4 Cards (zeitbasiert — keine demotivierenden Labels):

| Option | Subtext |
|--------|---------|
| Gerade gestartet | Weniger als 6 Monate |
| Ich kenn mich aus | 6 Monate bis 2 Jahre |
| Ich weiß was ich tue | 2 bis 4 Jahre |
| Ich trainiere schon lang | 4+ Jahre, ich hab einen Plan |

Speichert: `userStore.profile.level` (Typ-Werte in Deutsch: `'anfaenger' | 'fortgeschritten' | 'profi' | 'experte'`)

---

#### 🔵 Zwischenscreen B — Ziel + Level Insight
**Route:** `/onboarding/plan-preview` *(neu)*
**Kein Input. Auto-Advance nach 3s oder Tap.**

Dynamischer Text basierend auf Ziel + Level Kombination:

| Ziel | Level | Text |
|------|-------|------|
| Kraft | ≥ 2 Jahre | "Progressive Overload. Schwere Grundübungen, wöchentliche Steigerung. Genau das was Leute auf deinem Level voranbringt." |
| Muskeln | < 2 Jahre | "Hypertrophie-Training. Volumen und Technik stehen im Vordergrund — das bringt dir Masse." |
| Abnehmen | Anfänger | "Metabolisches Training. Hohe Intensität, kurze Pausen, viel Volumen. Fett weg, Form bleibt." |
| Alles | beliebig | "Vollständiges Programm. Kraft, Volumen, Ausdauer — alles ausbalanciert." |
| *(Fallback)* | beliebig | "Dein Plan passt sich deinen Antworten an. Kommen wir zu den Details." |

Format:
> **"[Plan-Typ]."**
> *"[Erklärung]"*
> *"Jetzt noch wann und wo."*

---

#### Screen 6 — Trainingstage
**Route:** `/onboarding/days` *(existiert, komplett rework)*

> *"Wann kannst du trainieren?"*

Wochentage-Picker: 7 Buttons nebeneinander `Mo Di Mi Do Fr Sa So`, togglebar.

Live-Feedback direkt darunter (dynamisch):
- 2 Tage: *"2 Tage — Minimalismus. Funktioniert mit dem richtigen Plan."*
- 3 Tage: *"3 Tage — das ideale Volumen für [Ziel]."*
- 4 Tage: *"4 Tage — solid. Genug Regeneration zwischen den Einheiten."*
- 5+ Tage: *"[X] Tage — ambitioniert. Schlaf und Ernährung nicht vergessen."*

Speichert: `userStore.profile.weeklyVolume` (Anzahl) + die konkreten Wochentage für Plan-Generierung

---

#### Screen 7 — Equipment
**Route:** `/onboarding/equipment` *(existiert, rework)*

> *"Wo trainierst du?"*

3 Cards:

| Card | Subtext | `EquipmentType` Wert |
|------|---------|---------------------|
| **Fitnessstudio** | Freie Gewichte, Kabelzug, Maschinen | `'vollausgestattet'` |
| **Zuhause + Equipment** | Hanteln, Stange, Bank | `'kurzhanteln'` |
| **Nur Bodyweight** | Kein Equipment | `'eigengewicht'` |

`'minimalistisch'` entfällt als Auswahloption — Zuhause + Equipment deckt diesen Fall ab. Der Typ-Wert bleibt in `EquipmentType` erhalten (Rückwärtskompatibilität mit bestehenden Profilen), wird aber nicht mehr im Onboarding angeboten.

Speichert: `userStore.profile.equipment`

---

#### 🔵 Zwischenscreen C — Plan wird generiert
**Route:** `/onboarding/generating` *(existiert, rework)*

Animierte Checkliste:
```
✅ Körperdaten analysiert
✅ Ziel: [Ziel]
✅ [X] Trainingstage geplant
✅ Equipment: [Equipment]
⏳ Split wird berechnet...
✅ Plan steht.
```

Dauer: 2–3 Sekunden, dann auto-advance.

---

#### Screen 8 — Fertig
**Route:** `/onboarding/done` *(neu)*

> **"Dein Plan steht, [Name]."**
> *"[Split-Name] — [X] Tage pro Woche."*

CTA: `App kennenlernen →`

→ Navigiert direkt zu App Tour (setzt `tourActive = true`)

---

### Progress-Indicator

Kleine Punkte-Leiste oben auf Screens 2–7 (nicht auf Zwischenscreens, Welcome und Screen 8 `done`):
`● ● ○ ○ ○ ○` — zeigt Position, kein Prozent, keine Zahlen.

---

### Onboarding aus Settings

In `app/settings/page.tsx` neue Sektion "Profil":
- **"Profil bearbeiten"** → Öffnet Screens 3+4+5+6+7 (ohne Welcome, ohne Auth, ohne Generating) — für nachträgliche Änderung von Körperdaten, Ziel, Level, Tage, Equipment.

---

## Teil 3: App Tour

### Konzept

Nach Onboarding-Abschluss startet automatisch eine interaktive geführte Tour. Coach Arved führt durch alle Features der App. Jeder Screen wird erklärt, jede wichtige Aktion mindestens einmal selbst ausgeführt. Am Ende hat der User ein echtes Workout geloggt und wieder gelöscht.

### State: `tourStore.ts`

```typescript
interface TourState {
  tourCompleted: boolean;    // in localStorage persisted
  tourActive: boolean;
  tourStep: number;          // 0-based, max 23 (24 steps total)
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  resetTour: () => void;     // für Settings
}
```

### Komponente: `TourOverlay`

Globale Komponente in `(tabs)/layout.tsx`. Wenn `tourActive = true`:
- Semi-transparentes dunkles Overlay über der gesamten App
- **Spotlight-Effekt**: Transparentes "Loch" über dem highlighted Element (CSS `box-shadow: 0 0 0 9999px rgba(0,0,0,0.75)` oder `clip-path`)
- **Arved-Sprechblase**: Positioniert nahe dem Spotlight-Element, mit Pfeil
- **Step-Lock**: Nur das highlighted Element ist klickbar — alles andere blocked
- **"Skip" Button**: Top-Right, immer sichtbar, dezent (klein, textMuted)
- **Progress**: `Schritt X von 24` unten in der Sprechblase

### Element-Highlighting

Jeder Tour-Step definiert ein `targetSelector` (CSS-Selector oder React ref). Die TourOverlay-Komponente berechnet die `getBoundingClientRect()` des Elements und positioniert Spotlight + Sprechblase dynamisch.

### Die 24 Tour-Steps

Progress-Anzeige in der Sprechblase: `Schritt X von 24`

| Step | Tab/Route | Spotlight-Element | Arved-Text | User-Aktion |
|------|-----------|-------------------|------------|-------------|
| 1 | Dashboard | Streak-Card | "Das ist dein Dashboard. Streak, Wochenvolumen, Athlete Score — alles auf einen Blick." | Weiter |
| 2 | Dashboard | Athlete Score Card | "Der Athlete Score geht von 0 bis 1000. Fünf Dimensionen — Kraft, Konsistenz, Volumen, Ausdauer, Ausgewogenheit. Keine fake Zahl." | Weiter |
| 3 | Dashboard | Bottom Nav → Stats | "Auf Stats siehst du wie du dich langfristig entwickelst." | **User tippt Stats-Tab** |
| 4 | Stats | Heatmap | "Die Heatmap zeigt wann du trainiert hast. Grüner = mehr Volumen." | Weiter |
| 5 | Stats | Benchmarks-Section | "Die Benchmarks vergleichen deine Lifts mit Trainierenden auf deinem Level. Ehrlich." | Weiter |
| 6 | Stats | Bottom Nav → Splits | "Jetzt zu deinem Plan." | **User tippt Splits-Tab** |
| 7 | Splits | Aktiver Split Card | "Das ist dein Trainingsplan — generiert auf Basis deiner Antworten. Du kannst ihn komplett anpassen." | **User tippt auf Split** |
| 8 | Split Detail | Trainingstag-Card | "Das sind deine Trainingstage. Jeder Tag hat seine Übungen. Tippe auf einen Tag." | **User tippt auf Trainingstag** |
| 9 | Split Day | Übungs-Liste | "Hier siehst du alle Übungen für diesen Tag. Reihenfolge per Drag & Drop änderbar — halte eine Übung gedrückt." | Weiter |
| 10 | Dashboard | CoachBubble (fixer Button unten links auf Dashboard) | "Und dann noch das hier." | **TourOverlay navigiert via `router.push('/')` zum Dashboard, highlightet CoachBubble — User tippt CoachBubble** |
| 11 | Coach Arved | Suggested Questions | "Das bin ich — Coach Arved. Ich kenn deine Daten, deine PRs, deine verpassten Sessions. Frag mich was du willst." | **User tippt eine vorgeschlagene Frage** |
| 12 | Coach Arved | Chat-Antwort | "Genau so antworte ich. Direkt, ohne Filler." | Weiter |
| 13 | Coach Arved | Bottom Nav → Forum | "Und das Forum." | **User tippt Forum-Tab** |
| 14 | Forum | 3 Tabs (General/Freunde/Community) | "General Chat, Freunde, Community. Im Community-Tab siehst du live wer gerade trainiert." | Weiter |
| 15 | Forum | Bottom Nav → Start | "Okay. Jetzt das Wichtigste. Dein erstes Workout." | **User tippt Start-Tab** |
| 16 | Start | Workout-Start-Button | "Das ist dein heutiger Plan. Klick auf Training starten." | **User tippt Start** |
| 17 | Active Workout | Exercise List | "Das ist dein aktives Workout. Alle Übungen für heute. Tippe auf eine Übung." | **User tippt erste Übung** |
| 18 | Active Workout | Set-Input (Gewicht + Reps) | "Trag dein Gewicht und deine Wiederholungen ein. Der Vorschlag basiert auf deinen Angaben. Dann: Haken." | **User loggt Set** |
| 19 | Active Workout | Rest-Timer | "Der Timer startet automatisch nach jedem Satz. Du weißt immer wann du wieder loslegen kannst — oder überspringst ihn." | Weiter (Timer skip) |
| 20 | Active Workout | Zahnrad-Icon | "Das Zahnrad öffnet Optionen für jede Übung — Notizen, Gewichtsverlauf, Übung tauschen." | **User tippt Zahnrad → sieht Optionen → schließt** |
| 21 | Active Workout | Finish-Button | "Wenn du fertig bist: Training beenden." | **User tippt Finish** |
| 22 | Workout Summary | Summary Stats | "Das ist deine Zusammenfassung — Volumen, PRs, Score-Veränderung. Das bleibt gespeichert." | Weiter |
| 23 | Log / History | Erster Log-Eintrag | "Das ist dein erstes Workout in der History. Das war unser Tutorial — du kannst es löschen. Wisch nach links." | **User wischt / löscht** |
| 24 | Dashboard | Gesamte Seite | "Das war alles. Du kennst die App jetzt. Dein echter Plan startet hier." | `Los geht's 🔥` → `tourCompleted = true` |

*(Steps intern 0-basiert, extern 1-basiert angezeigt)*

### Tour-Navigation

- **Weiter-Button** in Sprechblase: nur bei Steps mit `action: 'next'`
- **Tap auf highlighted Element**: bei Steps mit `action: 'tap'` — Tour erkennt den Tap und geht zum nächsten Step
- **Auto-Navigation zwischen Tabs**: TourOverlay nutzt `router.push()` wenn ein Step einen Tab-Wechsel erfordert
- **Zurück-Button**: ab Step 2 verfügbar, geht zum vorherigen Step

### Tour aus Settings

In `app/settings/page.tsx`:
- **"App-Tour wiederholen"** → `tourStore.resetTour()` → navigiert zu `/dashboard` → `tourActive = true`

---

## Teil 4: Architektur-Entscheidungen

### Routing nach Auth

```
Neuer User:
/auth/signup → [account erstellt] → /onboarding/welcome

Bestehender User ohne Onboarding:
/auth/login → [session] → / → onboardingCompleted=false → /onboarding/welcome

Bestehender User mit Onboarding:
/auth/login → [session] → / → onboardingCompleted=true → /dashboard
```

**Wichtig:** Beide folgenden Stellen müssen von `/onboarding/name` auf `/onboarding/welcome` geändert werden:
- `hooks/useOnboardingGuard.ts` Zeile 17: `router.replace('/onboarding/name')` → `router.replace('/onboarding/welcome')`
- `app/page.tsx` Zeile 29: `router.replace('/onboarding/name')` → `router.replace('/onboarding/welcome')`

### Typen-Änderungen

**`types/workout.ts` — WorkoutGoal erweitern:**
```typescript
export type WorkoutGoal =
  | 'muskelaufbau'
  | 'kraft'
  | 'abnehmen'
  | 'fitness'
  | 'ausdauer'
  | 'alles';  // NEU
```

**`types/workout.ts` — TrainingLevel auf 4 Werte erweitern:**
```typescript
export type TrainingLevel =
  | 'anfaenger'       // < 6 Monate
  | 'fortgeschritten' // 6M – 2 Jahre
  | 'profi'           // 2–4 Jahre
  | 'experte';        // 4+ Jahre (NEU)
```

**`types/user.ts` — Neue Felder für Wochentage + sekundäres Ziel:**
```typescript
export interface UserProfile {
  // ...bestehende Felder...
  goal: WorkoutGoal;
  secondaryGoal?: WorkoutGoal | null;      // NEU: zweites Ziel (max. 2 Auswahl)
  trainingDays: TrainingDays;              // bleibt: Anzahl (2-6)
  trainingWeekdays: number[];              // NEU: [0=Mo, 1=Di, ..., 6=So] — ACHTUNG: JS Date.getDay() nutzt 0=Sonntag. Konvertierung: mylifeDay = (jsDay + 6) % 7
  // currentStep: number entfernt — kein step-counter mehr
}
```

**`store/userStore.ts` — `completeOnboarding` vereinfachen:**
```typescript
completeOnboarding: () => set({
  onboardingCompleted: true,
  currentStep: 8,  // Anzahl Input-Screens im neuen Flow (war: 5)
}),
```
`currentStep` in `OnboardingState` bleibt als interne Navigation, wird aber nicht mehr für Guards genutzt.
**Wichtig:** In `types/user.ts` den Kommentar bei `currentStep` von `// 1-5` auf `// 1-8` aktualisieren (neuer Flow hat 8 Input-Screens).

### userStore Erweiterungen

`UserProfile` in `types/user.ts` bereits mit `age`, `bodyWeight`, `height` — diese werden im Onboarding korrekt gesetzt:
```typescript
userStore.setProfile({
  ...profile,
  age: number | undefined,
  bodyWeight: number | undefined,  // immer in kg
  height: number | undefined,      // immer in cm
  trainingWeekdays: number[],      // NEU: konkrete Wochentage
  secondaryGoal: WorkoutGoal | null, // NEU
})
```

### Coach Arved — Zugriff in der App

Coach Arved Chat liegt unter `/chat` (`app/(tabs)/chat/page.tsx`). Er ist **nicht in der BottomNav** — Zugriff über:
- `CoachBubble`-Komponente auf dem Dashboard (fixer Button unten links)
- Direktlink auf der Dashboard-Seite (`href="/chat"`)

**Tour Steps 11–13** (Coach Arved) navigieren via `router.push('/chat')` — kein Tab-Tap, sondern direkte Navigation. Der TourOverlay highlightet die CoachBubble auf dem Dashboard und navigiert dann zur Chat-Seite.

### tourStore Persistenz

`tourStore.ts` mit Zustand + `persist` Middleware — **nutzt `zustandStorage` aus `@/utils/storage`** (identisch zu userStore, nicht bare localStorage). `tourCompleted` und `tourStep` überleben Page-Refresh.

---

## Implementierungs-Reihenfolge

1. **Bugs zuerst** (blockieren echte Nutzung):
   - Forum Chat Error-Boundary + RLS-Fix
   - Start-Tab Restday-Bug

2. **Auth + Onboarding Rework** (Basis für alles andere)

3. **tourStore + TourOverlay Basis** (State + Overlay-Komponente ohne Steps)

4. **Tour Steps** (alle 24 Steps implementieren)

5. **Settings Integration** (Profil bearbeiten + Tour wiederholen)

---

## Was NICHT in diesem Plan ist

| Feature | Warum |
|---------|-------|
| Monetarisierung / MyLife Plus | Später |
| Stats Ausdauer-Score Rework | Sub-Projekt 2 |
| Übungen Tab in Splits | Sub-Projekt 2 |
| Coach Arved Suggestions Rework | Sub-Projekt 2 |
| Apple App Store | Zukunft |
| Marketing Website | Separates Projekt (eigener Ordner) |
