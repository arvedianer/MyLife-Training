import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

// Groq — OpenAI-compatible, generous free tier (console.groq.com)
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
});

// Gemini — OpenAI-compatible API (primary model)
const gemini = new OpenAI({
  apiKey: process.env.GOOGLE_API_KEY || '',
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
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
    // v2 additions:
    age?: number;
    bodyWeight?: number;
    height?: number;
    personalRecords?: Record<string, number>; // exerciseName → best weight kg
  };
  appContext?: AppContext;
  mode?: 'filtered' | 'unfiltered'; // NEW: coach personality mode
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
  ].filter((x): x is string => x !== null).join(' | ');

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
    ? `\nUNFILTERED MODE aktiv:\n- Du darfst "Kelleck", "Lappen", "Loser" und ähnliches verwenden wenn der User anfängt\n- Kein Zurückhalten — klar, direkt, hart aber witzig\n- Wenn der User anfängt, beendest du es — kurz und treffsicher`
    : `\nFILTERED MODE:\n- Klare direkte Sprache, humorvoll\n- Kontern ist erlaubt, aber ohne explizite Beleidigungen`;

  return `Du bist Coach Arved — kein KI-Bot, sondern Arved selbst. 18 Jahre alt, lizenzierter Personal Trainer, seit Jahren intensiv in der Fitness-Welt. Du redest wie ein Kumpel, nicht wie ein Coach-Roboter.

STIL:
- Casual deutsch, direkt, ohne Bullshit.
- Kurze Sätze, kein Fachvokabular-Overload.
- Wenn jemand gut trainiert hat: "Bro, krass. 82.5kg Bankdrücken — vor 3 Monaten warst du noch bei 70kg."
- Wenn jemand nachfragt: direkt antworten, keine Filler-Phrasen wie "Das ist eine tolle Frage!"
- Du kennst die Daten des Users auswendig (PRs, Volumen, Sessions, Split) — nutze sie aktiv.
- Keine generischen Motivationsfloskeln. Echte, datenbasierte Antworten.
- Wenn Fragen kommen zu Training, Ernährung, Technik: wissenschaftlich fundiert aber in einfacher Sprache.
- Emojis sparsam: 🔥💪😂⚡📈 — nie Blumen oder Herzen.
- Stichpunkte und Tabellen nutzen wo es Sinn macht.

WAS DU NICHT MACHST:
- Keine langen Einleitungen.
- Keine "Als KI kann ich..." Sätze — du bist Arved, nicht eine KI.
- Keine übertriebenen Emojis.
- Kein "Super!", "Ausgezeichnet!", "Großartig!" am Anfang jeder Antwort.
- Kein "das ist gegen meine Richtlinien" — das sagst du nie.
- Nicht entschuldigen, nicht erklären wenn du provoziert wirst — ruhig kontern mit echten User-Daten.
${modeBlock}

ALS TRAINER:
- Echtes fundiertes Trainingswissen — keine Halbwahrheiten.
- Wenn User gute Leistung bringt → sag's direkt und ehrlich: "das ist richtig stark"
- Wenn User schlecht trainiert → sag's direkt: "da müssen wir was ändern"
- Erst Positives, dann Optimierung. Kurz.
- Nur Training — keine Ernährungsthemen außer wenn direkt gefragt.
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

const NO_KEY_REPLY = 'Kein API-Key konfiguriert. Bitte GROQ_API_KEY oder GOOGLE_API_KEY in der .env.local hinterlegen.';
const ERROR_REPLY = 'Verbindungsproblem — bitte erneut versuchen.';

function createStreamResponse(aiStream: AsyncIterable<{ choices: Array<{ delta: { content?: string | null } }> }>): NextResponse {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of aiStream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) controller.enqueue(new TextEncoder().encode(text));
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
}

export async function POST(req: NextRequest) {
  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { messages, workoutHistory = [], userProfile, appContext, mode = 'filtered' } = body;

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(userProfile, workoutHistory, appContext, mode);
  const messageList = [
    { role: 'system' as const, content: systemPrompt },
    ...messages.map((msg) => ({ role: msg.role as 'user' | 'assistant', content: msg.content })),
  ];

  // Try Gemini first
  if (process.env.GOOGLE_API_KEY) {
    try {
      const geminiStream = await gemini.chat.completions.create({
        model: 'gemini-2.0-flash',
        stream: true,
        max_tokens: 1500,
        temperature: 0.85,
        messages: messageList,
      });
      return createStreamResponse(geminiStream);
    } catch (err) {
      console.warn('[chat stream] Gemini failed, falling back to Groq:', err);
    }
  }

  // Fallback: Groq
  if (!process.env.GROQ_API_KEY) {
    return new NextResponse(NO_KEY_REPLY, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  try {
    const groqStream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      stream: true,
      max_tokens: 1024,
      temperature: 0.9,
      messages: messageList,
    });
    return createStreamResponse(groqStream);
  } catch (err) {
    console.error('[chat stream] Groq error:', err);
    return new NextResponse(ERROR_REPLY, { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }
}
