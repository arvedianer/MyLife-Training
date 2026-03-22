# Design Spec: Forum & Social Layer (Phase 1 — Chat-First MVP)
**Datum:** 2026-03-22
**Status:** Approved
**Scope:** General Chat, DMs, Gruppen-Chats, Profil-Sheet, Workout-Karten teilen, Online-Präsenz, Badge-System

---

## Kontext & Motivation

Die App hat starke Solo-Features (Tracking, Stats, PRs). Was fehlt ist die soziale Schicht: Freunde sehen was du trainierst, motivieren sich gegenseitig, teilen PRs. Kein vollständiges Social Network — ein training-zentriertes Chat-Interface das die App lebendig macht.

Ansatz: Chat-First MVP. Messaging-Infrastruktur zuerst (General, DMs, Gruppen). Feed und Auto-Posts kommen in Phase 2.

---

## Datenbank — 4 neue Supabase-Tabellen

### `profiles`
Öffentliches Profil, automatisch bei Signup erstellt.

```sql
id            uuid  PRIMARY KEY REFERENCES auth.users(id)
username      text  UNIQUE NOT NULL
avatar_color  text  DEFAULT '#4DFFED'   -- zufällige Akzentfarbe
athlete_score int   DEFAULT 0
streak        int   DEFAULT 0
created_at    timestamptz DEFAULT now()
```

### `friendships`
Freundes-Beziehungen mit Status.

```sql
id        uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_a    uuid REFERENCES profiles(id)
user_b    uuid REFERENCES profiles(id)
status    text CHECK (status IN ('pending', 'accepted'))
created_at timestamptz DEFAULT now()
UNIQUE(user_a, user_b)
```

### `channels`
Alle Chat-Kanäle: General, DMs, Gruppen.

```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
type         text CHECK (type IN ('general', 'dm', 'group'))
name         text   -- NULL für DMs, gesetzt für Gruppen
participants uuid[] -- Array von User-IDs (leer für general)
created_by   uuid REFERENCES profiles(id)
created_at   timestamptz DEFAULT now()
```

### `messages`
Alle Nachrichten aller Kanäle.

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
channel_id  uuid REFERENCES channels(id) ON DELETE CASCADE
sender_id   uuid REFERENCES profiles(id)
content     text
type        text CHECK (type IN ('text', 'workout_card')) DEFAULT 'text'
metadata    jsonb   -- für workout_card: { sessionId, exercises, volume, score, heatmap }
created_at  timestamptz DEFAULT now()
```

### Row Level Security

- `profiles`: öffentlich lesbar für alle authentifizierten User; eigenes Profil schreibbar
- `channels general`: lesbar + schreibbar für alle authentifizierten User
- `channels dm/group`: nur lesbar/schreibbar wenn `auth.uid() = ANY(participants)`
- `messages`: lesbar wenn User Zugang zum Channel hat; einfügen nur für eigene `sender_id`

---

## Realtime — Supabase Presence & Broadcast

### Live-Nachrichten
`supabase.channel('channel:<id>').on('postgres_changes', { event: 'INSERT', table: 'messages' })` — neue Nachrichten erscheinen sofort ohne Reload.

### Typing Indicator
Broadcast (nicht persistiert): User sendet `{ type: 'typing', userId }` beim Tippen. Empfänger zeigt `"Max tippt..."` mit animierten Punkten (verschwindet nach 3s ohne neues Signal).

### Online-Präsenz
Supabase Presence: jeder aktive User joined den globalen Presence-Channel. Avatar bekommt grünen Dot wenn `user.id` in der Presence-Liste.

### Unread Badge
`unread_counts` View (oder einfaches client-seitiges Tracking): beim Öffnen eines Channels → `last_read_at` für diesen User aktualisieren. Badge = Summe aller Messages nach `last_read_at`.

---

## UI & Navigation

### Forum-Tab (5. Tab)
- Icon: Sprechblase (`MessageCircle` aus lucide-react)
- Badge: roter Kreis mit Zahl, erscheint wenn ungelesene Nachrichten vorhanden

### Forum-Startseite

```
General Chat                     [Badge wenn ungelesen]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Direktnachrichten
  [Avatar]  Max M.        "Krasses Training!" · 2m   [Badge]
  [Avatar]  Lisa K.       "Wann trainierst?"  · 1h
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Gruppen
  [🏋️]  Gym Crew           3 Mitglieder · 5m          [Badge]
  [+]   Neue Gruppe erstellen
