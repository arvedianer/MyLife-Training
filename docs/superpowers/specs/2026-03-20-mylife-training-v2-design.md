# MY LIFE Training App — V2 Design Spec
**Date:** 2026-03-20
**Status:** Approved
**Strategy:** Parallel Agents (Track A: Figma, Track B–E: Code)

---

## 0. Scope & Approach

Six functional areas, implemented in parallel agent tracks:

| Track | Area | Priority |
|-------|------|----------|
| A | Figma Redesign — alle Screens | Parallel zu Code |
| B | Exercise Variations System + neue Datenarchitektur | Hoch |
| C | Active Workout Screen UX Overhaul | Hoch |
| D | Workout Score Engine (deterministisch) + Summary | Hoch |
| E | Dashboard + Muscle Coverage Signal | Mittel |
| F | Splits Page Cleanup + Plan Score | Niedrig |

Social Features (Forum, Freunde, Sync-Workouts) = **V3, out of scope**.

---

## 1. Design System Updates (Einmalig, zuerst)

Vor allen Screen-Änderungen:
- Alle `border-radius` auf `radius.xl` oder `radius.full` erhöhen — nichts soll eckig sein
- Typografie-Abstände überprüfen und vereinheitlichen
- Neue Token: `colors.ghost` (`#FFFFFF20`) für verblasste Vorschlagswerte
- Remove: farbliche Highlighting wenn Reps nicht im Optimum (war hässlich, wird entfernt)

---

## 2. Active Workout Screen — Kompletter Overhaul

### 2.1 Ziel
Strong-Niveau UX: übersichtlich, nichts versteckt, nie hässlich, alles auf einen Tap erreichbar.

### 2.2 ExerciseCard — Neue Struktur

**Header Row:**
```
[≡ Drag] [Übungsname — strikethrough wenn fertig] [✓ Check] [⚙️]
         [Muskelgruppe · X Sätze · Equipment-Badge]
```

- Übungsname: **strikethrough + gedimmt** wenn alle Sätze abgehakt
- Drag-Handle (≡) links: für Drag & Drop Reordering (via @dnd-kit/core)
- ⚙️ Settings Icon rechts: öffnet Bottom Sheet (kein "Warum?"-Text mehr sichtbar)
- Move-Up/Down Buttons **entfernen** → ersetzt durch Drag & Drop

**Ghost Weight in Input-Feldern:**
- Letztes Gewicht/Wiederholungen stehen leicht verblasst im Input (`opacity: 0.35`)
- Tap auf ✓-Button: übernimmt Ghost-Wert automatisch und markiert Satz als fertig
- User kann Ghost-Wert auch überschreiben durch direktes Tippen

**Progressive Overload Chip:**
```
💡 +1 Wdh.  (letzte Woche: 8×80kg → Ziel: 9×80kg)
```
- Deterministisch berechnet — kein API-Call
- Regel: wenn alle Reps im letzten Set erreicht wurden → +1 Rep Vorschlag
- Wenn 2x oberes Reprange erreicht → +2.5kg Vorschlag

**Set Row — Vereinfacht:**
```
[Nr] [KG-Input     ] [WDH-Input   ] [✓ / undo]
```
- Spaltenheader bleiben (KG / WDH / VOL)
- Set Type (Warm-up / Drop Set / Failure) → aus ⚙️ Panel, nicht inline sichtbar
- Cardio-Modus: KM / MIN / PACE bleibt

### 2.3 ⚙️ Exercise Settings Bottom Sheet

Öffnet als Bottom Sheet (Framer Motion slide-up), schließt mit Swipe-Down.

**Inhalt:**

