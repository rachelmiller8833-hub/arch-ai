// app/components/LandingHero.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Lang } from '@/types';

interface Props {
  lang: Lang;
  onScrollToForm: () => void;
  onDemoSkip?: () => void;
}

const TEXT = {
  en: {
    badge: 'Multi-Agent AI System',
    headline1: 'The AI Engineering Team',
    headline2: 'You Never Had',
    sub: 'Describe your software idea, and 8 senior AI engineers — each with a different role, personality, and AI model — will debate it in real time and hand you a complete technical decision.',
    cta: 'Start Building',

    diff_title: 'This is not a chatbot',
    diff_sub: "It's a multi-agent war room where engineers respond to each other, build on what was said, and real disagreements happen.",
    diff_items: [
      { icon: '⚔️', title: 'Real debate', body: 'Jordan warns about costs. Sarah demands security from day one. Marcus kills features ruthlessly. They argue with each other — not just with you.' },
      { icon: '🧠', title: 'Multi-model', body: 'Claude Opus, Sonnet, Haiku, GPT and Gemini 2.5 — each agent uses the right model for their role and the chosen depth.' },
      { icon: '📋', title: 'PRD-quality output', body: 'The result reads like a document written by a senior team. Structured, opinionated, and immediately actionable.' },
    ],

    get_title: 'What you get at the end',
    get_items: [
      { icon: '🏗️', title: 'Architecture Decision Record', body: 'A full technical breakdown: every design decision, trade-off, and recommendation from your 8-engineer debate.' },
      { icon: '📄', title: 'Product Requirements Document', body: 'Roles, responsibilities, timelines, and feature specs — synthesized from the actual debate, not from generic templates.' },
      { icon: '🖥️', title: '3 Working UI Prototypes', body: 'Three distinct interfaces built by Claude from your debate content. Pick one and keep refining it.' },
    ],

    steps_title: 'How to get started',
    steps: [
      { icon: '✏️', title: 'Describe your idea', body: 'Write a few sentences about what you want to build. The more detail, the better the analysis.' },
      { icon: '⚡', title: 'Choose your depth', body: 'Quick mode: 4 agents, ~30 seconds. Full mode: all 8 engineers, deeper analysis.' },
      { icon: '👁️', title: 'Watch the debate', body: 'Your engineering team streams their analysis live, agent by agent, responding to each other in real time.' },
      { icon: '🎨', title: 'Pick a prototype', body: 'Three UI designs are generated from your specific debate content. Choose the direction you like.' },
      { icon: '🔁', title: 'Keep refining', body: 'Ask follow-up questions and get targeted answers from the same team.' },
    ],

    demo_label: 'No API key?',
    demo_cta: 'Watch live demo — Retro Games Site',
    demo_sub: 'Replays a full 8-agent debate with pre-built prototypes',
    divider: 'Configure your session below',
    scroll: 'Scroll to explore',
    step_label: (i: number) => `Step ${i + 1}`,
  },

  he: {
    badge: 'מערכת רב-סוכנים AI',
    headline1: 'צוות ההנדסה של AI',
    headline2: 'שתמיד רצית',
    sub: 'תאר את רעיון התוכנה שלך, ו-8 מהנדסי AI בכירים — כל אחד עם תפקיד, אישיות ומודל שונה — ידונו בו בזמן אמת ויחזירו לך החלטה טכנית מלאה.',
    cta: 'התחל לבנות',

    diff_title: 'זה לא צ׳אטבוט',
    diff_sub: 'זו חדר מלחמה רב-סוכנים שבו מהנדסים מגיבים זה לזה, בונים על מה שנאמר, ומחלוקות אמיתיות קורות.',
    diff_items: [
      { icon: '⚔️', title: 'דיון אמיתי', body: 'ג׳ורדן מזהיר מעלויות. שרה דורשת אבטחה מהיום הראשון. מרקוס הורג פיצ׳רים ללא רחמים. הם מתווכחים זה עם זה.' },
      { icon: '🧠', title: 'רב-מודל', body: 'Claude Opus, Sonnet, Haiku, GPT ו-Gemini 2.5 — כל סוכן משתמש במודל המתאים לתפקידו ולעומק הנבחר.' },
      { icon: '📋', title: 'פלט ברמת PRD', body: 'התוצאה נראית כמו מסמך שכתב צוות בכיר. מובנה, דעתני, ומעשי מיד.' },
    ],

    get_title: 'מה מקבלים בסוף',
    get_items: [
      { icon: '🏗️', title: 'רשומת החלטות ארכיטקטורה', body: 'פירוט טכני מלא: כל החלטת עיצוב, פשרה והמלצה מהדיון של 8 המהנדסים.' },
      { icon: '📄', title: 'מסמך דרישות מוצר', body: 'תפקידים, אחריויות, לוחות זמנים ומפרטי פיצ׳רים — מסוכמים מהדיון האמיתי, לא מתבניות גנריות.' },
      { icon: '🖥️', title: '3 אבות-טיפוס UI עובדים', body: 'שלושה ממשקים שנבנו על ידי Claude מתוכן הדיון שלך. בחר אחד והמשך לשפר אותו.' },
    ],

    steps_title: 'איך מתחילים',
    steps: [
      { icon: '✏️', title: 'תאר את הרעיון', body: 'כתוב כמה משפטים על מה שאתה רוצה לבנות. ככל שיש יותר פרטים, כך הניתוח טוב יותר.' },
      { icon: '⚡', title: 'בחר את העומק', body: 'מצב מהיר: 4 סוכנים, ~30 שניות. מצב מלא: כל 8 המהנדסים, ניתוח מעמיק.' },
      { icon: '👁️', title: 'צפה בדיון', body: 'צוות ההנדסה שלך מזרים את הניתוח שלהם בשידור חי, סוכן אחרי סוכן, מגיבים זה לזה.' },
      { icon: '🎨', title: 'בחר אב-טיפוס', body: 'שלושה עיצובי UI נוצרים מתוכן הדיון הספציפי שלך. בחר את הכיוון שאתה אוהב.' },
      { icon: '🔁', title: 'המשך לשפר', body: 'שאל שאלות המשך וקבל תשובות ממוקדות מאותו צוות.' },
    ],

    demo_label: 'אין מפתח API?',
    demo_cta: 'צפה בדמו חי — אתר משחקי רטרו',
    demo_sub: 'משחזר דיון מלא של 8 סוכנים עם אבות-טיפוס מוכנים',
    divider: 'הגדר את הסשן שלך למטה',
    scroll: 'גלול לחקור',
    step_label: (i: number) => `שלב ${i + 1}`,
  },
};

