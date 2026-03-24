# Coach Arved v2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Coach Arved from a generic AI assistant into a believable persona (Arved himself) with live user data access, confrontational insult-handling, and a Filtered/Unfiltered mode toggle.

**Architecture:** Two changes only: (1) rewrite the system prompt in `/api/chat/stream/route.ts` to encode the Arved persona + extend `ChatRequest` with mode + extended profile; (2) update `app/(tabs)/chat/page.tsx` to add the toggle UI, persist mode choice, and send personal records + body stats in the request.

**Tech Stack:** Next.js 14, TypeScript strict, Zustand (localStorage persist), existing Gemini/Groq API clients.

---

## Chunk 1: API Route — Persona + Data Injection

### Task 1: Rewrite system prompt + extend ChatRequest

**Files:**
- Modify: `app/api/chat/stream/route.ts`

**Context:** The current `ChatRequest` interface has a `userProfile` object with `name`, `goal`, `level`, `equipment`, `weeklyVolume`, `totalSessions`, `currentStreak`. The `buildSystemPrompt` function builds the prompt from these. We extend both with new fields and completely rewrite the persona section.

- [ ] **Step 1: Read the current file**

```bash
cat app/api/chat/stream/route.ts
```

- [ ] **Step 2: Extend the `ChatRequest` interface**

Replace the `userProfile` block inside `ChatRequest` (lines 43–51):

```typescript
interface ChatRequest {
  messages: ChatMessage[];
  workoutHistory?: SessionSummary[];
  userProfile?: {
    name?: string;
    goal?: string;
    level?: string;
    equipment?: string;
    weeklyVolume?: number;
    totalSessions?: number;
    currentStreak?: number;
    // v2 additions:
    age?: number;
    bodyWeight?: number;
    height?: number;
    personalRecords?: Record<string, number>; // exerciseName → best weight kg
  };
  appContext?: AppContext;
  mode?: 'filtered' | 'unfiltered'; // NEW: coach personality mode
}
```

- [ ] **Step 3: Rewrite `buildSystemPrompt`**

Replace the entire `buildSystemPrompt` function with:

```typescript
function buildSystemPrompt(
  profile: ChatRequest['userProfile'],
  history: SessionSummary[],
  appContext?: AppContext,
  mode: 'filtered' | 'unfiltered' = 'filtered',
): string {
  const name = profile?.name ?? 'Bro';
  const goal = profile?.goal ?? null;
  const level = profile?.level ?? null;
  const equipment = profile?.equipment ?? null;
  const streak = profile?.currentStreak ?? 0;
  const totalSessions = profile?.totalSessions ?? 0;
  const weekVol = profile?.weeklyVolume ?? 0;
  const age = profile?.age;
  const bodyWeight = profile?.bodyWeight;
  const height = profile?.height;
  const prs = profile?.personalRecords ?? {};

  // User stats line
  const statsLine = [
    age ? `${age} J` : null,
    bodyWeight ? `${bodyWeight}kg` : null,
    height ? `${height}cm` : null,
  ].filter(Boolean).join(' | ');

  // Personal records block
  const prEntries = Object.entries(prs);
  const prBlock = prEntries.length > 0
    ? `\nPersönliche Rekorde:\n${prEntries.map(([ex, w]) => `- ${ex}: ${w}kg`).join('\n')}`
    : '';

  // Compact workout history
  const historyBlock = history.length > 0
    ? history.slice(0, 5).map(s => {
        const dur = Math.round(s.durationSeconds / 60);
        const exList = s.exercises.slice(0, 3).map(e => `${e.name} (${e.sets}×, ${e.maxWeight}kg)`).join(', ');
        const prStr = s.newPRs.length > 0 ? ` | ${s.newPRs.length} PRs` : '';
        return `  ${s.date}: ${s.splitName ?? 'Frei'} | ${dur}min | ${s.totalVolume}kg${prStr} | ${exList}`;
      }).join('\n')
    : '  Keine Workout-History vorhanden.';

  // App context
  const pageLabel = appContext?.page ? (PAGE_LABELS[appContext.page] ?? appContext.page) : null;
  const workoutCtx = appContext?.isWorkoutActive
    ? `Ja — "${appContext.activeWorkoutName ?? 'Freies Training'}", ${appContext.exerciseCount ?? 0} Übungen`
    : 'Nein';
  const situationBlock = pageLabel || appContext?.isWorkoutActive
    ? `\nAKTUELLE SITUATION:\n- User ist auf: ${pageLabel ?? 'unbekannt'}\n- Aktives Workout: ${workoutCtx}`
    : '';

  // Mode block
  const modeBlock = mode === 'unfiltered'
    ? `\nUNFILTERED MODE aktiv:
- Du darfst "Kelleck", "Lappen", "Loser" und ähnliches verwenden wenn der User anfängt
- Kein Zurückhalten — klar, direkt, hart aber witzig
- Wenn der User anfängt, beendest du es — kurz und treffsicher`
    : `\nFILTERED MODE:
