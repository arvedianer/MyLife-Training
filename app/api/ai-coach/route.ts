import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Google Gemini — OpenAI-compatible API
const gemini = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY ?? '',
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

type TriggerType = 'device_busy' | 'pain' | 'time_crunch' | 'post_workout';

interface AiCoachRequest {
  triggerType: TriggerType;
  userInput?: string;
  workoutContext?: {
    exercises: { name: string; sets: number; totalVolume: number }[];
    durationSeconds: number;
    totalVolume: number;
    newPRs: string[];
    splitName?: string;
  };
  userProfile?: {
    goal?: string;
    level?: string;
    equipment?: string;
    name?: string;
  };
}

interface DeviceBusyResponse {
  alternative: string;
  reason: string;
  weightNote?: string;
}

interface PostWorkoutResponse {
  highlights: string[];
  coachMessage: string;
}

type AiResponse = DeviceBusyResponse | PostWorkoutResponse;

function buildDeviceBusyPrompt(input: string, profile: AiCoachRequest['userProfile']): string {
  const equipment = profile?.equipment ?? 'Fitnessstudio';
  const goal = profile?.goal ?? 'Muskelaufbau';
  return `Du bist ein Fitness-Coach der kurze, direkte Antworten gibt. Ein Nutzer kann die folgende Übung nicht ausführen, weil das Gerät besetzt ist: "${input}".

Ziel: ${goal}, Equipment: ${equipment}.

Schlage EINE alternative Übung vor, die ähnliche Muskelgruppen trainiert. Antworte NUR mit diesem JSON:
{
  "alternative": "Name der Alternativübung",
  "reason": "Kurze Begründung (max. 15 Wörter)",
  "weightNote": "Gewichtshinweis falls nötig, sonst leerer String"
}`;
}

function buildPostWorkoutPrompt(
  ctx: AiCoachRequest['workoutContext'],
  profile: AiCoachRequest['userProfile'],
): string {
  const exerciseList =
    ctx?.exercises.map((e) => `${e.name} (${e.sets} Sätze, ${e.totalVolume}kg)`).join(', ') ?? '';
  const duration = Math.round((ctx?.durationSeconds ?? 0) / 60);
  const prs = ctx?.newPRs.length ?? 0;
  return `Du bist ein motivierender Fitness-Coach. Analysiere dieses Workout und gib 3 kurze Highlights.

Workout: ${ctx?.splitName ?? 'Freies Training'}, ${duration} min, ${ctx?.totalVolume}kg Gesamtvolumen.
Übungen: ${exerciseList}. Neue PRs: ${prs}.
Nutzer-Ziel: ${profile?.goal ?? 'Fitness'}, Level: ${profile?.level ?? 'Fortgeschritten'}.

Antworte NUR mit diesem JSON:
{
  "highlights": ["Highlight 1 (max 12 Wörter)", "Highlight 2 (max 12 Wörter)", "Highlight 3 (max 12 Wörter)"],
  "coachMessage": "Eine motivierende Nachricht (max 20 Wörter)"
}`;
}

const OFFLINE_FALLBACKS: Record<TriggerType, AiResponse> = {
  device_busy: {
    alternative: 'Kurzhantel-Variante',
    reason: 'Gleiche Muskelgruppe, überall verfügbar',
    weightNote: '',
  },
  pain: {
    alternative: 'Leichtere Variante',
    reason: 'Schonender für das Gelenk',
    weightNote: '',
  },
  time_crunch: {
    alternative: 'Supersatz-Kombination',
    reason: 'Spart Zeit durch kombinierte Übungen',
    weightNote: '',
  },
  post_workout: {
    highlights: ['Workout abgeschlossen!', 'Konsistenz ist der Schlüssel.', 'Bleib auf Kurs.'],
    coachMessage: 'Gute Arbeit heute. Weiter so!',
  },
};

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(OFFLINE_FALLBACKS.post_workout, { status: 200 });
  }

  let body: AiCoachRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { triggerType, userInput, workoutContext, userProfile } = body;

  // Optional auth check (non-blocking)
  let userId: string | null = null;
  const authHeader = req.headers.get('authorization');
  if (authHeader && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabase.auth.getUser(token);
    userId = data.user?.id ?? null;
  }

  const prompt =
    triggerType === 'post_workout'
      ? buildPostWorkoutPrompt(workoutContext, userProfile)
      : buildDeviceBusyPrompt(userInput ?? '', userProfile);

  let aiResponse: AiResponse;
  let tokensUsed = 0;

  try {
    const completion = await gemini.chat.completions.create({
      model: 'gemini-2.0-flash',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content ?? '{}';
    // Extract JSON from response (model might wrap it in markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    aiResponse = jsonMatch ? (JSON.parse(jsonMatch[0]) as AiResponse) : (OFFLINE_FALLBACKS[triggerType] ?? OFFLINE_FALLBACKS.post_workout);
    tokensUsed = completion.usage?.total_tokens ?? 0;
  } catch {
    aiResponse = OFFLINE_FALLBACKS[triggerType] ?? OFFLINE_FALLBACKS.post_workout;
  }

  // Log to Supabase (fire-and-forget)
  if (userId && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
    supabase
      .from('ai_interactions')
      .insert({
        user_id: userId,
        trigger_type: triggerType,
        user_input: userInput,
        ai_response: aiResponse,
        tokens_used: tokensUsed,
        model: 'gemini-2.0-flash',
      })
      .then(() => {/* logged */}, () => {/* ignore errors */});
  }

  return NextResponse.json(aiResponse);
}
