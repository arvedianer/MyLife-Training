# Design Spec: Stats Rework + Forum Vision
**Datum:** 2026-03-22
**Status:** Approved
**Scope:** Paket 1 (Quick Fixes) + Paket 2 (Stats Rework) + Forum (separate Phase)

---

## Kontext & Motivation

Die App hat solide Kernfunktionen (aktives Workout, PR-Tracking, Heatmap, 1RM). Was fehlt ist das Gefühl von Progression über Zeit — das "Ich werde stärker und ich sehe es". Der User will die App erleben wie ein RPG-Charakter: Stats steigen, Vergleiche motivieren, die ganze Trainings-Geschichte ist auf einen Blick sichtbar. Außerdem gibt es konkrete UI-Bugs im Workout Summary (falsche Heatmap-Logik) und unverständliche Elemente in Stats ("vs. vorherige Periode").

---

## Paket 1 — Quick Fixes

### 1.1 Workout Summary Heatmap — Neue Logik

**Problem:** Die Summary-Heatmap verwendet wöchentliches Volumen als Basis. Wenn man 1 Satz Brust macht und sonst nichts diese Woche, zeigt sie "Maximum" — weil 1 > 0 = relativer Max. Das ist falsch und verwirrend.

**Lösung:** Im Workout Summary wird die Heatmap **binary**:
- Muskeln die in **dieser Session** trainiert wurden → leuchten in `colors.accent` (#4DFFED)
- Alle anderen → dim (opacity 0.05, Weiß)
- Keine Intensitätsstufen, keine Legende nötig
- Einzige Label-Änderung: Legende entfällt komplett, stattdessen kleiner Text oben: "Trainierte Muskeln"

**Technisch:** `BodyHeatmap` bekommt einen neuen optionalen Prop `mode?: 'weekly' | 'session'`. Im `session`-Modus: jeder Muskel mit sets > 0 bekommt `fill: colors.accent, fillOpacity: 1.0`. Die Workout Summary übergibt `mode="session"` und berechnet `muscleSets` nur aus der abgeschlossenen Session.

### 1.2 Muskelkater-Anzeige — Visuelles Redesign

**Problem:** Aktuell Liste mit rohen Stunden ("Brust: 10 Stunden"). Wirkt technisch, unfertig, schwer lesbar.

**Lösung:** Pro Muskelgruppe eine kompakte Recovery-Card:
- Muskelname + Icon
- Progress-Bar: 0% = gerade trainiert (rot), 50% = halb erholt (gelb), 100% = bereit (grün)
- Label: "~18h" wenn noch recovering, "Bereit ✓" wenn über 90% erholt
- Kompakteres Grid-Layout (2 Spalten statt Liste)

### 1.3 "vs. vorherige Periode" entfernen

Einfach aus dem Stats-Tab entfernen. Kein Replacement.

---

## Paket 2 — Stats Rework

### 2.1 Zeitnavigation

Ein **Week / Monat / Lifetime Toggle** ganz oben auf der Stats-Seite. Beeinflusst:
- Alle numerischen Stats
- Die Heatmap (siehe 2.2)
- Die Dimensionen-Scores (relative Berechnung je nach Zeitraum)
- Die Benchmark-Vergleiche

### 2.2 Heatmap als Zeitmaschine

Die bestehende Heatmap im Stats-Tab wird toggle-responsiv:

| Toggle | Heatmap zeigt |
|--------|---------------|
| **Woche** | Muskelvolumen diese Woche (bisheriges Verhalten) |
| **Monat** | Muskelvolumen diesen Monat — mehr Sessions = kräftigere Farbe |
| **Lifetime** | Muskelvolumen aller Zeiten — dein Charakter auf einem Blick. Lieblings-Muskeln leuchten purple, vernachlässigte bleiben gelb oder weiß |

Für Lifetime: `muscleSets` wird über alle Sessions summiert. Max-Wert normalisiert auf das am meisten trainierte Muscle (wie bisher, aber über alle Zeit).

### 2.3 Athleten-Score (Headline)

Ganz oben nach dem Toggle: ein großer Score **0–1000** mit einem motivierenden Label:

| Score | Label |
|-------|-------|
| 0–200 | Einsteiger |
| 201–400 | Aufsteiger |
| 401–600 | Fortgeschrittener |
| 601–800 | Athlet |
| 801–950 | Elite |
| 951–1000 | Legende |

Der Score **steigt nur, sinkt nie** (Lifetime-Score). Darunter klein: "+12 diese Woche".

Berechnung: gewichteter Durchschnitt der 5 Dimensionen (Stärke 30%, Konsistenz 25%, Volumen 20%, Ausdauer 15%, Ausgewogenheit 10%).

### 2.4 Die 5 Dimensionen

5 Karten in 2+2+1 Grid. Jede zeigt: Name, Score 0–100, Mini-Balken, `ⓘ`-Button.

| Dimension | Berechnet aus | Gewichtung |
|-----------|---------------|-----------|
| **Stärke** | Bestes 1RM je Hauptübung relativ zu Körpergewicht (Epley). Normalisiert auf Strength Standards (ExRx) für Alter+KG | 30% |
| **Konsistenz** | Trainingstage / Ziel-Tage im Zeitraum, Streak-Qualität, Rest Days korrekt gesetzt | 25% |
| **Volumen** | Gesamttonnen im Zeitraum vs. Erwartungswert für Trainingshäufigkeit | 20% |
| **Ausdauer** | Cardio-Sessions, hohe Rep-Ranges (15+), durchschnittliche Workout-Dauer | 15% |
| **Ausgewogenheit** | Wie gleichmäßig alle Hauptmuskelgruppen trainiert wurden (Push/Pull/Legs Balance) | 10% |

Der `ⓘ`-Button öffnet ein kleines Sheet: "Basiert auf deinen letzten X Sessions. Dein bestes 1RM Bankdrücken: 101kg = 1.35× Körpergewicht."

### 2.5 Benchmarks — Vergleiche

Eine Sektion mit motivierenden Percentile-Karten. Alle positiv geframed.

**Kategorien:**

**Hauptübungen** (statische Strength Standards nach Altersgruppe + Körpergewicht, ExRx-Basis):
- Bankdrücken, Kniebeugen, Kreuzheben, Schulterdrücken
- Format: "Dein Bankdrücken (80 kg) übertrifft **~68%** der Männer deiner Altersgruppe (17 J.)"

**Volumen:**
- "Du bewegst **40% mehr** Wochenvolumen als der Durchschnitt deiner Altersgruppe"

**Frequenz:**
- "Du trainierst **4× pro Woche** — öfter als **71%** der Trainierenden"

**Konsistenz:**
- "Dein Streak von **X Tagen** übertrifft **Y%** aller aktiven Nutzer"

Datenbasis: Statisch hardcodete Perzentil-Tabellen basierend auf publizierten Fitness-Studien und Strength Standards. Kein API-Call. Wird nach Alter (aus Onboarding) und Körpergewicht (aus Profil) gefiltert.

### 2.6 Lifetime-Zahlen

Nur sichtbar wenn Toggle auf "Lifetime":

Drei große Impact-Zahlen:
- **X.X Tonnen** bewegt (Gesamtvolumen aller Zeiten)
- **X Sessions** absolviert
- **X Stunden** trainiert

Darunter optional: "Damit hast du X Mal das Gewicht des Eiffelturms gehoben." (motivierender Vergleich, hardcoded Berechnung)

---

## Forum — Separate Phase (V3)

### Vision

Das Forum macht die App sozial ohne sie zu einem Social Network zu machen. Kerngedanke: Training ist persönlich, aber Freunde motivieren. Alles dreht sich ums Training — kein generischer Feed.

### Features

**Freunde-System:**
- Freunde per Username/Link hinzufügen
- Freunde-Liste mit ihrem aktuellen Streak, letztem Workout, Volumen dieser Woche
- Push-Notification wenn ein Freund trainiert ("Max hat gerade eine neue PR gemacht")

**Automatische Workout-Posts:**
- Nach jedem abgeschlossenen Workout: Option "Mit Freunden teilen"
- Automatische Benachrichtigung an Freunde bei neuen PRs ("Arved hat neuen Bankdrücken-PR: 85 kg")
- Format: kompakte Workout-Karte (Übungen, Volumen, PRs, Heatmap-Thumbnail)

**Chat:**
- Privater Chat mit einzelnen Freunden
- General Channel: offener Chat für alle App-User (moderated)
- Workout-Karten können direkt in Chat geteilt werden

**Sync-Workouts:**
- Zusammen trainieren: zwei User starten zur selben Zeit, sehen gegenseitig Fortschritt live
- Gleiche Übungen, gegenseitige Motivation ("Max hat Set 2 abgehakt")

### Technische Voraussetzungen (warum separate Phase)

- Supabase Realtime Subscriptions (noch nicht eingerichtet)
- User-Relationship Tabellen mit RLS (friends, followers)
- Push Notifications (Web Push API + Service Worker)
- Neue Auth-Flows (Freunde finden, Privacy-Settings)
- Neues UI-System (Chat-UI, Feed-UI)

**Aufwand:** ~2–3 Wochen Vollzeit. Eigener Brainstorm → Spec → Plan-Zyklus wenn Paket 1 + 2 abgeschlossen sind.

---

## Implementierungs-Reihenfolge

1. **Paket 1** — Quick Fixes (Heatmap-Logik Summary, Muskelkater-Redesign, "vs. Periode" entfernen)
2. **Paket 2** — Stats Rework (Toggle, Heatmap-Zeitmaschine, Scores, Benchmarks)
3. **Forum** — Eigenständige Phase nach Paket 2, separater Spec/Plan-Zyklus

---

## Was explizit NICHT gebaut wird (in diesen Paketen)

- CSS Modules Refactoring des Dashboards (kein User-Value, technische Schuld für später)
- Swipe-to-Delete SetRow (Gemini-Vorschlag, nicht prioritär)
- Apple Health / Google Fit Sync (V4+)
- Audio-Coach TTS (V4+)
