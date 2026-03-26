// app/api/generate-refined/route.ts

import Anthropic from "@anthropic-ai/sdk";
import { ConceptData } from "@/types";

export const runtime = 'edge';

interface RefinementMessage {
  name: string;
  role: string;
  text: string;
}

export async function POST(request: Request) {
  const { topic, lang = 'en', concept, refinementMessages, apiKey } = await request.json() as {
    topic: string;
    lang?: string;
    concept: ConceptData;
    refinementMessages: RefinementMessage[];
    apiKey?: string;
  };
  if (!apiKey) return new Response("No API key provided. Add your Anthropic key in Settings.", { status: 401 });
  const anthropic = new Anthropic({ apiKey });

  if (!topic || !concept) {
    return new Response("Missing topic or concept", { status: 400 });
  }

  const langNote = lang === 'he'
    ? '\n10. Write ALL visible text content in the HTML in Hebrew (עברית). Add dir="rtl" to the <body> tag.'
    : '';

  const refinementContext = refinementMessages?.length
    ? `\n\nThe user has refined this concept through a follow-up discussion. Apply these refinements to the HTML:\n${
        refinementMessages
          .filter(m => m.text.trim())
          .map(m => `${m.name} (${m.role}): ${m.text}`)
          .join('\n\n')
      }`
    : '';

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 6000,
      messages: [
        {
          role: "user",
          content: `Build a complete, beautiful, self-contained HTML prototype for this refined product:

Product name: ${concept.title}
What it is: ${concept.description}
UX direction: ${concept.ux}
Visual/layout: ${concept.visual}
Topic area: ${topic}${refinementContext}

CRITICAL RULES — read carefully:
1. Use INLINE styles (style="...") on every element. NO <style> tag anywhere.
2. Use real, realistic content for "${topic}" — not placeholder text.
3. Include: navigation bar, hero section, at least 2 feature sections, footer.
4. Make it look like a real launched product (polished, not a wireframe).
5. Incorporate the refinements from the discussion above into the design.
6. Use Google Fonts via a single <link> tag in <head> if needed.
7. No other external dependencies.
8. Return ONLY the HTML. Start with <!DOCTYPE html>. No markdown, no explanation.

MULTI-SCREEN NAVIGATION — you MUST implement all navigation this way:
- Every distinct screen/page is a <div> with a unique id, e.g. id="screen-home", id="screen-dashboard"
- Only the first screen starts visible (style="display:block"); all others start hidden (style="display:none")
- Every nav link, menu item, tab, or button that switches screens must call: showScreen('screen-id')
- Place this function in a <script> tag at the bottom of <body>:
    function showScreen(id) {
      document.querySelectorAll('[id^="screen-"]').forEach(function(s){ s.style.display='none'; });
      document.getElementById(id).style.display='block';
      document.querySelectorAll('[data-screen]').forEach(function(el){ el.style.opacity = el.dataset.screen===id?'1':'0.5'; });
    }
    function showTab(containerId, tabId) {
      var c = document.getElementById(containerId);
      c.querySelectorAll('[id^="tab-"]').forEach(function(t){ t.style.display='none'; });
      document.getElementById(tabId).style.display='block';
    }
    function toggleModal(id) {
      var el = document.getElementById(id);
      el.style.display = el.style.display==='none'?'flex':'none';
    }
- Add data-screen="screen-id" to nav links so the active state highlights correctly
- For tabs within a screen: use showTab(containerId, tabId)
- For modals/drawers: pre-render them hidden (display:none), toggle with toggleModal(id)
- For forms: show a success message div (pre-rendered, hidden) and hide the form on submit
- EVERY clickable element must have an onclick that calls one of the above functions${langNote}`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const html = text
      .replace(/^```html\n?/m, "")
      .replace(/^```\n?/m, "")
      .replace(/\n?```$/m, "")
      .trim();

    return Response.json({ html });

  } catch (err) {
    return new Response(`Generation failed: ${String(err)}`, { status: 500 });
  }
}
