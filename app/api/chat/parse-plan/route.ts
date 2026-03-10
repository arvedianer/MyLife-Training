import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY ?? '',
  baseURL: 'https://api.groq.com/openai/v1',
});

interface ParsedPlan {
  name: string;
  days: { name: string; exercises: string[] }[];
}

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'No API key' }, { status: 503 });
  }

  let body: { text: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.text) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }

  const prompt = `Extrahiere den Trainingsplan aus diesem Text und gib ihn als JSON zurück.

TEXT:
${body.text.slice(0, 3000)}

Antworte NUR mit diesem JSON (kein Markdown, kein Text):
{
  "name": "Name des Trainingsplans",
  "days": [
    {
      "name": "Tag-Name (z.B. Push, Pull, Legs, Oberkörper)",
      "exercises": ["Übung 1", "Übung 2", "Übung 3"]
    }
  ]
}

Regeln:
- name: kurzer, präziser Plan-Name (max 30 Zeichen)
- days: alle Trainingstage aus dem Plan (keine Ruhetage)
- exercises: nur Übungsnamen, keine Sets/Reps/Gewichte
- Falls kein klarer Plan erkennbar: {"name": "", "days": []}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.2,
    });

    const content = completion.choices[0]?.message?.content ?? '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ name: '', days: [] });
    }

    const parsed = JSON.parse(jsonMatch[0]) as ParsedPlan;
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[parse-plan] error:', err);
    return NextResponse.json({ error: 'Failed to parse plan' }, { status: 500 });
  }
}
