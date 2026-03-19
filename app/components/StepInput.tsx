// app/components/StepInput.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Step, Depth, Lang } from '@/types';
import { HistoryEntry, relativeDate } from '@/lib/history';

interface StepInputProps {
  topic: string;
  setTopic: (v: string) => void;
  depth: Depth;
  setDepth: (v: Depth) => void;
  lang: Lang;
  setLang: (v: Lang) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  settings: {
    anthropicKey: string;
    openaiKey: string;
    geminiKey: string;
    maxSessions: number;
    expiryDate: string;
  };
  setSettings: (v: any) => void;
  navigateTo: (target: Step) => void;
  showToast: (msg: string) => void;
  history: Step[];
  onNewSession: () => void;
  onStartDebate: () => void;
  onDemoSkip?: () => void; // TO_BE_REMOVED
  // History
  historyEntries?: HistoryEntry[];
  onRestoreHistory?: (entry: HistoryEntry) => void;
  onDeleteHistory?: (id: string) => void;
}


export default function StepInput({
  topic, setTopic,
  depth, setDepth,
  lang, setLang,
  darkMode, setDarkMode,
  showSettings, setShowSettings,
  settings, setSettings,
  navigateTo,
  showToast,
  onNewSession,
  onStartDebate,
  onDemoSkip, // TO_BE_REMOVED
  historyEntries = [],
  onRestoreHistory,
  onDeleteHistory,
}: StepInputProps) {

  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const isHe = lang === 'he';
  const router = useRouter();

  // Start the debate — reset state and navigate
  function handleStart() {
    if (!topic.trim()) return;
    onStartDebate();
  }

  function saveSettings() {
    setShowSettings(false);
    showToast(isHe ? 'ההגדרות נשמרו' : 'Settings saved');
  }

  const dm = darkMode;
  const card = dm
    ? 'bg-slate-900 border-slate-700'
    : 'bg-white border-slate-200';
  const input = dm
    ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-indigo-500'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-400';
  const subtle = dm ? 'text-slate-400' : 'text-slate-500';

  return (
    <div dir={isHe ? 'rtl' : 'ltr'}>

      {/* ---- Settings Modal ---- */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowSettings(false)}
        >
          <div
            className={`w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden border ${card}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${dm ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">⚙️</span>
                <h2 className="font-bold text-base">API Settings</h2>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >✕</button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-4 space-y-5 max-h-[70vh] overflow-y-auto">

              {/* API Keys */}
              <div>
                <h3 className="text-sm font-semibold mb-3">API Keys</h3>
                <div className="space-y-3">

                  {/* Anthropic */}
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${subtle}`}>
                      Anthropic API Key
                    </label>
                    <div className="flex gap-2">
                      <input
                        type={showAnthropicKey ? 'text' : 'password'}
                        value={settings.anthropicKey}
                        onChange={e => setSettings({ ...settings, anthropicKey: e.target.value })}
                        placeholder="sk-ant-..."
                        className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 ${input}`}
                      />
                      <button
                        onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                        className={`px-3 py-2 rounded-lg border text-xs ${dm ? 'border-slate-700 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-500'}`}
                      >
                        {showAnthropicKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  {/* OpenAI */}
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${subtle}`}>
                      OpenAI API Key
                    </label>
                    <input
                      type="password"
                      value={settings.openaiKey}
                      onChange={e => setSettings({ ...settings, openaiKey: e.target.value })}
                      placeholder="sk-..."
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 ${input}`}
                    />
                  </div>

                  {/* Gemini */}
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${subtle}`}>
                      Gemini API Key
                    </label>
                    <input
                      type="password"
                      value={settings.geminiKey}
                      onChange={e => setSettings({ ...settings, geminiKey: e.target.value })}
                      placeholder="AIza..."
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 ${input}`}
                    />
                  </div>
                </div>
              </div>

              <hr className={dm ? 'border-slate-700' : 'border-slate-200'} />

              {/* Usage limits */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Usage Limits</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${subtle}`}>Max Sessions</label>
                    <input
                      type="number"
                      value={settings.maxSessions}
                      onChange={e => setSettings({ ...settings, maxSessions: Number(e.target.value) })}
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 ${input}`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${subtle}`}>Expiry Date</label>
                    <input
                      type="date"
                      value={settings.expiryDate}
                      onChange={e => setSettings({ ...settings, expiryDate: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 ${input}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className={`flex items-center justify-end gap-2 px-6 py-4 border-t ${dm ? 'border-slate-700' : 'border-slate-200'}`}>
              <button
                onClick={() => setShowSettings(false)}
                className={`px-4 py-2 rounded-lg border text-sm ${dm ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-600'}`}
              >Cancel</button>
              <button
                onClick={saveSettings}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
              >Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Top Nav ---- */}
      <nav className={`sticky top-0 z-40 border-b ${dm ? 'bg-slate-900 border-slate-700/50' : 'bg-white border-slate-200'}`}>
        <div className="w-full px-6 h-14 flex items-center justify-between gap-4">

          {/* Logo + back link */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className={`text-xs px-2 py-1 rounded-md transition-colors ${dm ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
            >
              ← {isHe ? 'חזרה' : 'Back'}
            </button>
            <button onClick={onNewSession} className="flex items-center gap-2 cursor-pointer">
              <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold font-mono">A</span>
              </div>
              <span className="font-bold text-sm tracking-tight">ArchAI</span>
              <span className={`hidden sm:block text-xs ml-1 ${subtle}`}>
                {isHe ? 'סיעור מוחות ארכיטקטורה עם AI' : 'AI Architecture Brainstorming'}
              </span>
            </button>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-2">
            {/* Tab switcher */}
            <div className={`flex rounded-lg border overflow-hidden ${dm ? 'border-slate-700' : 'border-slate-200'}`}>
              <button
                onClick={() => setActiveTab('new')}
                className={`text-xs px-3 py-1.5 transition-colors ${
                  activeTab === 'new'
                    ? 'bg-indigo-600 text-white'
                    : dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                {isHe ? '+ חדש' : '+ New'}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`text-xs px-3 py-1.5 transition-colors border-l ${
                  activeTab === 'history'
                    ? 'bg-indigo-600 text-white'
                    : dm ? 'border-slate-700 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-500'
                }`}
              >
                {isHe ? `היסטוריה (${historyEntries.length})` : `History (${historyEntries.length})`}
              </button>
            </div>
            <button
              onClick={() => setLang(isHe ? 'en' : 'he')}
              className={`text-xs px-3 py-1.5 rounded-md border ${dm ? 'border-slate-700 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-500'}`}
            >
              {isHe ? 'EN' : 'עב'}
            </button>
            <button
              onClick={() => setDarkMode(!dm)}
              className={`text-xs px-3 py-1.5 rounded-md border ${dm ? 'border-slate-700 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-500'}`}
            >
              {dm ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className={`text-xs px-3 py-1.5 rounded-md border ${dm ? 'border-slate-700 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-500'}`}
            >⚙️ Settings</button>
          </div>
        </div>
      </nav>

      {/* ---- Step breadcrumb ---- */}
      <div className={`border-b ${dm ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="max-w-7xl mx-auto px-4 h-10 flex items-center gap-2 text-xs font-medium">
          {(['Configure', 'Discussion', 'Choose Design', 'Refine']).map((label, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className={`px-3 py-1 rounded-full ${
                i === 0
                  ? 'bg-indigo-600 text-white'
                  : dm ? 'border border-slate-600 text-slate-500' : 'border border-slate-300 text-slate-400'
              }`}>
                {i + 1} {label}
              </span>
              {i < 3 && <span className={subtle}>›</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ---- Main content ---- */}
      <main className="max-w-2xl mx-auto px-6 pt-32 pb-12">

        {/* ---- History tab ---- */}
        {activeTab === 'history' && (
          <div>
            <h2 className="text-xl font-bold mb-6">
              {isHe ? 'פרוייקטים אחרונים' : 'Recent Projects'}
            </h2>
            {historyEntries.length === 0 ? (
              <div className={`text-center py-16 ${subtle}`}>
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm">{isHe ? 'אין היסטוריה עדיין' : 'No history yet'}</p>
                <button
                  onClick={() => setActiveTab('new')}
                  className="mt-4 text-sm text-indigo-500 hover:underline"
                >
                  {isHe ? 'התחל פרוייקט חדש ←' : 'Start a new project →'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {historyEntries.map(entry => {
                  const conceptKeys = (['A', 'B', 'C'] as const).filter(k => entry.concepts[k]);
                  const depthLabel = entry.depth === 'mini' ? 'Mini' : entry.depth === 'quick' ? 'Quick' : 'Full';
                  const hasProto = !!entry.selectedProto;
                  return (
                    <div
                      key={entry.id}
                      className={`rounded-xl border p-4 transition-colors ${card}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          {/* Topic */}
                          <p className="font-semibold text-sm leading-snug line-clamp-2 mb-2">
                            {entry.topic}
                          </p>
                          {/* Badges row */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${dm ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                              {relativeDate(entry.savedAt)}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${dm ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                              {entry.lang.toUpperCase()}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${dm ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                              {depthLabel}
                            </span>
                            {hasProto && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${dm ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                ✓ Prototype {entry.selectedProto}
                              </span>
                            )}
                          </div>
                          {/* Concept pills */}
                          {conceptKeys.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {conceptKeys.map(k => (
                                <span
                                  key={k}
                                  className={`text-[10px] px-2 py-0.5 rounded-full border ${dm ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}
                                >
                                  {k}: {entry.concepts[k].title}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Actions */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <button
                            onClick={() => onRestoreHistory?.(entry)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium whitespace-nowrap"
                          >
                            {isHe ? 'המשך ←' : 'Continue →'}
                          </button>
                          <button
                            onClick={() => onDeleteHistory?.(entry.id)}
                            className={`text-xs px-2 py-1 rounded-lg ${dm ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---- New Project tab ---- */}
        {activeTab === 'new' && <>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">
            {isHe ? 'מה תרצה לבנות?' : "What do you want to build?"}
          </h1>
          <p className={`text-sm ${subtle}`}>
            {isHe
              ? 'תאר את הרעיון שלך — 8 מהנדסי AI ינתחו אותו'
              : 'Describe your idea — AI engineers will analyze it'}
          </p>
        </div>

        {/* Topic textarea */}
        {(() => {
          const maxChars = isHe ? 250 : 500;
          const remaining = maxChars - topic.length;
          const pct = topic.length / maxChars;
          const counterColor = pct >= 1
            ? 'text-red-500'
            : pct >= 0.85
              ? 'text-amber-500'
              : subtle;
          return (
            <>
              <textarea
                value={topic}
                onChange={e => { if (e.target.value.length <= maxChars) setTopic(e.target.value); }}
                placeholder={isHe ? 'תאר את רעיון התוכנה שלך בפירוט...' : 'Describe your software idea in detail...'}
                rows={5}
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none ${input}`}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleStart();
                }}
              />
              <div className={`flex justify-between text-xs mt-1 mb-6 ${counterColor}`}>
                <span className={subtle}>
                  {isHe ? '⌘↵ להתחלה' : '⌘↵ to start'}
                </span>
                <span>
                  {isHe
                    ? `${remaining} תווים נותרו מתוך ${maxChars}`
                    : `${remaining} / ${maxChars} characters remaining`}
                </span>
              </div>
            </>
          );
        })()}

        {/* Depth selector */}
        {(() => {
          const DEPTH_META: Record<Depth, { label: string; labelHe: string; tokens: string; cost: string; }> = {
            mini:  { label: 'Mini',  labelHe: 'מיני',  tokens: '~14K tokens', cost: '~$0.15' },
            quick: { label: 'Quick', labelHe: 'מהיר', tokens: '~25K tokens', cost: '~$0.30' },
            full:  { label: 'Full',  labelHe: 'מלא',  tokens: '~45K tokens', cost: '~$0.40' },
          };
          const DEPTH_SUB: Record<Depth, { sub: string; subHe: string; }> = {
            mini:  { sub: 'Haiku only · 2 designs', subHe: 'Haiku בלבד · 2 עיצובים' },
            quick: { sub: '4 agents · 3 designs',   subHe: '4 סוכנים · 3 עיצובים'  },
            full:  { sub: '8 agents · 3 designs',   subHe: '8 סוכנים · 3 עיצובים'  },
          };
          return (
            <div className="mb-8">
              <p className={`text-xs font-medium mb-2 ${subtle}`}>
                {isHe ? 'עומק הדיון' : 'Discussion depth'}
              </p>
              <div className="flex gap-2">
                {(['mini', 'quick', 'full'] as Depth[]).map(d => {
                  const active = depth === d;
                  const meta = DEPTH_META[d];
                  const sub = DEPTH_SUB[d];
                  return (
                    <button
                      key={d}
                      onClick={() => setDepth(d)}
                      className={`flex-1 py-2.5 px-2 rounded-xl border transition-all flex flex-col items-center gap-0.5 ${
                        active
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : dm
                            ? 'border-slate-700 text-slate-400 hover:bg-slate-800'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs leading-tight">
                        <span className="font-semibold">{isHe ? meta.labelHe : meta.label}</span>
                        <span className={`font-normal ${active ? 'text-indigo-200' : subtle}`}> · {isHe ? sub.subHe : sub.sub}</span>
                      </span>
                      <span className={`text-[10px] font-mono ${active ? 'text-indigo-200' : dm ? 'text-slate-500' : 'text-slate-400'}`}>
                        {meta.cost} · {meta.tokens}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={!topic.trim()}
          className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-base transition-all shadow-lg shadow-indigo-500/20"
        >
          {isHe ? 'התחל דיון ←' : 'Start Discussion →'}
        </button>

        </> /* end activeTab === 'new' */}
      </main>
    </div>
  );
}