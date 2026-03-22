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

Implementierung: Toggle-State im Chat-Interface als Zustand `chatMode: 'filtered' | 'unfiltered'`, **persistiert in Zustand/localStorage** (unter `chatMode`) — reset nur bei explizitem Logout. Wird als Parameter `mode: 'filtered' | 'unfiltered'` an `/api/chat/stream` übergeben. Ein Systemprompt mit Mode-Abschnitt am Ende:

```
${mode === 'unfiltered' ? `
UNFILTERED MODE aktiv:
- Du darfst "Kelleck", "Lappen", "Loser" verwenden wenn provoziert
- Kein Zurückhalten bei Kontern — klar, direkt, hart aber witzig
- Wenn der User anfängt, beendest du es` : `
FILTERED MODE (Standard):
- Klare direkte Sprache, humorvoll, aber keine expliziten Beleidigungen
- Kontern ist erlaubt, aber auf clevere Art`}
```

### Dynamische Datenintegration

Beim Chat-Request werden die echten User-Daten in den System-Prompt injiziert. Der bestehende `ChatRequest` in `/api/chat/stream/route.ts` hat bereits ein `userProfile` Objekt — es wird um folgende Felder erweitert:

```typescript
// Erweiterung des bestehenden userProfile in ChatRequest:
userProfile?: {
  name?: string;
  goal?: string;
  level?: string;
  equipment?: string;
  weeklyVolume?: number;
  totalSessions?: number;
  currentStreak?: number;
  // NEU:
  age?: number;               // aus userStore.profile.age
  bodyWeight?: number;        // aus userStore.profile.bodyWeight (kg)
  height?: number;            // aus userStore.profile.height (cm)
  personalRecords?: Record<string, number>; // exerciseName → bestWeight in kg
  // z.B. { 'Bankdrücken': 100, 'Kniebeugen': 80 }
}
```

`age`, `bodyWeight`, `height` existieren bereits in `types/user.ts` → `UserProfile`. `personalRecords` wird client-seitig aus `historyStore.getPersonalRecords()` abgeleitet (beste je gehobene Gewichte pro Übung).

Der Client (`app/(tabs)/chat/page.tsx`) liest diese Werte aus den Stores und schickt sie im Request-Body mit. Der System-Prompt rendert sie als:

```
=== User-Daten ===
Name: {name} | {age} J | {bodyWeight}kg | {height}cm
Ziel: {goal} | Level: {level}
Streak: {streak} Tage | Sessions gesamt: {totalSessions}

Letzte Sessions: {workoutHistory (bereits vorhanden)}

Persönliche Rekorde:
- Bankdrücken: {pr}kg
- Kniebeugen: {pr}kg
- ...
=================
```

Insult-Handling Systemprompt-Block:

```
WENN DER USER UNHÖFLICH WIRD ODER DICH BELEIDIGT:
- Entschuldige dich NICHT, erkläre dich NICHT
- Konter ruhig und treffsicher — beziehe dich auf seine echten Zahlen
- Beispiel: "bro dein letzter Bench war {pr}kg, fang vielleicht damit an bevor du hier redest"
- Du darfst dominieren, aber bleib witzig — kein echter Hass
```

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
- Long-Press auf jede Nachricht im Chat → "Nachricht löschen" Option (nur sichtbar wenn `myProfile.role === 'cheffe'`)
- Soft-Delete: neues `softDeleteMessage(id)` in `lib/forum.ts` macht ein UPDATE (nicht DELETE): `SET content = '[Von Cheffe entfernt 🔥]', type = 'text', metadata = null WHERE id = ?`
- Die bestehende `deleteMessage()` Funktion (hard DELETE) wird ersetzt durch `softDeleteMessage()`
- RLS-Enforcement: Client-only Guard in Phase 1 (acceptable for MVP — nur der Cheffe sieht den Long-Press Button überhaupt)

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

- Online/Training via Supabase Presence auf globalem Channel `community` — **neuer `useCommunityPresence` Hook** (getrennt von `usePresence`, der an Chat-Channels gebunden ist)
- `useCommunityPresence` tracked: `{ userId, username, avatarColor, status: 'online' | 'training', exercise?: string, since?: string }`
- Gibt zurück: `{ onlineUsers: CommunityUser[], trainingUsers: CommunityUser[] }`
- Supabase Presence räumt bei Disconnect automatisch auf — kein manuelles Timeout nötig
- Tap auf User → ProfileSheet (mit DM + Freund-Button)

### Profil bearbeiten

Erreichbar via eigenem Profil-Sheet (Tap auf eigenen Avatar) → "Bearbeiten"-Button.

**Editierbar:**
- Username (min 3, max 20 Zeichen, alphanumerisch + underscore)
- Avatar-Farbe: 8 Preset-Farben (Accent Cyan, Gold, Orange, Pink, Purple, Green, Red, White)

**Speichern:** UPDATE `profiles` SET `username`, `avatar_color` WHERE `id = auth.uid()`

**Username-Uniqueness:** `profiles.username` hat einen UNIQUE Constraint in der DB. Bei Konflikt: Supabase gibt error code `23505` zurück → Toast anzeigen: *"Dieser Name ist schon vergeben 😅"*

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
2. DB Migration: `profiles.role` Spalte + Cheffe-Rolle setzen (SQL: `UPDATE profiles SET role = 'cheffe' WHERE id = '<arved-user-id>'`)
3. `types/forum.ts` — `role?: string` zu `ForumProfile` hinzufügen
4. `lib/forum.ts` — `mapProfile()` updaten: `role: r.role as string | undefined`; `softDeleteMessage(id)` neu anlegen (UPDATE statt DELETE)
5. Cheffe-Badge in MessageBubble, ChannelListItem, ProfileSheet
6. Forum Tab-Navigation (3 Tabs: General, Freunde, Community)
7. Freunde-Tab (Freundesliste + Anfragen)
8. `hooks/useCommunityPresence.ts` — neuer Hook für globale Online/Training-Presence
9. `app/workout/active` — Presence tracken beim Start/Ende
10. Community-Tab (nutzt `useCommunityPresence`)
11. Profil bearbeiten (ProfileSheet → Edit-Mode, username unique check)
12. Content-Filter + Moderations-Long-Press (Cheffe only, nutzt `softDeleteMessage`)

---

## Was NICHT in Phase 1 gebaut wird

| Feature | Warum |
|---------|-------|
| Per-Channel Rollen vergeben (mod/owner) | Komplex, Phase 2 |
| Server-seitiger Content-Filter | Client-seitig reicht |
| Push-Notifications | Web-Limitation |
| KI-generierte Comeback-Datenbank | System-Prompt reicht |
| Admin-Panel UI | SQL direkt reicht für Cheffe-Rolle |