```
EQUIPMENT
[Langhantel] [Kurzhantel] [Kabel] [Maschine] [Eigengewicht] [Andere]

SEITIG
[Bilateral ●]  [Unilateral]

GYM  (optional)
[+ Gym hinzufügen / Gym auswählen ▼]

PAUSE NACH SATZ
[60s] [90s●] [120s] [180s] [300s]  + Custom-Slider

WARM-UP SÄTZE
[AN/AUS]  Anzahl: [1] [2] [3]
(Warm-up Sätze zählen nicht in Stats/Score)

WIEDERHOLUNGSBEREICH
Min [6] ──●── Max [12]  (Slider)

SATZ-TYPEN (für aktuelle Session)
Normal / Drop Set / Bis Versagen / Pause-Rest

NOTIZEN ZUR ÜBUNG
[Freitextfeld — "Schultern zurückziehen..."]

ERWEITERT
→ Letzte 5 Einheiten (History View)
→ 1RM Rechner
→ Wissenschaftliche Notiz (war "Warum?")

[Übung ersetzen]  [Übung entfernen]
```

### 2.4 Drag & Drop
- Library: `@dnd-kit/core` + `@dnd-kit/sortable`
- Drag-Handle (≡) links am ExerciseCard
- Smooth reorder animation
- Ersetzt die bisherigen ArrowUp/ArrowDown Buttons

---

## 3. Exercise Variations System

### 3.1 Das Kernproblem
Gleiche Übungsname (z.B. "Latzug"), aber völlig andere Belastungsrealität je nach Equipment und Gym. Bisherige PR-Tracking vermischt alle Variationen — das führt zu falschen PRs.

### 3.2 Datenmodell

```typescript
// Neues Feld auf SetEntry
interface SetEntry {
  variationKey: string; // "{exerciseId}::{equipment}::{gymId|global}"
  // Beispiele:
  // "lat-pulldown::cable::mcfit-berlin"
  // "lat-pulldown::machine::global"
  // "bench-press::barbell::global"
  // existing fields...
}

// PRs werden per variationKey gespeichert
interface PRRecord {
  variationKey: string;
  weight: number;
  reps: number;
  estimated1RM: number; // Epley-Formel: w * (1 + r/30)
  date: string;
}

// Gym-Datenstruktur
interface Gym {
  id: string;       // "mcfit-berlin"
  name: string;     // "McFit Berlin Mitte"
  createdAt: string;
}
```

### 3.3 Stats-Ansicht für Variationen
- Default: alle Variationen einzeln mit eigenem Chart
- Toggle "Gesamt": normalisiert auf geschätzten 1RM für Übersicht
- Variation-Selector Tabs: `[Kabel McFit] [Maschine] [Alle]`

### 3.4 Exercise Database Erweiterung
- Aktuelle DB: ~60 Übungen
- Ziel: 150+ Übungen mit Variationslinks
- Populäre Übungen pro Muskelgruppe (hardcoded Ranking basierend auf realer Nutzungsstatistik)
- Cardio-Übungen: Laufen, Radfahren, Rudern, Schwimmen mit eigenen Tracking-Feldern

---

## 4. Workout Score Engine

### 4.1 Philosophie
Score-Ziel ist immer **100** — nicht Vergleich zum eigenen Durchschnitt, sondern zu wissenschaftlich definierten Optimal-Werten. Jede Übung ist anders normalisiert.

### 4.2 Score-Formel

```
GesamtScore =
  Volumen-Score     × 0.35
  + Intensitäts-Score × 0.25
  + Abdeckungs-Score  × 0.25
  + Dauer-Score       × 0.10
  + RPE-Score         × 0.05
```

**Volumen-Score (0–100):**
- Berechne pro Muskelgruppe: Wochensätze im MEV–MAV Bereich?
  - MEV (Minimum Effective Volume): ~10 Sätze/Woche pro Muskel
  - MAV (Maximum Adaptive Volume): ~20 Sätze/Woche
  - Score = clamp(wochensätze / MAV × 100, 0, 100)
- Normalisierung: Sätze sind satzbasiert, nicht gewichtsbasiert

**Intensitäts-Score (0–100):**
- Prilepin-Tabelle als Referenz:
  - 55–65% 1RM: Optimal für Ausdauer (>6 Reps)
  - 70–80% 1RM: Optimal für Hypertrophie (6–12 Reps)
  - 80–90% 1RM: Optimal für Kraft (1–5 Reps)