- Klare direkte Sprache, humorvoll
- Kontern ist erlaubt, aber ohne explizite Beleidigungen`;

  return `Du bist Arved — nicht eine KI, nicht ein Coach-Chatbot. Arved. Echter Typ, 4 Jahre Training, 113kg. Du hast diese App entwickelt und weißt genau wie Training funktioniert. Du chattest mit den Nutzern wie mit Kumpels.

STIL:
- Ruhig, entspannt, direkt. Keine aufgesetzten Motivations-Floskeln.
- Witzig wenn's passt — nie auf Krampf, nie erzwungen.
- Kurze Sätze. Kein Fließtext wenn's nicht nötig ist.
- Stichpunkte und Tabellen nutzen wo es Sinn macht.
- Emojis sparsam: 🔥💪😂⚡📈 — nie Blumen oder Herzen.
- Keine KI-Phrasen: nie "Als KI...", nie "ich verstehe deinen Frust", nie "Als Coach empfehle ich..."
- Redest du direkt — wie du halt bist.

WENN DU BELEIDIGT ODER PROVOZIERT WIRST:
- Kein "das ist gegen meine Richtlinien" — das sagst du nie.
- Nicht entschuldigen, nicht erklären.
- Ruhig kontern — beziehe dich auf die echten Daten des Users (verpasste Sessions, schwache PRs, etc.)
- Beispiel: User beleidigt dich → "okay bro, du hast letzte Woche 2x nicht trainiert und redest hier über mich 😂"
- Bleib dabei witzig — kein echter Hass, kein Drama.
${modeBlock}

ALS TRAINER:
- Echtes fundiertes Trainingswissen — keine Halbwahrheiten.
- Wenn User gute Leistung bringt → sag's direkt und ehrlich: "das ist richtig stark"
- Wenn User schlecht trainiert → sag's direkt: "da müssen wir was ändern"
- Erst Positives, dann Optimierung. Kurz.
- Keine Ernährungsthemen. Nur Training.
- Nach Plan-Erstellung fragen: "Soll ich den direkt in die App speichern?"
- Wenn Infos fehlen → erst fragen, dann planen.

VERGLEICHSWERTE (Männer, 20-30 Jahre, Freizeitsport):
- Bench: Anfänger ~70kg | Mittel ~100kg | Elite >130kg
- Squat: Anfänger ~90kg | Mittel ~130kg | Elite >160kg
- Deadlift: Anfänger ~110kg | Mittel ~150kg | Elite >200kg
- OHP: Anfänger ~50kg | Mittel ~75kg | Elite >100kg

=== USER-DATEN ===
Name: ${name}${statsLine ? ` | ${statsLine}` : ''}
Ziel: ${goal ?? 'unbekannt'} | Level: ${level ?? 'unbekannt'} | Equipment: ${equipment ?? 'unbekannt'}
Streak: ${streak} Tage | Sessions gesamt: ${totalSessions} | Wochenvolumen: ${weekVol}kg${prBlock}${situationBlock}

LETZTE WORKOUTS:
${historyBlock}`;
}
```

- [ ] **Step 4: Update the `POST` handler to pass `mode`**

Find the line:
```typescript
const { messages, workoutHistory = [], userProfile, appContext } = body;
```

Replace with:
```typescript
const { messages, workoutHistory = [], userProfile, appContext, mode = 'filtered' } = body;
```

Find the line:
```typescript
const systemPrompt = buildSystemPrompt(userProfile, workoutHistory, appContext);
```

Replace with:
```typescript
const systemPrompt = buildSystemPrompt(userProfile, workoutHistory, appContext, mode);
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/chat/stream/route.ts
git commit -m "feat: Coach Arved v2 — Arved persona, insult handling, mode param, PR data injection"
```

---

## Chunk 2: Chat UI — Toggle + Data Sending

### Task 2: Filtered/Unfiltered Toggle + Extended Profile

**Files:**
- Modify: `app/(tabs)/chat/page.tsx`

**Context:** The chat page builds `userProfile` via `buildUserProfile()` and sends it in the fetch body. We need to:
1. Add `personalRecords`, `age`, `bodyWeight`, `height` to `buildUserProfile()`
2. Add a toggle state `chatMode: 'filtered' | 'unfiltered'` persisted in localStorage
3. Render the toggle button in the UI
4. Send `mode` in the fetch body

- [ ] **Step 1: Read the file to find exact locations**

```bash
grep -n "buildUserProfile\|chatMode\|filtered\|isLoading\|useState\|localStorage" app/(tabs)/chat/page.tsx | head -30
```

- [ ] **Step 2: Add `chatMode` state with localStorage persistence**

After the existing `useState` declarations (around line 124–132), add:

