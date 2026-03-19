// app/components/CustomModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { AGENTS, AgentModel } from '@/lib/agents';
import { CustomConfig, Lang } from '@/types';

interface Props {
  show: boolean;
  onClose: () => void;
  onApply: (config: CustomConfig) => void;
  initial: CustomConfig;
  darkMode: boolean;
  lang: Lang;
}

// ── Model catalogue ────────────────────────────────────────────────────────
export const MODELS: {
  id: AgentModel;
  label: string;
  short: string;
  provider: 'Anthropic' | 'OpenAI' | 'Google';
  tier: 'fast' | 'balanced' | 'powerful';
  inputPer1M: number;
  outputPer1M: number;
  speed: number;   // 1-3
  quality: number; // 1-3
}[] = [
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5',    short: 'Haiku',   provider: 'Anthropic', tier: 'fast',      inputPer1M: 0.80,  outputPer1M: 4.00,  speed: 3, quality: 1 },
  { id: 'claude-sonnet-4-6',         label: 'Sonnet 4.6',   short: 'Sonnet',  provider: 'Anthropic', tier: 'balanced',  inputPer1M: 3.00,  outputPer1M: 15.00, speed: 2, quality: 2 },
  { id: 'claude-opus-4-6',           label: 'Opus 4.6',     short: 'Opus',    provider: 'Anthropic', tier: 'powerful',  inputPer1M: 15.00, outputPer1M: 75.00, speed: 1, quality: 3 },
  { id: 'gpt-5.4',                   label: 'GPT-5.4',      short: 'GPT',     provider: 'OpenAI',    tier: 'balanced',  inputPer1M: 2.50,  outputPer1M: 10.00, speed: 2, quality: 2 },
  { id: 'gemini-2.5-pro',            label: 'Gemini 2.5',   short: 'Gemini',  provider: 'Google',    tier: 'balanced',  inputPer1M: 1.25,  outputPer1M: 5.00,  speed: 2, quality: 2 },
];

const PROVIDER_COLOR: Record<string, string> = {
  Anthropic: '#e97b47',
  OpenAI:    '#10a37f',
  Google:    '#4285f4',
};

// ── Token estimates per agent slot ─────────────────────────────────────────
const INPUT_BY_SLOT    = [300, 800, 1300, 1800, 2300, 2800, 3300, 3800];
const OUTPUT_PER_AGENT = 500;
const SYNTH_INPUT      = 4500;
const SYNTH_OUTPUT     = 400;
const PROTO_INPUT      = 3000;
const PROTO_OUTPUT     = 5000;

function calcCost(agentModels: Record<string, string>, protoCount: number, agentCount: number) {
  let agentsCost = 0;
  AGENTS.slice(0, agentCount).forEach((agent, slot) => {
    const modelId = agentModels[agent.id] ?? agent.model;
    const m = MODELS.find(m => m.id === modelId) ?? MODELS[0];
    const inp = INPUT_BY_SLOT[slot] ?? 4000;
    agentsCost += (inp / 1_000_000) * m.inputPer1M + (OUTPUT_PER_AGENT / 1_000_000) * m.outputPer1M;
  });
  const opus = MODELS.find(m => m.id === 'claude-opus-4-6')!;
  const synthCost = (SYNTH_INPUT / 1_000_000) * opus.inputPer1M + (SYNTH_OUTPUT / 1_000_000) * opus.outputPer1M;
  const sonnet = MODELS.find(m => m.id === 'claude-sonnet-4-6')!;
  const protoCost = protoCount * ((PROTO_INPUT / 1_000_000) * sonnet.inputPer1M + (PROTO_OUTPUT / 1_000_000) * sonnet.outputPer1M);
  return { agentsCost, synthCost, protoCost, total: agentsCost + synthCost + protoCost };
}

function fmt(n: number) { return `~$${n.toFixed(3)}`; }
function dots(n: number, max: number, filled = '●', empty = '○') {
  return Array.from({ length: max }, (_, i) => i < n ? filled : empty).join('');
}

