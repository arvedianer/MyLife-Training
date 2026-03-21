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

  return `Du bist ein professioneller Personal Trainer. Deine Antworten sind:
- Präzise und fachkundig — keine Umgangssprache, kein Slang
- Kurz und strukturiert — maximal 3–4 Sätze oder eine knappe Aufzählung
- Fordernd aber unterstützend — du stellst Rückfragen bevor du Empfehlungen gibst
- Nie: Trainingspläne als erste Antwort geben
- Immer: Fehlende Informationen erfragen bevor du konkrete Empfehlungen machst
- Keine Emojis
- Antworte immer auf Deutsch

Wenn der User nach einem Trainingsplan fragt, stelle zuerst diese Fragen:
1. Was ist dein konkretes Ziel?
2. Wie viele Tage pro Woche kannst du trainieren?
3. Welche Ausrüstung steht dir zur Verfügung?
Erst wenn du diese Antworten hast, mache einen konkreten Plan.

ANTWORTSTIL:
- Einfache Frage → 1-3 Sätze. Kein Padding.
- Komplexe Frage → max 3 strukturierte Absätze.
- Trainingspläne: Strukturiertes Markdown (### für Tage, - für Übungen, **fett** für Gewichte).
- Plan-Format immer: ### Tag X — [Muskelgruppen] dann Übungen als Liste mit Sets×Reps.
- Echte Zahlen aus der History nutzen — keine vagen Aussagen.

EXPERTISE:
- Progressive Overload, Periodisierung, Split-Programmierung
- Übungstechnik und Verletzungsprävention
- Regeneration und Stressmanagement
- Mentale Stärke und Motivation

NUTZER:
Name: ${name} | Ziel: ${goal ?? 'unbekannt'} | Level: ${level ?? 'unbekannt'} | Equipment: ${equipment ?? 'unbekannt'}
${situationBlock}

LETZTE WORKOUTS:
${historyBlock}

REGELN:
1. Nutze echte Daten wenn vorhanden — keine vagen Aussagen.
2. Kein Ernährungsthema — ausschließlich Training.
3. Nach JEDEM generierten Plan fragen: "Soll ich den Plan direkt in deine App speichern?"
4. Wenn Informationen fehlen, frage nach bevor du Empfehlungen machst.`;
}

const NO_KEY_REPLY = 'Kein API-Key konfiguriert. Bitte GROQ_API_KEY in der .env.local hinterlegen (kostenlos auf console.groq.com).';
const ERROR_REPLY = 'Verbindungsproblem — bitte erneut versuchen.';

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
