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

SCREENS (minimum 3 — these become separate navigable pages, not scroll sections):
- Home / Landing
- [Screen 2 name]
- [Screen 3 name]
- [add more as needed]

NAV BAR ITEMS (one button per screen listed above):
- [label] → [screen name]

INTERACTIVE ELEMENTS:
- [list every button, form, toggle, tab, modal, etc. and which screen it lives on]

USER ACTIONS & OUTCOMES:
- [action] → [what changes in the UI]

MISSING FLOWS TO COVER:
- [any flows that must be present for the product to feel complete]

Be exhaustive. This spec drives a multi-screen HTML app — every screen must be reachable from the nav bar.`;

const NAV_SCRIPT = `<script>
function showScreen(id){
  document.querySelectorAll('[id^="screen-"]').forEach(function(s){s.style.display='none';});
  var el=document.getElementById(id);if(el)el.style.display='block';
  document.querySelectorAll('[data-screen]').forEach(function(e){
    var on=e.dataset.screen===id;
    e.style.opacity=on?'1':'0.65';
    e.style.fontWeight=on?'700':'400';
    if(e.dataset.activebg){e.style.background=on?e.dataset.activebg:'transparent';}
  });
}
function showTab(cId,tId){
  var c=document.getElementById(cId);if(!c)return;
  c.querySelectorAll('[id^="tab-"]').forEach(function(t){t.style.display='none';});
  var t=document.getElementById(tId);if(t)t.style.display='block';
}
function toggleModal(id){
  var el=document.getElementById(id);if(!el)return;
  el.style.display=el.style.display==='flex'?'none':'flex';
}
function submitForm(formId,successId){
  var f=document.getElementById(formId);var s=document.getElementById(successId);
  if(f)f.style.display='none';if(s)s.style.display='block';
}
<\/script>`;

const PROMPT = (concept: ConceptData, topic: string, spec: string, langNote: string) => `\
You are filling content into a mandatory HTML app skeleton. The skeleton structure is fixed — you provide the content inside it.

Product spec:
${spec}

Product: ${concept.title} — ${concept.description}
UX direction: ${concept.ux}
Visual style: ${concept.visual}
Topic area: ${topic}

━━━ MANDATORY SKELETON — output this structure exactly ━━━

<!DOCTYPE html>
<html>
<head>
<title>[product name]</title>
[one Google Fonts <link> if needed — no other external resources]
</head>
<body style="margin:0;padding:0;font-family:[chosen font],sans-serif;background:[bg color]">

<!-- ── FIXED NAV BAR ── -->
<nav style="position:fixed;top:0;left:0;right:0;z-index:100;[your nav styles]">
  <div style="[logo area styles]">[logo/brand]</div>
  <div style="display:flex;gap:8px;align-items:center">
    [one <button> per screen — each MUST have onclick="showScreen('screen-NAME')" and data-screen="screen-NAME"]
    Example: <button onclick="showScreen('screen-home')" data-screen="screen-home" style="[button styles]">Home</button>
  </div>
</nav>

<!-- ── SCREEN DIVS — one per page/section ── -->
<!-- First screen: display:block. All others: display:none -->
<div id="screen-home" style="display:block;padding-top:60px">
  [full home/landing screen content here — hero, features, CTA, etc.]
</div>

<div id="screen-[NAME2]" style="display:none;padding-top:60px">
  [full second screen content — use real content, not placeholders]
</div>

[add more <div id="screen-..."> blocks as needed for every screen in the spec]

<!-- ── MODALS (pre-rendered hidden — toggle with toggleModal) ── -->
[any modals: <div id="modal-NAME" style="display:none;position:fixed;inset:0;...">...</div>]

<!-- ── REQUIRED SCRIPT — paste verbatim, do not modify ── -->
${NAV_SCRIPT}
</body>
</html>

━━━ CONTENT RULES ━━━
- Use inline styles on every element (no <style> tags)
- All content is hardcoded HTML — no innerHTML, no document.write, no dynamic rendering
- Use real content for "${topic}" — no placeholder text
- Every button/link that navigates must call showScreen(), showTab(), toggleModal(), or submitForm()
- Forms must show a hidden success <div> on submit via submitForm(formId, successId)
- Tabs within a screen: wrap in a container div, use showTab(containerId, tabId)
- The product must feel real — polished, not a wireframe
- If you generate a scrolling-only website, your answer is invalid.${langNote}`;

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
            max_tokens: 900,
            messages: [{ role: "user", content: SPEC_PROMPT(concepts[id], topic) }],
          });
          const spec = specMsg.content[0].type === "text" ? specMsg.content[0].text : "";

          // Step 2: Generate HTML using the spec — stream tokens to keep connection alive
          const s = anthropic.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 10000,
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
