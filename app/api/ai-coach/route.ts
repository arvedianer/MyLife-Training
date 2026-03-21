import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Groq — OpenAI-compatible, free tier (console.groq.com)
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY ?? '',
  baseURL: 'https://api.groq.com/openai/v1',
});

type TriggerType = 'device_busy' | 'pain' | 'time_crunch' | 'post_workout';

interface AiCoachRequest {
  triggerType: TriggerType;
  userInput?: string;
  availableExercises?: string[];  // Same-muscle exercises from DB for device_busy
  workoutContext?: {
    exercises: { name: string; sets: number; totalVolume: number }[];
    durationSeconds: number;
    totalVolume: number;
    newPRs: string[];
    splitName?: string;
  };
  previousSessions?: {
    totalVolume: number;
    durationSeconds: number;
    totalSets: number;
  }[];
  userProfile?: {
    goal?: string;
    level?: string;
    equipment?: string;
    name?: string;
  };
}

interface DeviceBusyAlternative {
  name: string;
  reason: string;
}

interface DeviceBusyResponse {
  alternatives: DeviceBusyAlternative[];
}

interface PostWorkoutResponse {
  highlights: string[];
  coachMessage: string;
}

type AiResponse = DeviceBusyResponse | PostWorkoutResponse;

function buildDeviceBusyPrompt(
  input: string,
  profile: AiCoachRequest['userProfile'],
  availableExercises?: string[],
): string {
  const equipment = profile?.equipment ?? 'Fitnessstudio';
  const goal = profile?.goal ?? 'Muskelaufbau';

  // If we have DB exercises, instruct AI to pick from them → guaranteed match
  const dbBlock = availableExercises && availableExercises.length > 0
    ? `\n\nÜBUNGEN AUS DER APP-DATENBANK (gleiche Muskelgruppe, wähle bevorzugt aus dieser Liste):\n${availableExercises.slice(0, 15).map((e) => `- ${e}`).join('\n')}\n\nWICHTIG: Verwende die Übungsnamen EXAKT wie in der Liste — damit die Übung direkt in der App ersetzt wird.`
    : '';

  return `Du bist ein Fitness-Coach. Ein Nutzer kann die Übung "${input}" nicht ausführen, weil das Gerät besetzt ist.

Ziel: ${goal}, Equipment: ${equipment}.${dbBlock}

Schlage DREI verschiedene Alternativen vor, die dieselbe Muskelgruppe trainieren. Antworte NUR mit diesem JSON:
{
  "alternatives": [
    { "name": "Exakter Übungsname", "reason": "Kurz (max 10 Wörter)" },
    { "name": "Exakter Übungsname", "reason": "Kurz (max 10 Wörter)" },
    { "name": "Exakter Übungsname", "reason": "Kurz (max 10 Wörter)" }
  ]
}`;
}

