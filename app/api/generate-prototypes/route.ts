// app/api/generate-prototypes/route.ts

import Anthropic from "@anthropic-ai/sdk";
import { ConceptData } from "@/types";

export const runtime = 'edge';

const SPEC_PROMPT = (concept: ConceptData, topic: string) => `\
You are a product spec writer. Extract a FINAL PRODUCT SPEC for this product:

Product name: ${concept.title}
What it is: ${concept.description}
UX direction: ${concept.ux}
Visual/layout: ${concept.visual}
Topic area: ${topic}

Output the spec in this exact format:

SCREENS:
- [list every screen/page]

INTERACTIVE ELEMENTS:
- [list every button, form, toggle, nav link, modal, etc.]

USER ACTIONS & OUTCOMES:
- [action] → [what changes in the UI]

MISSING FLOWS TO COVER:
- [any flows that must be present for the product to feel complete]

Be exhaustive. This spec will be used to generate a fully working HTML frontend.`;

const PROMPT = (concept: ConceptData, topic: string, spec: string, langNote: string) => `\
You are building a complete, self-contained HTML frontend. Use this product spec:

${spec}

Product context:
- Name: ${concept.title}
- Description: ${concept.description}
- UX direction: ${concept.ux}
- Visual/layout: ${concept.visual}
- Topic area: ${topic}

REQUIREMENTS — every item is mandatory:
1. Use INLINE styles (style="...") on every element. NO <style> tag anywhere.
2. All buttons must function — clicking them must visibly change the UI (no dead buttons).
3. Navigation between all screens must work.
4. Simulate state changes: loading states, success/error feedback, active selections.
5. No placeholder text, no fake interactions, no "coming soon" — the product must feel real.
6. Use real, realistic content for "${topic}" — not generic filler.
7. Include: navigation bar, hero section, at least 2 feature sections, footer.
8. Make it look like a real launched product (polished, not a wireframe).
9. Use Google Fonts via a single <link> tag in <head> if needed.
10. No other external dependencies.
11. Return ONLY the HTML. Start with <!DOCTYPE html>. No markdown, no explanation.${langNote}`;

export async function POST(request: Request) {
  const { topic, concepts, lang = 'en', apiKey } = await request.json() as {
    topic: string;
    concepts: Record<string, ConceptData>;
    lang?: string;
    apiKey?: string;
  };
  if (!apiKey) return new Response("No API key provided. Add your Anthropic key in Settings.", { status: 401 });
  const anthropic = new Anthropic({ apiKey });

  const ids = (['A', 'B', 'C'] as const).filter(id => concepts[id]);
  if (!topic || ids.length === 0) {
    return new Response("Missing topic or concepts", { status: 400 });
  }

  const langNote = lang === 'he'
    ? '\n12. Write ALL visible text content in the HTML in Hebrew (עברית). Add dir="rtl" to the <body> tag.'
    : '';

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      for (const id of ids) {
        try {
          let html = '';

          // Step 1: Extract product spec (fast, non-streamed)
          const specMsg = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 600,
            messages: [{ role: "user", content: SPEC_PROMPT(concepts[id], topic) }],
          });
          const spec = specMsg.content[0].type === "text" ? specMsg.content[0].text : "";

          // Step 2: Generate HTML using the spec — stream tokens to keep connection alive
          const s = anthropic.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 6000,
            messages: [{ role: "user", content: PROMPT(concepts[id], topic, spec, langNote) }],
          });

          for await (const chunk of s) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              html += chunk.delta.text;
              send('token', { id }); // heartbeat — keeps Vercel connection alive
            }
          }

          html = html
            .replace(/^```html\n?/m, '')
            .replace(/^```\n?/m, '')
            .replace(/\n?```$/m, '')
            .trim();

          send('prototype', { id, html });
        } catch (err) {
          send('proto_error', { id, message: String(err) });
        }
      }

      send('done', {});
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
