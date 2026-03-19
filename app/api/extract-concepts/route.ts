// app/api/extract-concepts/route.ts

import Anthropic from "@anthropic-ai/sdk";
import { ConceptData } from "@/types";

interface DebateMessage {
  name: string;
  role: string;
  text: string;
}

export const runtime = 'edge';

/** Extract the first complete JSON object from a string, stripping markdown fences first. */
function extractFirstJson(text: string): string {
  const cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '');
  const start = cleaned.indexOf('{');
  if (start === -1) throw new Error('No JSON found in response');
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (escape)          { escape = false; continue; }
    if (c === '\\' && inString) { escape = true; continue; }
    if (c === '"')       { inString = !inString; continue; }
    if (inString)        { continue; }
    if (c === '{')       { depth++; }
    else if (c === '}')  { if (--depth === 0) return cleaned.slice(start, i + 1); }
  }
  throw new Error('No complete JSON object found in response');
}

export async function POST(request: Request) {
  const { topic, messages, lang = 'en', count = 3, apiKey } = await request.json();
  if (!apiKey) return new Response("No API key provided. Add your Anthropic key in Settings.", { status: 401 });
  const anthropic = new Anthropic({ apiKey });

  if (!topic || !messages?.length) {
    return new Response("Missing topic or messages", { status: 400 });
  }

  const conceptCount: number = count === 2 ? 2 : 3;

  const langNote = lang === 'he'
    ? '\nIMPORTANT: Write all title, description, ux, and visual fields entirely in Hebrew (עברית).'
    : '';

  const fullTranscript = (messages as DebateMessage[])
    .filter(m => m.text.trim())
    .map(m => `${m.name} (${m.role}): ${m.text}`)
    .join("\n\n");
  // Keep prompt manageable — last ~6000 chars covers the most relevant discussion
  const transcript = fullTranscript.length > 6000
    ? '...' + fullTranscript.slice(-6000)
    : fullTranscript;

  const prompt = `You are a product strategist. Based on this debate about "${topic}", extract exactly ${conceptCount} distinct product directions that could be built.

Each direction must be genuinely different in purpose, UX, and audience — not just visual variations of the same idea.${langNote}

Debate transcript:
${transcript}

Return ONLY valid JSON in this exact shape (no markdown, no explanation):
{
  "A": {
    "id": "A",
    "title": "Short product name",
    "description": "2-3 sentences describing what this product is and who it's for.",
    "ux": "Key UX idea — how the user interacts with it.",
    "visual": "Key visual/layout idea — what it looks like."
  },
  "B": { "id": "B", ... }${conceptCount === 3 ? ',\n  "C": { "id": "C", ... }' : ''}
}`;

  const requiredIds = conceptCount === 2 ? (["A", "B"] as const) : (["A", "B", "C"] as const);
  let lastErr: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = response.content[0].type === "text" ? response.content[0].text : "";
      const concepts: Record<string, ConceptData> = JSON.parse(extractFirstJson(raw));

      for (const id of requiredIds) {
        if (!concepts[id]?.title) throw new Error(`Missing concept ${id}`);
      }

      return Response.json(concepts);

    } catch (err) {
      lastErr = err;
    }
  }

  return new Response(`Concept extraction failed: ${String(lastErr)}`, { status: 500 });
}