export default function LandingHero({ lang, onScrollToForm, onDemoSkip }: Props) {
  const t = TEXT[lang];
  const isHe = lang === 'he';
  const stepsRef = useRef<HTMLDivElement>(null);
  const [stepsVisible, setStepsVisible] = useState(false);

  useEffect(() => {
    const el = stepsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStepsVisible(true); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Landing is always dark
  const subtle = 'text-slate-400';
  const card   = 'bg-slate-800/50 border-slate-700/60';
  const sect1  = 'bg-slate-900';
  const sect2  = 'bg-slate-950';

  return (
    <div dir={isHe ? 'rtl' : 'ltr'}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(6px); }
        }
        .hero-anim-1 { animation: fadeUp 0.7s ease 0.05s both; }
        .hero-anim-2 { animation: fadeUp 0.7s ease 0.2s  both; }
        .hero-anim-3 { animation: fadeUp 0.7s ease 0.35s both; }
        .hero-anim-4 { animation: fadeUp 0.7s ease 0.5s  both; }
        .scroll-hint { animation: scrollBounce 2s ease-in-out infinite; }
        .step-card   { opacity: 0; }
        .step-card.in { animation: fadeUp 0.5s ease both; }
      `}</style>

      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative min-h-[88vh] flex flex-col items-center justify-center text-center px-4 py-24 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[130px] bg-indigo-700 opacity-20" />
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* badge */}
          <div className="hero-anim-1 inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium mb-6 border-indigo-500/40 bg-indigo-500/10 text-indigo-400">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse inline-block" />
            {t.badge}
          </div>

          {/* headline */}
          <h1 className="hero-anim-2 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            {t.headline1}
            <br />
            <span className="text-indigo-500">{t.headline2}</span>
          </h1>

          {/* sub */}
          <p className={`hero-anim-3 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10 ${subtle}`}>
            {t.sub}
          </p>

          {/* CTAs */}
          <div className="hero-anim-4 flex flex-col items-center gap-4">
            <button
              onClick={onScrollToForm}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5"
            >
              {t.cta} ↓
            </button>
            {onDemoSkip && (
              <div className="flex flex-col items-center gap-1">
                <p className="text-xs text-slate-500">{t.demo_label}</p>
                <button
                  onClick={onDemoSkip}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm font-medium transition-colors"
                >
                  ⚡ {t.demo_cta}
                </button>
                <p className="text-[11px] text-slate-600">{t.demo_sub}</p>
              </div>
            )}
          </div>
        </div>

        {/* scroll hint */}
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 ${subtle} text-xs`}>
          <span>{t.scroll}</span>
          <div className="scroll-hint w-4 h-4 flex items-center justify-center opacity-50 text-base">↓</div>
        </div>
      </section>

      {/* ═══════════════════════ WHAT MAKES IT DIFFERENT ═══════════════════════ */}
      <section className={`py-20 px-4 ${sect1}`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t.diff_title}</h2>
            <p className={`text-sm sm:text-base max-w-xl mx-auto ${subtle}`}>{t.diff_sub}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {t.diff_items.map((item, i) => (
              <div key={i} className={`rounded-2xl border p-6 transition-colors ${card}`}>
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-base mb-2">{item.title}</h3>
                <p className={`text-sm leading-relaxed ${subtle}`}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ WHAT YOU GET ═══════════════════════ */}
      <section className={`py-20 px-4 ${sect2}`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t.get_title}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {t.get_items.map((item, i) => (
              <div key={i} className={`rounded-2xl border p-6 ${card}`}>
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-base mb-2">{item.title}</h3>
                <p className={`text-sm leading-relaxed ${subtle}`}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ HOW TO GET STARTED (animated) ═══════════════════════ */}
      <section className={`py-20 px-4 ${sect1}`} ref={stepsRef}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">{t.steps_title}</h2>
          </div>
          <div className="flex flex-col gap-3">
            {t.steps.map((step, i) => (
              <div
                key={i}
                className={`step-card ${stepsVisible ? 'in' : ''} flex items-start gap-4 rounded-2xl border p-5 ${card}`}
                style={stepsVisible ? { animationDelay: `${i * 0.1}s` } : {}}
              >
                {/* step number + icon */}
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white text-lg flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-mono font-semibold text-indigo-400">
                    {t.step_label(i)}
                  </span>
                  <h3 className="font-bold text-sm mt-0.5 mb-1">{step.title}</h3>
                  <p className={`text-sm leading-relaxed ${subtle}`}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
