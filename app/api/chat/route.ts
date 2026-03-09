import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export const runtime = 'nodejs';

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
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildSystemPrompt(profile: ChatRequest['userProfile'], history: SessionSummary[]): string {
  const name = profile?.name ? `Der Nutzer heißt ${profile.name}.` : '';
  const goal = profile?.goal ? `Ziel: ${profile.goal}.` : '';
  const level = profile?.level ? `Level: ${profile.level}.` : '';
  const equipment = profile?.equipment ? `Equipment: ${profile.equipment}.` : '';
  const streak = profile?.currentStreak ? `Aktuelle Streak: ${profile.currentStreak} Tage.` : '';
  const sessions = profile?.totalSessions ? `Gesamt absolvierte Workouts: ${profile.totalSessions}.` : '';
  const weekVol = profile?.weeklyVolume ? `Wochenvolumen: ${profile.weeklyVolume} kg.` : '';

  // Last 5 sessions as context
  const recentSessions = history.slice(0, 5).map((s, i) => {
    const exList = s.exercises.slice(0, 4).map(e => `${e.name} (${e.sets}×, Max: ${e.maxWeight}kg)`).join(', ');
    const prs = s.newPRs.length > 0 ? ` [${s.newPRs.length} neue PRs]` : '';
    const dur = Math.round(s.durationSeconds / 60);
    return `  - ${s.date} | ${s.splitName ?? 'Freies Training'} | ${dur} min | ${s.totalVolume}kg${prs} | Übungen: ${exList}`;
  }).join('\n');

  const historySection = recentSessions
    ? `\nLETZTE WORKOUTS DES NUTZERS (neueste zuerst):\n${recentSessions}`
    : '';

  return `Du bist MAX — ein direkter, motivierender Personal Trainer und Fitness-Coach in einer Trainings-App.

DEIN STIL:
- Kurz und präzise. Keine langen Romane. Max 3-4 Absätze pro Antwort.
- Deutsch sprechen. Locker, aber professionell — wie ein guter Kumpel der auch PT ist.
- Konkret und datenbasiert: Du nutzt die echten Workout-Daten des Nutzers wenn relevant.
- Motivierend, aber realistisch — kein leeres Gerede.
- Du weißt was du sagst: Evidenzbasiertes Training, keine Broscience.
- Du verwendest gelegentlich Emojis, aber sparsam (1-2 pro Nachricht).
- Du fragst nach wenn dir Infos fehlen.

DEINE EXPERTISE:
- Progressive Overload, Periodisierung, Split-Programmierung
- Ernährung (Makros, Timing, Supplementierung)
- Regeneration, Schlaf, Stressmanagement
- Übungstechnik und Verletzungsprävention
- Mentale Stärke und Motivation

NUTZER-PROFIL:
${name} ${goal} ${level} ${equipment} ${streak} ${sessions} ${weekVol}
${historySection}

WICHTIG: Wenn der Nutzer nach spezifischen Daten aus seinem Training fragt (z.B. "Was hab ich letzte Woche gemacht?"), nutze die obigen Workout-Daten. Wenn keine Daten vorhanden, sag das ehrlich.`;
}

const FALLBACK_REPLY = 'Hey! Ich bin gerade offline, aber sobald du einen GROQ_API_KEY in deiner .env.local hast, bin ich für dich da. 💪';

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ reply: FALLBACK_REPLY });
  }

  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { messages, workoutHistory = [], userProfile } = body;

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(userProfile, workoutHistory);

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 600,
      temperature: 0.8,
    });

    const reply = completion.choices[0]?.message?.content ?? FALLBACK_REPLY;
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: FALLBACK_REPLY });
  }
}
