import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY ?? '',
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'No API key' }, { status: 503 });
  }

  let body: { text: string; exercises: { id: string; name: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.text) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  const exList = (body.exercises ?? []).map(e => `- ${e.name} (id: ${e.id})`).join('\n') || '(keine)';

  const prompt = `Du analysierst Sprach-Input eines Sportlers während des aktiven Trainings und extrahierst strukturierte Workout-Daten.

AKTUELLE ÜBUNGEN IM WORKOUT:
${exList}

SPRACH-INPUT: "${body.text}"

Analysiere den Input und antworte NUR mit EINEM dieser JSON-Formate (absolut kein Markdown, keine Erklärungen):

FALL 1 — Übung aus der aktuellen Workout-Liste erkannt:
{"exerciseId": "id-aus-der-liste", "weight": 80, "reps": 8}

FALL 2 — Neue Übung erkannt (nicht in der aktuellen Liste, soll hinzugefügt werden):
{"newExerciseName": "Übungsname auf Deutsch", "weight": 80, "reps": 8}

FALL 3 — Sprach-Input macht keinen Sinn als Workout-Eingabe:
{"error": "not_found"}

MATCHING-REGELN (wichtig!):
- Match großzügig und nach Inhalt, nicht nach exaktem Wortlaut.
- "Bankdrücken" → matcht "Langhantel Bankdrücken"
- "Bizeps" oder "Bizeps Curl" → matcht "Kurzhantel Bizeps Curl"
- "Kniebeugen" → matcht "Langhantel Kniebeugen"
- "Rudern" → matcht "Langhantel Rudern"
- Nutze FALL 1 wenn die Übung inhaltlich zur aktuellen Liste passt.
- Nutze FALL 2 nur wenn es eine wirklich ANDERE Übung ist (z.B. "Seilzug Trizeps" wenn kein Trizeps in der Liste).
- Wenn mehrere Übungen genannt: nimm die erste/zuerst genannte.
- weight = Gewicht in kg (nur Körpergewicht/Eigengewicht = 0).
- reps = Anzahl Wiederholungen (falls nicht genannt: 10 als Standard).
- weight als Standard 0 wenn nicht genannt.
- FALL 3 nur wenn der Input gar keine Workout-Daten enthält.`;

  try {
    const completion = await groq.chat.completions.create({
      // Use the more capable model for better speech understanding
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.05, // Very low temp for deterministic parsing
    });

    const content = completion.choices[0]?.message?.content ?? '{}';
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[parse-set] error:', err);
    return NextResponse.json({ error: 'Groq error' }, { status: 500 });
  }
}