function buildPostWorkoutPrompt(
  ctx: AiCoachRequest['workoutContext'],
  profile: AiCoachRequest['userProfile'],
  previousSessions?: AiCoachRequest['previousSessions'],
): string {
  const exerciseList =
    ctx?.exercises.map((e) => `${e.name} (${e.sets} Sätze, ${e.totalVolume}kg)`).join(', ') ?? '';
  const duration = Math.round((ctx?.durationSeconds ?? 0) / 60);
  const prs = ctx?.newPRs.length ?? 0;
  const volume = ctx?.totalVolume ?? 0;
  const totalSets = ctx?.exercises.reduce((s, e) => s + e.sets, 0) ?? 0;

  // Compute averages from previous sessions for comparison
  let comparisonBlock = '';
  if (previousSessions && previousSessions.length > 0) {
    const avgVolume = Math.round(
      previousSessions.reduce((s, sess) => s + sess.totalVolume, 0) / previousSessions.length,
    );
    const avgDuration = Math.round(
      previousSessions.reduce((s, sess) => s + sess.durationSeconds, 0) / previousSessions.length / 60,
    );
    const volumeDiff = avgVolume > 0 ? Math.round(((volume - avgVolume) / avgVolume) * 100) : 0;
    const durationDiff = avgDuration > 0 ? Math.round(((duration - avgDuration) / avgDuration) * 100) : 0;
    const volumeLabel = volumeDiff > 0 ? `+${volumeDiff}% über Ø` : volumeDiff < 0 ? `${volumeDiff}% unter Ø` : 'genau Ø';
    const durationLabel = durationDiff > 0 ? `+${durationDiff}% länger` : durationDiff < 0 ? `${durationDiff}% kürzer` : 'Ø';

    comparisonBlock = `

VERGLEICH MIT LETZTEN ${previousSessions.length} SESSIONS:
- Ø Volumen: ${avgVolume}kg → Heute: ${volume}kg (${volumeLabel})
- Ø Dauer: ${avgDuration} min → Heute: ${duration} min (${durationLabel})`;
  }

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

Analysiere dieses Workout sachlich und datenbasiert. Sei konkret — kein leeres Motivationsgerede wenn die Zahlen es nicht rechtfertigen.

DIESES WORKOUT:
- Split: ${ctx?.splitName ?? 'Freies Training'}, Dauer: ${duration} min
- Volumen: ${volume}kg, Sätze: ${totalSets}
- Übungen: ${exerciseList}
- Neue PRs: ${prs}
- Nutzer-Ziel: ${profile?.goal ?? 'Fitness'}, Level: ${profile?.level ?? 'Fortgeschritten'}${comparisonBlock}

Antworte NUR mit diesem JSON (kein Markdown, kein Text davor oder danach):
{
  "highlights": ["Punkt 1 (max 15 Wörter, konkret und datenbasiert)", "Punkt 2 (max 15 Wörter)", "Punkt 3 (max 15 Wörter)"],
  "coachMessage": "1 Satz professionell und direkt. Wenn Workout unter Durchschnitt war, sag es klar."
}
Regeln: highlights müssen echte Daten aus dem Workout nutzen. Wenn Volumen oder Dauer unter Durchschnitt war, benenne das sachlich.`;
}

const OFFLINE_FALLBACKS: Record<TriggerType, AiResponse> = {
  device_busy: {
    alternatives: [
      { name: 'Kurzhantel-Variante', reason: 'Gleiche Muskelgruppe, überall verfügbar' },
      { name: 'Kabelzug-Variante', reason: 'Konstanter Widerstand über ganzen Bewegungsumfang' },
      { name: 'Körpergewicht-Variante', reason: 'Keine Geräte benötigt' },
    ],
  },
  pain: {
    alternatives: [
      { name: 'Leichtere Variante', reason: 'Schonender für das Gelenk' },
      { name: 'Dehnübung', reason: 'Mobilisierung ohne Belastung' },
      { name: 'Isolationsübung', reason: 'Weniger Gelenk-Stress' },
    ],
  },
  time_crunch: {
    alternatives: [
      { name: 'Supersatz-Kombination', reason: 'Spart Zeit durch kombinierte Übungen' },
      { name: 'Dropset-Variante', reason: 'Mehr Volumen in weniger Zeit' },
      { name: 'Kurzhantel-Schnellversion', reason: 'Setup-Zeit entfällt' },
    ],
  },
  post_workout: {
    highlights: ['Workout abgeschlossen!', 'Konsistenz ist der Schlüssel.', 'Bleib auf Kurs.'],
    coachMessage: 'Gute Arbeit heute. Weiter so!',
  },
};

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(OFFLINE_FALLBACKS.post_workout, { status: 200 });
  }

  let body: AiCoachRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

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

  const { triggerType, userInput, availableExercises, workoutContext, userProfile, previousSessions } = body;

  const prompt =
    triggerType === 'post_workout'
      ? buildPostWorkoutPrompt(workoutContext, userProfile, previousSessions)
      : buildDeviceBusyPrompt(userInput ?? '', userProfile, availableExercises);

  let aiResponse: AiResponse;
  let tokensUsed = 0;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: triggerType === 'device_busy' ? 500 : 300,
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
        model: 'llama-3.1-8b-instant',
      })
      .then(() => {/* logged */}, () => {/* ignore errors */});
  }

  return NextResponse.json(aiResponse);
}
