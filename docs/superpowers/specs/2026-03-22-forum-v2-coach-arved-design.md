# Design Spec: Forum v2 + Coach Arved v2
**Datum:** 2026-03-22
**Status:** Approved
**Scope:** Forum Tab-Navigation, Cheffe-Rolle, Community-Tab, Profil bearbeiten, Content-Filter, General Chat Bugfix, Coach Arved Persona + Datenintegration + Filtered/Unfiltered Mode

---

## Teil 1: Coach Arved v2

### Persona

Coach Arved ist Arved — der Entwickler der App. 113kg Körpergewicht, 4 Jahre Training. Ruhig, entspannt, direkt. Gibt echtes Trainingswissen weiter, kurz und präzise. Witzig wenn's passt, aber nie auf Krampf. Redet wie ein Mensch, nicht wie eine KI. Kein "wir müssen reden", kein "ich verstehe deinen Frust", keine formellen Formulierungen.

**Beispiel Tonalität:**
- Schlecht: "Dein Squat ist seit 2 Monaten gleich geblieben. Wir sollten das analysieren."
- Richtig: "dein Squat ist seit 2 Monaten gleich — straf dich mal und train die Beine"

### Insult-Handling

Wenn ein User unhöflich wird, klappt Coach Arved zurück — ruhig aber treffsicher. Er entschuldigt sich nicht, er erklärt nicht, er dominiert die Situation.

**Konter-Stil:** Bezieht sich auf die echten User-Daten (schwache Zahlen, verpasste Sessions, etc.). Beispiel: User beleidigt → Arved antwortet mit Referenz auf dessen letzten Workout.

**Erlaubte Beleidigungen bei Gegenprovokation:** Kelleck, Lappen, Loser — auf witzig, nicht auf bösartig. Nur reaktiv (nie proaktiv beleidigen).

### Filtered / Unfiltered Mode

Toggle direkt im Coach-Arved-Chat-Interface (nicht in Settings):

- **🔒 Filtered (Standard):** Witzig, hilfreicher Trainer, klare direkte Sprache, PG-13. Kann klug kontern, aber keine expliziten Beleidigungen.
- **🔓 Unfiltered:** Volle Arved-Energie. Kann "Kelleck", "Lappen", "Loser" etc. verwenden wenn provoziert. Härter, echter.

Implementierung: Toggle-State im Chat-Interface, wird als Parameter `mode: 'filtered' | 'unfiltered'` an `/api/chat/stream` übergeben. Zwei Systemprompt-Varianten (oder ein Prompt mit Mode-Abschnitt).

### Dynamische Datenintegration

Beim Chat-Request werden die echten User-Daten in den System-Prompt injiziert:

```
=== User-Daten ===
Name: {username}
Alter: {age} Jahre | Gewicht: {bodyWeight}kg | Größe: {height}cm
Ziel: {goal}
Streak: {streak} Tage

Letzte 3 Sessions:
- {date}: {exercises mit Gewichten und Sets}
- ...

Persönliche Rekorde:
- Bankdrücken: {pr}kg
- Kniebeugen: {pr}kg
- Kreuzheben: {pr}kg
- ...
=================
```

Diese Daten kommen aus dem Request-Body (Client schickt sie mit) — kein Server-seitiger DB-Zugriff nötig.

### System-Prompt-Stil

- Kurze Sätze, Kleinschreibung erlaubt wo es natürlich wirkt
- Emojis sparsam und passend (💪🔥😂 — keine Blumen oder Herzen)
- Bullet-Points für Trainingspläne/Übersichten
- Tabellen für Vergleiche
- Kein "Als KI...", kein "Ich bin hier um...", kein Filler

---

## Teil 2: Forum v2

### Tab-Navigation

Neue 3-Tab-Struktur oben auf der Forum-Seite (ersetzt die bisherige Liste):

```
[  General  ]  [  Freunde  ]  [  Community  ]
    ─────
```

- Horizontale Tabs mit Accent-Underline für aktiven Tab
- Unread-Badges als rote Zahlen-Bubbles auf den Tabs
- Kein Reload beim Tab-Wechsel — alle drei Inhalte sind gemountete Components

### Cheffe-Rolle 👑

**Datenbank:**
- `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT NULL`
- Wert `'cheffe'` für Arved's Account (manuell per SQL oder über Admin-Panel)
- Kein UI zum Rolle-vergeben in Phase 1 (nur Cheffe-Rolle, kommt per SQL)

**Darstellung:**
- Überall wo ein Username angezeigt wird: wenn `profile.role === 'cheffe'` → `👑` vor dem Namen, Farbe `#FFD700` (Gold) statt weiß
- Betrifft: MessageBubble, ChannelListItem, ProfileSheet, Community-Tab

