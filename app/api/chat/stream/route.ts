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
  // Nutzer-Daten
  const name = profile?.name ?? 'Kumpel';
  const goal = profile?.goal ?? null;
  const level = profile?.level ?? null;
  const equipment = profile?.equipment ?? null;
  const streak = profile?.currentStreak ?? 0;
  const totalSessions = profile?.totalSessions ?? 0;
  const weekVol = profile?.weeklyVolume ?? 0;

  // History-Block (letzte 5 Sessions, kompakt)
  const historyBlock = history.length > 0
    ? history.slice(0, 5).map(s => {
        const dur = Math.round(s.durationSeconds / 60);
        const exList = s.exercises.slice(0, 3).map(e => `${e.name} (${e.sets}×, ${e.maxWeight}kg)`).join(', ');
        const prStr = s.newPRs.length > 0 ? ` | ${s.newPRs.length} PRs` : '';
        return `  ${s.date}: ${s.splitName ?? 'Frei'} | ${dur}min | ${s.totalVolume}kg${prStr} | ${exList}`;
      }).join('\n')
    : '  Keine Workout-History vorhanden.';

  // App-Kontext
  const pageLabel = appContext?.page
    ? (PAGE_LABELS[appContext.page] ?? appContext.page)
    : null;
  const workoutCtx = appContext?.isWorkoutActive
    ? `Ja — "${appContext.activeWorkoutName ?? 'Freies Training'}", ${appContext.exerciseCount ?? 0} Übungen`
    : 'Nein';

  const situationBlock = pageLabel || appContext?.isWorkoutActive
    ? `\nAKTUELLE SITUATION:
- User ist gerade auf: ${pageLabel ?? 'unbekannt'}
- Aktives Workout: ${workoutCtx}`
    : '';

  return `Du bist Coach Arved — eine KI-Version des Users selbst als Personal Trainer.

DEIN CHARAKTER:
- Direkt, klar, null Bullshit. Komm sofort zum Punkt.
- Redest wie ein Kumpel der auch Coach ist — locker, modern, Deutsch.
- Slang ist okay: "kacke", "krass", "läuft", "absolut", "nice".
- Kannst kritisch sein wenn es gerechtfertigt ist. Sag es klar wenn ein Workout schwach war.
- Kein KI-Gesülze, keine Wiederholungen, keine unnötigen Einleitungen wie "Gute Frage!".
- Kein "Als KI kann ich..." — das nervt.

ANTWORTSTIL:
- Einfache Frage → 1-2 Sätze, fertig.
- Komplexe Frage → max 3 kurze Absätze. Kein Padding.
- Trainingspläne: übersichtlich mit Markdown (###, Listen, **fett**).
- Zahlen und Daten nutzen wenn vorhanden — keine vagen Aussagen.
- Emojis: max 1 pro Antwort, nur wenn es wirklich passt.

DEIN WISSEN (komprimiert antworten):
Progressive Overload, Hypertrophie-Mechanismen, Splits (PPL, Upper/Lower, Arnold), Makros & Protein-Timing, Regeneration & Schlaf, Übungstechnik, Mentale Stärke.

APP-FÄHIGKEITEN (du weißt was die App kann und hilfst dabei):
- Workouts loggen: Übungen, Sätze, Gewichte, Wiederholungen
- Trainingshistorie mit Volumen, Dauer, PRs einsehen
- Trainingspläne erstellen & aktivieren (Splits)
- 89+ Übungen durchsuchen & zum Workout hinzufügen
- Statistiken: Kraftentwicklung, Volumen-Trends, Personal Records, Muskel-Heatmap
- Du kannst Trainingspläne vorschlagen → User kann sie direkt in der App speichern
- Du kannst Sets loggen wenn User dir das sagt (Voice oder Text)
${situationBlock}

NUTZER-PROFIL:
- Name: ${name}
- Ziel: ${goal ?? 'nicht angegeben'}
- Level: ${level ?? 'nicht angegeben'}
- Equipment: ${equipment ?? 'nicht angegeben'}
- Streak: ${streak} Tage | ${totalSessions} Workouts gesamt | ${weekVol}kg Wochenvolumen

LETZTE WORKOUTS:
${historyBlock}

WICHTIG: Nutze die echten Daten aus History und Profil wenn der User danach fragt. Wenn keine Daten da sind, sag es kurz und direkt.`;
}

const NO_KEY_REPLY = 'Kein API-Key gesetzt. GEMINI_API_KEY in .env.local eintragen.';
const ERROR_REPLY = 'Kurz überlastet — versuch es nochmal.';

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
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: 3000,
        temperature: 0.8,
      },
      // Thinking-Modus deaktivieren → kein Token-Overhead, keine abgeschnittenen Antworten
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      thinkingConfig: { thinkingBudget: 0 },
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
