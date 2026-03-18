// app/api/generate-prototypes/route.ts

import Anthropic from "@anthropic-ai/sdk";
import { ConceptData } from "@/types";

export const runtime = 'edge';

async function generateHTML(anthropic: Anthropic, concept: ConceptData, topic: string, langNote = ''): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 6000,
    messages: [
      {
        role: "user",
        content: `Build a complete, beautiful, self-contained HTML prototype for this product:

Product name: ${concept.title}
What it is: ${concept.description}
UX direction: ${concept.ux}
Visual/layout: ${concept.visual}
Topic area: ${topic}

CRITICAL RULES — read carefully:
1. Use INLINE styles (style="...") on every element. NO <style> tag anywhere.
2. This forces you to write all body content first without a large CSS block eating tokens.
3. Use real, realistic content for "${topic}" — not placeholder text, not AI agent names.
4. Include: navigation bar, hero section, at least 2 feature sections, footer.
5. Make it look like a real launched product (polished, not a wireframe).
6. Use Google Fonts via a single <link> tag in <head> if needed.
7. No other external dependencies.
8. Return ONLY the HTML. Start with <!DOCTYPE html>. No markdown, no explanation.${langNote}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return text
    .replace(/^```html\n?/m, "")
    .replace(/^```\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();
}

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
    ? '\n10. Write ALL visible text content in the HTML (nav links, headings, paragraphs, button labels, etc.) in Hebrew (עברית). Add dir="rtl" to the <body> tag.'
    : '';

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Generate all in parallel — send each prototype as it finishes
      await Promise.allSettled(
        ids.map(async (id) => {
          try {
            const html = await generateHTML(anthropic, concepts[id], topic, langNote);
            send('prototype', { id, html });
          } catch (err) {
            send('proto_error', { id, message: String(err) });
          }
        })
      );

      send('done', {});
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
