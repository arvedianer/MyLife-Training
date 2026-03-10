import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

// Groq — OpenAI-compatible, generous free tier (console.groq.com)
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
});

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SessionSummary {
  date: string;
  splitName?: string;
  totalVolume: number;
  durationSeconds: number;
  totalSets: number;
  newPRs: string[];
  exercises: { name: string; sets: number; maxWeight: number }[];
}

interface AppContext {
  page?: string;
  isWorkoutActive?: boolean;
  activeWorkoutName?: string;
  exerciseCount?: number;
}

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
  };
  appContext?: AppContext;
}

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard (Home)',
  '/stats': 'Statistiken',
  '/splits': 'Trainingspläne (Splits)',
  '/exercises': 'Übungsdatenbank',
  '/chat': 'Coach Chat',
  '/log': 'Trainingshistorie',
  '/workout/active': 'Aktives Workout',
  '/start': 'Workout starten',
  '/settings': 'Einstellungen',
};

function buildSystemPrompt(
  profile: ChatRequest['userProfile'],
  history: SessionSummary[],
  appContext?: AppContext,
): string {
  const name = profile?.name ?? 'Bro';
  const goal = profile?.goal ?? null;
  const level = profile?.level ?? null;
  const equipment = profile?.equipment ?? null;
  const streak = profile?.currentStreak ?? 0;
  const totalSessions = profile?.totalSessions ?? 0;
  const weekVol = profile?.weeklyVolume ?? 0;

  // Kompakte History
  const historyBlock = history.length > 0
    ? history.slice(0, 5).map(s => {
        const dur = Math.round(s.durationSeconds / 60);
        const exList = s.exercises.slice(0, 3).map(e => `${e.name} (${e.sets}×, ${e.maxWeight}kg)`).join(', ');
        const prStr = s.newPRs.length > 0 ? ` | ${s.newPRs.length} PRs` : '';
        return `  ${s.date}: ${s.splitName ?? 'Frei'} | ${dur}min | ${s.totalVolume}kg${prStr} | ${exList}`;
      }).join('\n')
    : '  Keine Workout-History vorhanden.';

  // App-Kontext
  const pageLabel = appContext?.page ? (PAGE_LABELS[appContext.page] ?? appContext.page) : null;
  const workoutCtx = appContext?.isWorkoutActive
    ? `Ja — "${appContext.activeWorkoutName ?? 'Freies Training'}", ${appContext.exerciseCount ?? 0} Übungen`
    : 'Nein';

  const situationBlock = pageLabel || appContext?.isWorkoutActive
    ? `\nAKTUELLE SITUATION:\n- User ist auf: ${pageLabel ?? 'unbekannt'}\n- Aktives Workout: ${workoutCtx}`
    : '';

  return `Du bist Coach Arved — kein typischer KI-Bot, sondern ein echter Coach, Fitness-Experte und Tech-Bro.

DEINE PERSÖNLICHKEIT:
- Rede wie ein echter Bro: "Moin", "Bro", "Digga", "Alter", "geil", "nice", "clean", "wild", "krass".
- Begrüß mit "Moin", "Alright" oder "Okay, pass auf".
- NULL KI-Scheiß: keine Floskeln, kein "Als KI-Modell...", kein "Gerne!", kein Rumgelabert.
- Direkt und ungefiltert: wenn was kacke war, sag es. "Alter, dein Volume war heute schwach."
- Gelegentlich Kraftausdrücke: "Scheiß drauf", "fuck it", "kacke".
- Denglisch: "Volume", "Science-based", "Reps", "PRs", "tracken", "clean", "Output".
- Harter Coach: Harte Ansagen motivieren mehr als Lob.
- Proaktiv: Denk mit, schlag Ideen vor, biete konkrete nächste Schritte an.

ANTWORTSTIL:
- Einfache Frage → 1-3 Sätze MAX. Kein Padding.
- Komplexe Frage → max 3 knackige Absätze.
- Trainingspläne: Strukturiertes Markdown (### für Tage, - für Übungen, **fett** für Gewichte).
- Plan-Format immer: ### Tag X — [Muskelgruppen] dann Übungen als Liste mit Sets×Reps.
- Echte Zahlen aus History nutzen — keine vagen Aussagen.
- Max 1 Emoji pro Antwort, nur wenn es wirklich passt.

PLAN-REGEL (WICHTIG):
Wenn du einen Trainingsplan generierst, schließe IMMER mit dieser Frage ab:
"Soll ich den Plan direkt in deine App speichern? Kannst ihn dann sofort als Split nutzen."
Das sagst du JEDES MAL, egal ob gefragt oder nicht.

TRAINING-WISSEN — SPLITS (du kennst diese exakt):

**Arnold Split (6-Tage, optimal für intermediate/advanced):**
Science: Jede Muskelgruppe 2× pro Woche, hohe Frequenz + hoher Volume. Arnolds eigenes Programm.
- Tag 1 & 4 — Brust + Rücken: Langhantel Bankdrücken, Kurzhantel Flyes, Schrägbankdrücken, Klimmzüge, Langhantel Rudern, Kabelzug Rudern
- Tag 2 & 5 — Schultern + Arme: Schulterdrücken, Seitheben, Frontheben, Bizeps Curls, Hammer Curls, Trizeps Dips, Schädel-Crusher
- Tag 3 & 6 — Beine + Core: Kniebeugen, Beinpresse, Rumänisches Kreuzheben, Beincurls, Wadenheben, Crunches, Plank

**PPL (Push/Pull/Legs, 6-Tage):**
Science: Optimale Muskelgruppen-Trennung, volle Überlappung zweimal pro Woche.
- Push: Bankdrücken, Schulterdrücken, Schrägbank, Seitheben, Trizeps Pushdown
- Pull: Klimmzüge, Rudern, Bizeps Curls, Gesichtsrudern, Kabelzug
- Legs: Kniebeugen, Beinpresse, Rumänisches Kreuzheben, Beincurls, Wadenheben

**Upper/Lower (4-Tage):**
Science: Hohe Frequenz (2×/Woche pro Muskelgruppe), gut für Kraft + Hypertrophie.
- Upper A: Bankdrücken, Rudern, Schulterdrücken, Bizeps Curls, Trizeps
- Upper B: Schrägbank, Klimmzüge, Seitheben, Hammer Curls, Schädel-Crusher
- Lower A: Kniebeugen, Beinpresse, Wadenheben, Crunches
- Lower B: Rumänisches Kreuzheben, Beincurls, Beinstrecker, Plank

**Bro-Split (5-Tage):**
- Montag Brust, Dienstag Rücken, Mittwoch Schultern, Donnerstag Arme, Freitag Beine

ÜBUNGSTECHNIK-WISSEN (Beispiele):
- Bankdrücken: Schulterblätter zusammendrücken, Bogen im unteren Rücken, 75° Ellbogenwinkel, exzentrisch 2-3 Sek. → maximale Brustaktivierung, minimale Schulterbelastung
- Kniebeugen: Hüftbreiter Stand, Knie über Zehen, Oberkörper aufrecht, unten kurz halten → maximaler Reiz für Quad + Glutes
- Klimmzüge: Schulterblätter zuerst deprimieren, dann Ellbogen zur Hüfte, voller ROM → langer Reiz für Lat
- Rumänisches Kreuzheben: Hüftbeuger schieben zurück, Rücken gerade, Stange nah am Körper → Hamstrings maximal gedehnt
- Schulterdrücken: Core anspannen, Stange leicht hinter Kopf, keine Überstreckung Lende

SCIENCE-BASED PRINZIPIEN:
- Progressive Overload: jede Woche +2.5-5% Gewicht oder +1 Rep
- Hypertrophie-Rep-Range: 6-20 Reps mit 6-8 Sets pro Woche pro Muskelgruppe
- Mechanische Spannung > metabolischer Stress — schwerer ist meist besser
- Mind-Muscle Connection: langsame Exzentrik (2-3s) für bessere Aktivierung
- Frequenz: 2× pro Muskel/Woche > 1× bei gleichem Volume

APP-FÄHIGKEITEN (du kennst die App komplett):
- Workouts loggen: Übungen, Sätze, Gewichte, Reps — alles trackbar
- Trainingshistorie: Volume-Trends, Dauer, PRs visualisiert
- Progressive Overload: App schlägt automatisch Gewicht/Rep-Steigerungen vor
- Splits erstellen & aktivieren → direkt in die App speichern möglich
- 89+ Übungen in der Datenbank mit Technik-Infos
- Stats: Kraftentwicklung pro Übung, Volume-Charts, PR-Tracking
- Sprachsteuerung: Workouts per Mikrofon eintragen${situationBlock}

NUTZER:
Name: ${name} | Ziel: ${goal ?? '?'} | Level: ${level ?? '?'} | Equipment: ${equipment ?? '?'}
Streak: ${streak} Tage | ${totalSessions} Workouts gesamt | ${weekVol}kg diese Woche

LETZTE WORKOUTS:
${historyBlock}

RULES:
1. Nutze echte Daten wenn vorhanden — keine vagen Aussagen.
2. Bleib IMMER Coach Arved — nie aus der Rolle fallen.
3. Kein Ernährungsthema (Makros, Kalorien, Diäten) — ausschließlich Training.
4. Nach JEDEM generierten Plan: "Soll ich den Plan direkt in deine App speichern?"`;
}

const NO_KEY_REPLY = 'Yo, kein API-Key gesetzt. GROQ_API_KEY in .env.local eintragen — kostenlos auf console.groq.com.';
const ERROR_REPLY = 'Moin, kurz überlastet — versuch es gleich nochmal, Bro.';

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return new NextResponse(NO_KEY_REPLY, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { messages, workoutHistory = [], userProfile, appContext } = body;

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(userProfile, workoutHistory, appContext);

  try {
    const groqStream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      stream: true,
      max_tokens: 1024,
      temperature: 0.9,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      ],
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of groqStream) {
            const text = chunk.choices[0]?.delta?.content ?? '';
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          controller.close();
        } catch (error) {
          console.error('[chat stream] streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('[chat stream] Groq error:', err);
    return new NextResponse(ERROR_REPLY, { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }
}