- Score = wie nah waren die genutzten % 1RM am Zielbereich für das Ziel des Users?
- 1RM wird geschätzt per Epley-Formel

**Abdeckungs-Score (0–100):**
- Welche Muskelgruppen waren im Split geplant?
- Welche wurden trainiert?
- Welche Muskel-Subgruppen fehlen?
  - Trizeps: Long Head (Overhead), Lateral Head (Pushdowns), Medial Head
  - Bizeps: Long Head, Short Head
  - Schulter: Anterior, Medial, Posterior Delt
- Score = trainierte Subgruppen / geplante Subgruppen × 100

**Dauer-Score (0–100):**
- Optimal: 45–75 Minuten für Kraft/Hypertrophie
- < 30 min oder > 105 min: Score fällt
- Lineare Interpolation zwischen Grenzen

**RPE-Score (0–100):**
- User gibt 0–10 Slider nach dem Training an
- RPE 7–8.5 = optimal (Score 100)
- RPE < 5 oder > 9.5 = Score fällt
- Optional — wenn nicht eingegeben: dieser Anteil wird neutral gewichtet

### 4.3 Tipps-Engine (deterministisch)
Tipps werden aus If-Schleifen generiert, kein API-Call:

```typescript
const tips: string[] = [];

if (volumeScore < 70) tips.push(`${weakMuscle}: mehr Sätze nächstes Mal`);
if (intensityScore < 70) tips.push(`Intensität erhöhen: ${suggestion}`);
if (duration > 90) tips.push('Training war zu lang — fokussierter trainieren');
if (missedSubgroups.length > 0) {
  tips.push(`${missedSubgroups[0]} nicht trainiert → ${suggestedExercise} hinzufügen`);
}
// Progressive Overload Tips pro Übung
exercises.forEach(ex => {
  if (ex.allRepsHit) tips.push(`${ex.name}: +1 Wdh. oder +2.5kg möglich`);
});
```

### 4.4 Summary Screen — Neues Layout

```
[Hero: Score 87/100 — große Zahl, Akzentfarbe, Konfetti-Animation wenn >90]

SCORE AUFSCHLÜSSELUNG
Volumen      ████████░░  82
Intensität   █████████░  91
Muskelabdeck ██████░░░░  64 ⚠
Dauer        █████████░  88
RPE          ████████░░  80

⚠ SCHWACHSTELLEN
[Trizeps Long Head nicht trainiert → Overhead Extension fehlt]

💡 NÄCHSTES MAL
[Liste deterministischer Tipps]

HEATMAP — Welche Muskeln heute trainiert

ÜBUNGEN & STATS
[Kompakte Liste aller Übungen mit Sets/Weight]

[Teilen als Link 🔗] [PDF Export 📄]
[Zum Dashboard]  [Im Verlauf ansehen]
```

### 4.5 Teilen

**Link-Sharing:**
- Route: `/share/[sessionToken]` — öffentlich, kein Login nötig
- Zeigt: Score, Heatmap, Übungsliste, PRs — exakt das gleiche Design wie Summary
- Username wird angezeigt falls Session geteilt wurde ("Training von Arved")
- sessionToken = kurzer Hash, 24h gültig (oder permanent mit Account)

**PDF Export:**
- Next.js API Route `/api/export/workout-pdf`
- Library: `@react-pdf/renderer`
- Layout: professionell, dark-theme, Logo, alle Metriken, Heatmap als SVG

---

## 5. Dashboard — Neues Layout

### 5.1 Aufbau

```
[Greeting + Name]  [⚙ Settings]

[Mini-Heatmap Body + Wochenmetriken Side-by-Side]

⚠ MUSCLE COVERAGE SIGNAL (nur wenn Wochentage noch übrig)
"Noch 3 Tage — {Bizeps, hintere Deltas, Waden} zu wenig trainiert"
→ [Training starten das diese Muskeln trifft]

[START TRAINING Card — groß, prominent]

[Streak / Wocheneinheiten / Volumen — 3er Grid]

[Letzte Einheiten]

[Coach Card → /chat]
```

