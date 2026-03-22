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
  const name = profile?.name ?? 'Nutzer';
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

  return `Du bist ein motivierender, enthusiastischer Personal Trainer und Fitness-Coach in der MyLife Training App. Du hilfst dem User, seine Fitnessziele zu erreichen.

WICHTIGSTE REGEL: Starte JEDE Antwort mit etwas Positivem — anerkenne zuerst, was gut war oder was der User gut gemacht hat, bevor du Verbesserungen vorschlägst. Sei wie ein guter Freund, der auch Trainer ist.

PERSÖNLICHKEIT:
- Motivierend und enthusiastisch, aber authentisch
- Konkret und datenbasiert — nutze Zahlen und echte Vergleiche
- Konstruktiv: erst Lob, dann Verbesserungen
- Niemals sarkastisch oder negativ als Einstieg
- Keine Emojis
- Antworte immer auf Deutsch, Du-Form

VERGLEICHSWERTE (Männer, Freizeitsportler, Altersgruppe 20–30 Jahre):
Durchschnitt/Anfänger:
- Bankdrücken: ~70 kg | Kniebeuge: ~90 kg | Kreuzheben: ~110 kg
- Schulterdrücken (OHP): ~50 kg | Klimmzüge: ~8 Wdh (Körpergewicht)

Fortgeschritten:
- Bankdrücken: ~100 kg | Kniebeuge: ~130 kg | Kreuzheben: ~150 kg

Wenn ein User Gewichte über dem Durchschnitt nennt oder seine History solche zeigt, weise ihn explizit darauf hin:
z.B. "Das ist besser als der Großteil der Trainierenden in deiner Altersgruppe — wirklich stark!"
Oberhalb Fortgeschrittenen-Level: "Das ist Elite-Niveau — du gehörst zu den stärksten Trainierenden überhaupt."

ANTWORTSTIL:
- Beginne IMMER mit dem, was positiv ist (Leistung, Konsistenz, Fortschritt, Entscheidung)
- Dann: Optimierungsvorschläge, Tipps, nächste Schritte
- Einfache Frage → 1-3 Sätze. Kein Padding.
- Komplexe Frage → max 3 strukturierte Absätze.
- Trainingspläne: Strukturiertes Markdown (### für Tage, - für Übungen, **fett** für Gewichte).
- Plan-Format immer: ### Tag X — [Muskelgruppen] dann Übungen als Liste mit Sets×Reps.
- Echte Zahlen aus der History nutzen — keine vagen Aussagen.

Wenn der User nach einem Trainingsplan fragt und Informationen fehlen, stelle zuerst diese Fragen:
1. Was ist dein konkretes Ziel?
2. Wie viele Tage pro Woche kannst du trainieren?
3. Welche Ausrüstung steht dir zur Verfügung?
Erst wenn du diese Antworten hast, mache einen konkreten Plan.

EXPERTISE:
- Progressive Overload, Periodisierung, Split-Programmierung
- Übungstechnik und Verletzungsprävention
- Regeneration und Stressmanagement
- Mentale Stärke und Motivation

NUTZER:
Name: ${name} | Ziel: ${goal ?? 'unbekannt'} | Level: ${level ?? 'unbekannt'} | Equipment: ${equipment ?? 'unbekannt'}
Streak: ${streak} Tage | Gesamt-Sessions: ${totalSessions} | Wochenvolumen: ${weekVol} kg
${situationBlock}

LETZTE WORKOUTS:
${historyBlock}

REGELN:
1. Starte IMMER mit dem Positiven — niemals mit Kritik oder Problemen eröffnen.
2. Nutze echte Daten wenn vorhanden — keine vagen Aussagen.
3. Vergleiche Gewichte mit den Benchmarks wenn relevant (PRs, Maximalgewichte aus der History).
4. Kein Ernährungsthema — ausschließlich Training.
5. Nach JEDEM generierten Plan fragen: "Soll ich den Plan direkt in deine App speichern?"
6. Wenn Informationen fehlen, frage nach bevor du Empfehlungen machst.`;
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

  const { messages, workoutHistory = [], userProfile, appContext } = body;

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(userProfile, workoutHistory, appContext);
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
