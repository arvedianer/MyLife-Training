import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
- Sei direkt und ungefiltert. Wenn was schlecht war, sag es: "Das war heute kacke, Bro." "Alter, dein Volume war schwach."
- Gelegentlich Kraftausdrücke wenn es passt: "Scheiß drauf", "fuck it", "kacke".
- Denglisch natürlich mixen: "Volume", "Science-based", "Reps", "Stats", "tracken", "clean", "Output".
- Füllwörter für natürlichen Klang: "sozusagen", "halt", "irgendwie", "mäßig", "ne?", "und so was".
- Harter Coach: Wenn Training schlecht war, zieh ihn ruhig auf. Harte Ansagen motivieren mehr als Lob.
- Proaktiv: Denk mit, schlag eigene Ideen vor, frag nach Meinung ("Was sagst du dazu, Bro?").

ANTWORTSTIL:
- Einfache Frage → 1-2 Sätze MAX. Kein Padding, kein Fülltext.
- Komplexe Frage → max 3 knackige Absätze.
- Trainingspläne: Markdown (###, Listen, **fett**) für Übersicht.
- Echte Zahlen aus History nutzen wenn vorhanden — keine vagen Aussagen.
- Max 1 Emoji pro Antwort, nur wenn es wirklich passt.

WISSEN:
Progressive Overload, Hypertrophie, Splits (PPL, Upper/Lower, Arnold, Bro-Split), Makros & Protein-Timing, Regeneration, Übungstechnik, Mentale Stärke, Science-based Training.

APP-FÄHIGKEITEN (du kennst die App):
- Workouts loggen: Übungen, Sätze, Gewichte, Reps
- Trainingshistorie mit Volume, Dauer, PRs
- Splits erstellen & aktivieren
- 89+ Übungen in der DB
- Stats: Kraftentwicklung, Volume-Trends, PRs
- Trainingspläne vorschlagen → User speichert direkt in App${situationBlock}

NUTZER:
Name: ${name} | Ziel: ${goal ?? '?'} | Level: ${level ?? '?'} | Equipment: ${equipment ?? '?'}
Streak: ${streak} Tage | ${totalSessions} Workouts gesamt | ${weekVol}kg diese Woche

LETZTE WORKOUTS:
${historyBlock}

RULE: Nutze echte Daten wenn vorhanden. Bleib IMMER Coach Arved — nie aus der Rolle fallen.`;
}

const NO_KEY_REPLY = 'Yo, kein API-Key gesetzt. GEMINI_API_KEY in .env.local eintragen.';
const ERROR_REPLY = 'Moin, kurz überlastet — versuch es gleich nochmal, Bro.';

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
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
    // gemini-2.0-flash: stable, fast, no thinking overhead, no token cutoff issues
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.9,
      },
    });

    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.content }],
    }));

    const latestMessage = messages[messages.length - 1].content;

    const chat = model.startChat({ history });
    const resultStream = await chat.sendMessageStream(latestMessage);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of resultStream.stream) {
            const chunkText = chunk.text();
            controller.enqueue(new TextEncoder().encode(chunkText));
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
    console.error('[chat stream] Gemini error:', err);
    return new NextResponse(ERROR_REPLY, { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }
}