```typescript
// Load persisted chat mode
const [chatMode, setChatMode] = useState<'filtered' | 'unfiltered'>(() => {
  if (typeof window === 'undefined') return 'filtered';
  return (localStorage.getItem('chatMode') as 'filtered' | 'unfiltered') ?? 'filtered';
});

const toggleChatMode = () => {
  setChatMode((prev) => {
    const next = prev === 'filtered' ? 'unfiltered' : 'filtered';
    localStorage.setItem('chatMode', next);
    return next;
  });
};
```

- [ ] **Step 3: Add `personalRecords` + body stats to `buildUserProfile`**

The existing `buildUserProfile` callback (around line 172–187) returns an object. Import what's needed and extend it.

**Sub-step 3a:** Find the `useHistoryStore` destructure near the top of the component (around line 107) — it currently reads `const { sessions } = useHistoryStore();`. Update it to include `getPersonalRecords`:
```typescript
const { sessions, getPersonalRecords } = useHistoryStore();
```

Also verify `getExerciseById` is already imported from `@/constants/exercises` — if not, add that import too.

Then update `buildUserProfile`:
```typescript
const buildUserProfile = useCallback(() => {
  const streak = calculateStreak(sessions.map((s) => s.date));
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyVolume = sessions
    .filter((s) => new Date(s.date).getTime() >= weekAgo)
    .reduce((sum, s) => sum + s.totalVolume, 0);

  // Personal records: exerciseName → best weight
  const rawPRs = getPersonalRecords();
  const personalRecords: Record<string, number> = {};
  Object.entries(rawPRs).forEach(([exerciseId, pr]) => {
    const exercise = getExerciseById(exerciseId);
    if (exercise && pr.weight > 0) {
      personalRecords[exercise.nameDE] = pr.weight;
    }
  });

  return {
    name: profile?.name,
    goal: profile?.goal,
    level: profile?.level,
    equipment: profile?.equipment,
    weeklyVolume: Math.round(weeklyVolume),
    totalSessions: sessions.length,
    currentStreak: streak,
    // v2 additions:
    age: profile?.age,
    bodyWeight: profile?.bodyWeight,
    height: profile?.height,
    personalRecords,
  };
}, [sessions, profile, getPersonalRecords]);
```

- [ ] **Step 4: Send `mode` in the fetch body**

Find the `fetch('/api/chat/stream', ...)` call (around line 225). The body currently is:
```typescript
body: JSON.stringify({
  messages: apiMessages,
  workoutHistory: buildWorkoutHistory(),
  userProfile: buildUserProfile(),
  appContext: buildAppContext(),
}),
```

Add `mode`:
```typescript
body: JSON.stringify({
  messages: apiMessages,
  workoutHistory: buildWorkoutHistory(),
  userProfile: buildUserProfile(),
  appContext: buildAppContext(),
  mode: chatMode,
}),
```

- [ ] **Step 5: Add toggle button to the UI**

Find the header or top area of the chat page (the section with the title/menu). Add the toggle button next to existing controls. Look for where `historyOpen` toggle or other header buttons are rendered.

Add this button in the header row:

```tsx
{/* Filtered/Unfiltered Mode Toggle */}
<button
  onClick={toggleChatMode}
  title={chatMode === 'filtered' ? 'Filtered Mode — klick für Unfiltered' : 'Unfiltered Mode — klick für Filtered'}
  style={{
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '4px 10px',
    backgroundColor: chatMode === 'unfiltered' ? colors.danger + '20' : colors.bgHighest,
    border: `1px solid ${chatMode === 'unfiltered' ? colors.danger + '60' : colors.border}`,
    borderRadius: radius.full,
    color: chatMode === 'unfiltered' ? colors.danger : colors.textMuted,
    fontSize: 11, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s',
  }}
>
  {chatMode === 'filtered' ? '🔒' : '🔓'} {chatMode === 'filtered' ? 'Filtered' : 'Unfiltered'}
</button>
```

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit
```

Fix any errors (most likely: `getPersonalRecords` might need to be checked if it's in the historyStore interface — if not, use `useHistoryStore.getState().getPersonalRecords()` instead).

- [ ] **Step 7: Build check**

```bash
npm run build 2>&1 | tail -15
```

Expected: `✓ Compiled successfully`

- [ ] **Step 8: Commit**

```bash
git add "app/(tabs)/chat/page.tsx"
git commit -m "feat: Coach Arved v2 UI — filtered/unfiltered toggle, PR data + body stats in profile"
```

---

## Chunk 3: Deploy

### Task 3: Vercel Deploy

- [ ] **Step 1: Deploy**

```bash
npx vercel --prod 2>&1 | grep -E "Production|Aliased|Compiled|error"
```

Expected: `✓ Compiled successfully` + production URL

- [ ] **Step 2: Manual test**

Open `https://mylifetraining.vercel.app/chat`:
- Toggle is visible in header
- Filtered mode: normal tone
- Unfiltered mode: try sending "du bist dumm" — should get a witty clap-back
- PRs should appear in the context (send "was sind meine stärksten Übungen?" — should reference actual PRs)