### 5.2 Muscle Coverage Algorithm

```typescript
// Wöchentliches Zielvolumen pro Muskelgruppe aus aktivem Split
const targetMuscles = getWeeklyTargetMuscles(activeSplit);
// Bereits trainierte Muskeln diese Woche
const trainedMuscles = getTrainedMusclesThisWeek(sessions);
// Fehlende Muskeln
const missing = targetMuscles.filter(m => !trainedMuscles.includes(m));
// Verbleibende Trainingstage
const daysLeft = getRemainingTrainingDays(activeSplit);
// Nur warnen wenn daysLeft > 0 und missing.length > 0
```

---

## 6. Splits Page

### 6.1 Änderungen
- Cleaner Layout: Split-Karten mit Übungsanzahl, Muskelgruppen-Badges
- Plan Quality Score: deterministisch berechnet (Frequenz, Volumen-Balance, Übungsauswahl)
- Split teilen: gleicher Mechanismus wie Workout-Sharing (Link + optionales PDF)

### 6.2 Plan Quality Score
```
Frequenz-Score:    Wird jede Muskelgruppe 2x/Woche getroffen?
Volumen-Balance:   Sind Push/Pull/Legs balanced?
Übungs-Qualität:  Compound + Isolation Mix?
Progression:       Gibt es eine logische Steigerung?
→ Score 0–100, Tipps zur Verbesserung
```

### 6.3 Workout aus History wiederverwenden
- In `/log/[sessionId]`: Button "Nochmal trainieren" → startet identisches Workout
- In `/log/[sessionId]`: Button "Zu Split hinzufügen" → fügt Session als Template-Tag zu einem Split hinzu

---

## 7. AI Coach — Smart Logic Hybrid

### 7.1 Architektur
- **90% deterministisch:** Progressive Overload, Score, Tipps, Muskelabdeckung — alles Code
- **10% KI:** Nur der Chat-Bereich (`/chat`) ruft API auf
- Kein offener Chat-Eingang mehr — stattdessen **vorgeschlagene Fragen/Optionen**

### 7.2 Chat UI — Neue Struktur
```
[Bot-Nachricht]

Schnellantworten:
[Trainingsplan anpassen?] [Warum dieser Score?] [Nächste Übung?]
```
User klickt Optionen statt freien Text → weniger API-Calls, bessere Antwortqualität

### 7.3 Prompt-Overhaul
- Ton: professioneller Personal Trainer — präzise, keine Emojis, kein Slang
- Format: kurze Absätze, Bulletpoints wo sinnvoll
- KI stellt Rückfragen bevor sie einen Plan erstellt
- Kein Trainingsplan als Default-Antwort mehr

---

## 8. Figma Redesign Track (parallel)

Alle Screens werden in Figma designed — parallel zur Code-Implementierung.
Screens: Dashboard, Active Workout, Summary, Exercise Page, Splits, Log, Stats, Onboarding, Settings, Share-Page.

Design-Prinzipien:
- Dark Mode, alles abgerundet
- Akzentfarbe Cyan (#4DFFED) sparsam eingesetzt
- Typografie: Barlow Condensed (Headlines) + Manrope (Body)
- Inspiration: Strong App (Klarheit), TitanPro (Datendichte), eigene Identität

---

## 9. Technische Dependencies (neu)

```
@dnd-kit/core          — Drag & Drop
@dnd-kit/sortable      — Sortable Liste
@react-pdf/renderer    — PDF Export
```

Keine neuen Backend-Dependencies — alles läuft client-side + bestehende Supabase-Infra.

---

## 10. Out of Scope (V3)

- Social Features (Forum, Freunde, Chat, Sync-Workouts)
- Video-Demos
- Account-Verknüpfung mit My Life App
- KI-generierte Trainingspläne (ersetzt durch Logik-basierte Empfehlungen)