```

### Chat-Screen (alle Typen)
- Eigene Nachrichten: rechts, Hintergrund `colors.accent` mit dunklem Text
- Fremde Nachrichten: links, Hintergrund `colors.bgCard`, Border
- Typing Indicator: `"[Name] tippt..."` unten links, 3 animierte Punkte (Framer Motion)
- Online-Dot: 8px grüner Kreis (`colors.success`) rechts-unten am Avatar
- Eingabefeld: unten fixiert, Send-Button + Teilen-Icon (öffnet Workout-Auswahl)
- Long-Press auf eigene Nachricht: löschen

### Workout-Karte (Message-Typ `workout_card`)

```
┌─────────────────────────────────┐
│ 🏋️  Arved · Heute 18:34         │
│ ─────────────────────────────── │
│ Bankdrücken PR: 85 kg  🔥        │
│ Volumen: 4.2t  ·  Dauer: 58 min │
│ [Body-Heatmap Thumbnail 60×80]  │
│ 4 Übungen  ·  Score: 87/100     │
└─────────────────────────────────┘
```

Wird schön gerendert (eigene Komponente `WorkoutCard`), nicht als reiner Text-Link.

### Profil-Sheet (Tap auf Avatar)
Bottom Sheet, öffnet sich über dem Chat:

```
[Avatar-Kreis mit Initialen + Farbe]
MaxMustermann
Athlet · 680 Punkte  ·  🔥 12 Tage Streak

Bankdrücken PR: 95 kg
Kniebeugen:    120 kg

[+ Freund hinzufügen]   [Nachricht schicken]
```

Wenn bereits befreundet: `[✓ Befreundet]` statt Add-Button.

### Freund hinzufügen / Anfragen
- Anfrage senden: Insert in `friendships` mit `status: 'pending'`
- Badge auf Forum-Tab wenn Freundesanfragen ausstehen
- Annahme/Ablehnen in einer Anfragen-Sektion auf der Forum-Startseite

---

## Workout teilen — Flow

1. User schließt Workout ab → Summary-Page zeigt neuen Button **"Im Forum teilen"**
2. Sheet öffnet sich: Auswahl `General Chat` / `Direktnachricht an...` / `Gruppe...`
3. Optional: kurze Textnachricht dazu tippen
4. Senden → `INSERT` in `messages` mit `type: 'workout_card'` und `metadata: { ... }`

---

## Was NICHT in Phase 1 gebaut wird

| Feature | Warum |
|---------|-------|
| Auto-Post bei PR | Kann nervig sein — Phase 2 als opt-in |
| Reactions / Emoji | Phase 2 |
| Voice Messages | Kein MVP-Bedarf |
| Push Notifications | Webapp-Limitation, Web Push komplex |
| Story / Feed | Phase 2 |
| Moderation-Tools (General Chat) | Phase 2 |

---

## Technische Voraussetzungen

- Supabase Realtime aktivieren für `messages`-Tabelle
- Supabase Presence aktiviert (Standard in Supabase)
- 4 neue DB-Tabellen mit RLS-Policies (per Migration)
- Neuer Forum-Tab in `app/(tabs)/layout.tsx`
- Neues Verzeichnis `app/(tabs)/forum/`

---

## Implementierungs-Reihenfolge

1. DB-Schema + RLS-Migrations
2. `profiles`-Tabelle befüllen (Trigger bei Signup + manuelle Migration für bestehende User)
3. Forum-Tab + Startseite (statisches Layout)
4. General Chat (Realtime messages)
5. DMs (Channel erstellen + öffnen vom Profil)
6. Gruppen (Channel erstellen, Mitglieder einladen)
7. Profil-Sheet + Freunde-System
8. Workout-Karte teilen (Summary → Forum)
9. Typing Indicator + Online-Presence
10. Badge-System + Unread-Counts
