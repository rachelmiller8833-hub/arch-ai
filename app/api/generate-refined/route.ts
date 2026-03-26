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

  const navScript = `<script>
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

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 10000,
      messages: [
        {
          role: "user",
          content: `You are filling content into a mandatory HTML app skeleton for a refined product.

Product: ${concept.title} — ${concept.description}
UX direction: ${concept.ux}
Visual style: ${concept.visual}
Topic area: ${topic}${refinementContext}

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
  [full home/landing screen content here]
</div>

<div id="screen-[NAME2]" style="display:none;padding-top:60px">
  [full second screen content — use real content, not placeholders]
</div>

[add more <div id="screen-..."> blocks as needed]

<!-- ── MODALS (pre-rendered hidden) ── -->
[any modals: <div id="modal-NAME" style="display:none;position:fixed;inset:0;...">...</div>]

<!-- ── REQUIRED SCRIPT — paste verbatim, do not modify ── -->
${navScript}
</body>
</html>

━━━ CONTENT RULES ━━━
- Use inline styles on every element (no <style> tags)
- All content is hardcoded HTML — no innerHTML, no document.write, no dynamic rendering
- Use real content for "${topic}" — no placeholder text
- Incorporate the refinements from the discussion into the design
- Every button/link that navigates must call showScreen(), showTab(), toggleModal(), or submitForm()
- Forms must show a hidden success <div> on submit via submitForm(formId, successId)
- The product must feel real — polished, not a wireframe
- If you generate a scrolling-only website, your answer is invalid.${langNote}`,
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