**Moderations-Powers:**
- Long-Press auf jede Nachricht im Chat → "Nachricht löschen" Option (nur wenn eigene Cheffe-Rolle)
- Nach Löschen: Nachricht-Row in DB mit `content = '[Von Cheffe entfernt 🔥]'` updaten (soft delete, bleibt sichtbar als Platzhalter)
- Endpoint: `DELETE messages WHERE id = ? AND cheffe check`

**Content-Filter (General Chat):**
- Client-seitig: Liste von blockierten Wörtern, vor dem Absenden prüfen
- Bei Match: Toast-Nachricht "Nicht so bitte 🫵" — Nachricht wird NICHT gesendet
- Wortliste: `['wörter', 'die', 'zu', 'hart', 'sind']` — konfigurierbar in einer Konstante
- Kein Server-Filter in Phase 1 (client-seitig reicht für MVP)

### Freunde-Tab

```
┌─ Freundschaftsanfragen (wenn pending) ─────┐
│  [Avatar] MaxMustermann  [✓ Annehmen] [✗]  │
└────────────────────────────────────────────┘

Freunde (12)
[Avatar] Lisa K.         🟢 Online      →
[Avatar] Max M.          ⚫ Offline     →
[Avatar] Tom S.          🏋️ Trainiert  →
```

- Tap auf Freund → DM öffnen
- Online-Status via Supabase Presence (globaler Presence-Channel)
- "Trainiert gerade" = Presence-State mit `{ status: 'training' }` Flag

### Community-Tab

```
🟢 Online jetzt (4)
[Avatar] Lisa   [Avatar] Max   [Avatar] Tom   [Avatar] Kai

🏋️ Trainiert gerade (2)
[Avatar] Lisa K.  — Bankdrücken · seit 23 Min
[Avatar] Tom S.   — Beintraining · seit 8 Min

👥 Alle Nutzer
[Avatar] MaxMustermann   680 Punkte
[Avatar] Lisa K.         540 Punkte
[Avatar] ...
```

- Online/Training via Supabase Presence (globaler Channel `community`)
- Tap auf User → ProfileSheet (mit DM + Freund-Button)
- "Trainiert gerade" Detection: Beim Start des Workouts (`app/workout/active`) track Presence mit `{ status: 'training', exercise: currentExercise }`; beim Verlassen der Seite auto-cleanup

### Profil bearbeiten

Erreichbar via eigenem Profil-Sheet (Tap auf eigenen Avatar) → "Bearbeiten"-Button.

**Editierbar:**
- Username (min 3, max 20 Zeichen, alphanumerisch + underscore)
- Avatar-Farbe: 8 Preset-Farben (Accent Cyan, Gold, Orange, Pink, Purple, Green, Red, White)

**Speichern:** UPDATE `profiles` SET `username`, `avatar_color` WHERE `id = auth.uid()`

### General Chat Bugfix

Beim Öffnen des General Chats tritt ein Fehler auf. Wahrscheinliche Ursache:
- `getMyChannels` gibt den General Channel zurück, aber `channelMeta` bleibt null wegen Race Condition oder RLS-Problem
- Fallback: wenn `channelMeta` null ist, trotzdem Chat rendern (kein Error-State)
- Außerdem: Supabase Realtime Filter-Syntax für leere `participants`-Arrays prüfen

Debugging-Strategie: Error-Boundary um den Chat-Screen, Console-Logs für Supabase-Responses.

---

## Implementierungs-Reihenfolge

### Coach Arved v2 (unabhängig, kann parallel)
1. `/api/chat/stream/route.ts` — neuer System-Prompt + Mode-Parameter + Daten-Injection
2. `app/(tabs)/chat/page.tsx` — Filtered/Unfiltered Toggle im UI, User-Daten mitschicken

### Forum v2
1. General Chat Bugfix (sofort, blockiert alles andere)
2. DB Migration: `profiles.role` Spalte + Cheffe-Rolle setzen
3. `types/forum.ts` — `role` Feld zu ForumProfile
4. Cheffe-Badge in MessageBubble, ChannelListItem, ProfileSheet
5. Forum Tab-Navigation (3 Tabs: General, Freunde, Community)
6. Freunde-Tab (Freundesliste + Anfragen)
7. Community-Tab (Online + Training Presence)
8. Workout Presence (active.tsx trackt Training-Status)
9. Profil bearbeiten (ProfileSheet → Edit-Mode)
10. Content-Filter + Moderations-Long-Press (Cheffe only)

---

## Was NICHT in Phase 1 gebaut wird

| Feature | Warum |
|---------|-------|
| Per-Channel Rollen vergeben (mod/owner) | Komplex, Phase 2 |
| Server-seitiger Content-Filter | Client-seitig reicht |
| Push-Notifications | Web-Limitation |
| KI-generierte Comeback-Datenbank | System-Prompt reicht |
| Admin-Panel UI | SQL direkt reicht für Cheffe-Rolle |