// ── Component ──────────────────────────────────────────────────────────────
export default function CustomModal({ show, onClose, onApply, initial, lang }: Omit<Props, 'darkMode'> & { darkMode?: boolean }) {
  const isHe = lang === 'he';
  const [agentModels, setAgentModels] = useState<Record<string, string>>(initial.agentModels);
  const [protoCount, setProtoCount]   = useState<1|2|3>(initial.prototypeCount);
  const [agentCount, setAgentCount]   = useState<4|8>(initial.agentCount ?? 8);
  const [view, setView]               = useState<'main' | 'compare'>('main');

  useEffect(() => {
    if (show) {
      setAgentModels(initial.agentModels);
      setProtoCount(initial.prototypeCount);
      setAgentCount(initial.agentCount ?? 8);
      setView('main');
    }
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!show) return null;

  function setModel(agentId: string, modelId: string) {
    setAgentModels(prev => ({ ...prev, [agentId]: modelId }));
  }

  const cost = calcCost(agentModels, protoCount, agentCount);

  // ── Always-dark styles ──
  const bg      = 'bg-slate-900 text-slate-100';
  const divider = 'h-px bg-slate-800';
  const secLbl  = 'text-[10px] font-bold tracking-widest uppercase px-5 pt-5 pb-2 text-slate-500';
  const subtle  = 'text-slate-400';
  const pillBase = `text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors`;

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW: Model Comparison Table
  // ══════════════════════════════════════════════════════════════════════════
  const CompareView = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-800">
        <button
          onClick={() => setView('main')}
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-slate-800 text-slate-300 hover:bg-slate-700"
        >←</button>
        <div>
          <h2 className="text-base font-bold">{isHe ? 'השוואת מודלים' : 'Model Comparison'}</h2>
          <p className={`text-xs ${subtle}`}>{isHe ? 'עלות ל-1 מיליון טוקנים' : 'Cost per 1M tokens'}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-y-auto flex-1 px-4 py-4 space-y-3">
        {MODELS.map(m => (
          <div key={m.id} className="rounded-2xl border p-4 bg-slate-800/50 border-slate-700">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{m.label}</span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
                    style={{ backgroundColor: PROVIDER_COLOR[m.provider] }}
                  >{m.provider}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono font-bold text-indigo-400">
                  ${m.inputPer1M.toFixed(2)} <span className={`font-normal ${subtle}`}>in</span>
                </p>
                <p className="text-[10px] font-mono font-bold text-indigo-400">
                  ${m.outputPer1M.toFixed(2)} <span className={`font-normal ${subtle}`}>out</span>
                </p>
              </div>
            </div>
            <div className={`flex gap-6 text-[11px] ${subtle}`}>
              <span>⚡ {isHe ? 'מהירות' : 'Speed'}: <span className="font-mono text-amber-500">{dots(m.speed, 3)}</span></span>
              <span>✦ {isHe ? 'איכות' : 'Quality'}: <span className="font-mono text-indigo-500">{dots(m.quality, 3)}</span></span>
            </div>
          </div>
        ))}
        <p className="text-[10px] px-1 pb-2 text-slate-600">
          {isHe ? '* מחירים משוערים — בדוק באתרי הספקים לקבלת מחירים עדכניים' : '* Approximate prices — check provider sites for current rates'}
        </p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW: Main (agent model pickers)
  // ══════════════════════════════════════════════════════════════════════════
  const MainView = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold">{isHe ? 'מצב מותאם' : 'Custom Mode'}</h2>
          <p className={`text-xs mt-0.5 ${subtle}`}>{isHe ? 'בחר מודל לכל מהנדס' : 'Choose a model for each engineer'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('compare')}
            className="text-[10px] px-2.5 py-1.5 rounded-lg border font-medium transition-colors border-slate-700 text-slate-400 hover:bg-slate-800"
          >
            {isHe ? '📊 השווה' : '📊 Compare'}
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-slate-800 text-slate-400 hover:bg-slate-700"
          >✕</button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto flex-1" style={{ maxHeight: '55vh' }}>

        {/* Agent count toggle */}
        <p className={secLbl}>{isHe ? 'מספר סוכנים' : 'Number of Agents'}</p>
        <div className="px-5 pb-5">
          <div className="flex rounded-xl overflow-hidden border border-slate-700">
            {([4, 8] as const).map(n => (
              <button
                key={n}
                onClick={() => setAgentCount(n)}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  agentCount === n ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                } ${n === 4 ? 'border-r border-slate-700' : ''}`}
              >
                {n} {isHe ? 'סוכנים' : 'agents'}
              </button>
            ))}
          </div>
        </div>

        <div className={divider} />

        {/* Agent model pickers */}
        <p className={secLbl}>{isHe ? 'מודל לכל מהנדס' : 'Model per Engineer'}</p>
        <div>
          {AGENTS.slice(0, agentCount).map(agent => {
            const selectedId = agentModels[agent.id] ?? agent.model;
            const defaultModel = agent.model;
            const isDefault = selectedId === defaultModel;
            return (
              <div
                key={agent.id}
                className="px-5 py-3.5 border-b last:border-b-0 border-slate-800"
              >
                {/* Agent info row */}
                <div className="flex items-center gap-3 mb-2.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ backgroundColor: agent.avatarBg }}
                  >
                    {agent.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold">{agent.name}</span>
                    <span className={`text-xs ml-2 ${subtle}`}>{agent.role}</span>
                  </div>
                  {!isDefault && (
                    <button
                      onClick={() => setModel(agent.id, defaultModel)}
                      className="text-[9px] px-1.5 py-0.5 rounded text-slate-500 hover:text-slate-300"
                    >↺ {isHe ? 'ברירת מחדל' : 'default'}</button>
                  )}
                </div>
                {/* Model pill selector */}
                <div className="flex gap-1.5 flex-wrap">
                  {MODELS.map(m => {
                    const active = selectedId === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setModel(agent.id, m.id)}
                        className={`${pillBase} ${
                          active
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {m.short}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className={divider} />

        {/* Prototypes */}
        <p className={secLbl}>{isHe ? 'כמה אבות-טיפוסים?' : 'How many prototypes?'}</p>
        <div className="px-5 pb-5">
          <div className="flex rounded-xl overflow-hidden border border-slate-700">
            {([1, 2, 3] as const).map(n => (
              <button
                key={n}
                onClick={() => setProtoCount(n)}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  protoCount === n ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                } ${n < 3 ? 'border-r border-slate-700' : ''}`}
              >{n}</button>
            ))}
          </div>
        </div>

        <div className={divider} />

        {/* Cost estimate */}
        <p className={secLbl}>{isHe ? 'הערכת עלות' : 'Estimated Cost'}</p>
        <div className="px-5 pb-5 space-y-2">
          {[
            { label: isHe ? `מהנדסים (${agentCount})` : `Engineers (${agentCount})`, val: cost.agentsCost },
            { label: isHe ? 'סינתזה (Opus)'             : 'Synthesis (Opus)',               val: cost.synthCost  },
            { label: isHe ? `אבות-טיפוסים (${protoCount})` : `Prototypes (${protoCount})`,  val: cost.protoCost  },
          ].map(({ label, val }) => (
            <div key={label} className={`flex justify-between text-sm ${subtle}`}>
              <span>{label}</span>
              <span className="font-mono">{fmt(val)}</span>
            </div>
          ))}
          <div className="h-px mt-1 bg-slate-800" />
          <div className="flex justify-between">
            <span className="text-sm font-bold">{isHe ? 'סה״כ' : 'Total'}</span>
            <span className="text-sm font-bold font-mono text-indigo-400">{fmt(cost.total)}</span>
          </div>
          <p className="text-[10px] text-slate-600">
            {isHe ? '* הערכה בלבד — עלות בפועל עשויה להשתנות' : '* Rough estimate — actual cost may vary'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-slate-800 px-5 py-4 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-colors bg-slate-800 hover:bg-slate-700 text-slate-300"
        >
          {isHe ? 'ביטול' : 'Cancel'}
        </button>
        <button
          onClick={() => onApply({ agentModels, prototypeCount: protoCount, agentCount })}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
        >
          {isHe ? 'החל ←' : 'Apply →'}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col ${bg}`}
        style={{ animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1) both' }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(32px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
        {view === 'main'    ? MainView    : CompareView}
      </div>
    </div>
  );
}
