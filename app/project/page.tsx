// app/project/page.tsx — Main app
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Step, Depth, Lang, ProtoId, Message, ConceptData, CustomConfig } from '@/types/index';
import { AGENTS } from '@/lib/agents';
import StepInput      from '@/app/components/StepInput';
import StepDebate     from '@/app/components/StepDebate';
import StepPrototypes from '@/app/components/StepPrototypes';
import StepContinue   from '@/app/components/StepContinue';
import { getDemoData } from '@/lib/demoData';
import { HistoryEntry, loadHistory, upsertEntry, deleteEntry } from '@/lib/history';

export default function ProjectPage() {
  const router = useRouter();

  // ---- Navigation state ----
  const [step, setStep] = useState<Step>('input');
  const [history, setHistory] = useState<Step[]>([]);

  // ---- Session state ----
  const [topic, setTopic] = useState('');
  const [depth, setDepth] = useState<Depth>('full');
  const [lang, setLang] = useState<Lang>('en');
  const [darkMode, setDarkMode] = useState(false);
  const [customConfig, setCustomConfig] = useState<CustomConfig>({
    agentModels: Object.fromEntries(AGENTS.map(a => [a.id, a.model])),
    prototypeCount: 3,
    agentCount: 5,
  });

  // ---- Debate state ----
  const [messages, setMessages] = useState<Message[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [debateComplete, setDebateComplete] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // ---- Prototype ----
  const [generatedConcepts, setGeneratedConcepts] = useState<Record<string, ConceptData>>({});
  const [generatedPrototypes, setGeneratedPrototypes] = useState<Record<string, string>>({});

  // ---- Continue (round 2+) state ----
  const [continueMessages, setContinueMessages] = useState<Message[]>([]);

  // ---- History ----
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    return loadHistory();
  });
  const [currentHistoryId, setCurrentHistoryId] = useState('');

  const [demoReplayMessages, setDemoReplayMessages] = useState<Message[]>([]); // DEMO

  // ---- Prototype selection ----
  const [selectedProto, setSelectedProto] = useState<ProtoId>(null);

  // ---- Settings (persisted to localStorage) ----
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(() => {
    if (typeof window === 'undefined') return { anthropicKey: '', openaiKey: '' };
    try {
      const saved = localStorage.getItem('archai_settings');
      return saved ? JSON.parse(saved) : { anthropicKey: '', openaiKey: '' };
    } catch { return { anthropicKey: '', openaiKey: '' }; }
  });

  function setSettingsAndPersist(v: any) {
    setSettings(v);
    try { localStorage.setItem('archai_settings', JSON.stringify(v)); } catch {}
  }

  // ---- Toast notifications ----
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // ---- Navigation helpers ----
  const navigateTo = useCallback((target: Step) => {
    setHistory(prev => [...prev, step]);
    setStep(target);
  }, [step]);

  const goBack = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) {
        router.push('/');
        return prev;
      }
      const newHistory = [...prev];
      const last = newHistory.pop()!;
      // During demo, going back to 'input' should return to the landing page
      if (last === 'input' && demoReplayMessages.length > 0) {
        router.push('/');
        return prev;
      }
      setStep(last);
      return newHistory;
    });
  }, [router, demoReplayMessages]);

  // Reset everything and go to the home/input screen
  const onNewSession = useCallback(() => {
    setTopic('');
    setMessages([]);
    setCompletedCount(0);
    setDebateComplete(false);
    setIsStreaming(false);
    setGeneratedConcepts({});
    setGeneratedPrototypes({});
    setSelectedProto(null);
    setContinueMessages([]);
    setDemoReplayMessages([]);
    setHistory([]);
    setStep('input');
  }, []);

  // Reset debate state and navigate to debate (called when starting a new debate from input)
  const onStartDebate = useCallback(() => {
    const newId = Date.now().toString();
    setCurrentHistoryId(newId);
    setMessages([]);
    setCompletedCount(0);
    setDebateComplete(false);
    setIsStreaming(false);
    setGeneratedConcepts({});
    setGeneratedPrototypes({});
    setSelectedProto(null);
    setContinueMessages([]);
    setDemoReplayMessages([]); // DEMO
    setHistory(prev => [...prev, step]);
    setStep('debate');
  }, [step]);

  // Save debate transcript to history (called by StepDebate when debate completes)
  const onDebateHistorySave = useCallback((msgs: Message[]) => {
    if (!currentHistoryId || !topic) return;
    const entry: HistoryEntry = {
      id: currentHistoryId,
      savedAt: Date.now(),
      topic, lang, depth,
      messages: msgs,
      concepts: {},
      selectedProto: null,
      selectedHtml: null,
    };
    upsertEntry(entry);
    setHistoryEntries(loadHistory());
  }, [currentHistoryId, topic, lang, depth]);

  // Update history entry when user selects a prototype
  const onPrototypeHistoryUpdate = useCallback((protoId: ProtoId, html: string, concepts: Record<string, ConceptData>) => {
    if (!currentHistoryId || !protoId) return;
    const entries = loadHistory();
    const existing = entries.find(e => e.id === currentHistoryId);
    if (!existing) return;
    upsertEntry({ ...existing, concepts, selectedProto: protoId, selectedHtml: html, savedAt: Date.now() });
    setHistoryEntries(loadHistory());
  }, [currentHistoryId]);

  // Restore a past session from history
  const onRestoreHistory = useCallback((entry: HistoryEntry) => {
    setTopic(entry.topic);
    setLang(entry.lang);
    setDepth(entry.depth);
    setMessages(entry.messages.map(m => ({ ...m, streaming: false })));
    setCompletedCount(entry.messages.filter(m => !m.isConclusion).length);
    setDebateComplete(entry.messages.length > 0);
    setIsStreaming(false);
    setGeneratedConcepts(entry.concepts);
    const protos: Record<string, string> = {};
    if (entry.selectedProto && entry.selectedHtml) protos[entry.selectedProto] = entry.selectedHtml;
    setGeneratedPrototypes(protos);
    setSelectedProto(entry.selectedProto);
    setContinueMessages([]);
    setCurrentHistoryId(entry.id);
    setHistory(['input']);
    setStep('prototypes');
  }, []);

  // Delete a history entry
  const onDeleteHistory = useCallback((id: string) => {
    deleteEntry(id);
    setHistoryEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }, []);

  // DEMO: Demo mode — pre-fills topic, navigates to debate, and replays messages without API
  const onDemoSkip = useCallback(() => { // DEMO
    const demo = getDemoData(lang); // DEMO
    setTopic(demo.topic); // DEMO
    setMessages([]); // DEMO
    setCompletedCount(0); // DEMO
    setDebateComplete(false); // DEMO
    setIsStreaming(false); // DEMO
    setGeneratedConcepts(demo.concepts); // DEMO
    setGeneratedPrototypes(demo.prototypes); // DEMO
    setSelectedProto(null); // DEMO
    setContinueMessages([]); // DEMO
    setDemoReplayMessages(demo.messages); // DEMO
    setHistory(['input']); // DEMO
    setStep('debate'); // DEMO
  }, [lang]); // DEMO

  // Trigger demo if navigated here from landing page demo button
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Restore lang from landing page selection (normal navigation)
    const savedLang = sessionStorage.getItem('archai_lang') as Lang | null;
    if (savedLang) { setLang(savedLang); sessionStorage.removeItem('archai_lang'); }

    if (!sessionStorage.getItem('archai_demo')) return;
    const demoLang = (sessionStorage.getItem('archai_demo_lang') as Lang) || 'en';
    sessionStorage.removeItem('archai_demo');
    sessionStorage.removeItem('archai_demo_lang');
    const demo = getDemoData(demoLang);
    setLang(demoLang);
    setTopic(demo.topic);
    setMessages([]);
    setCompletedCount(0);
    setDebateComplete(false);
    setIsStreaming(false);
    setGeneratedConcepts(demo.concepts);
    setGeneratedPrototypes(demo.prototypes);
    setSelectedProto(null);
    setContinueMessages([]);
    setDemoReplayMessages(demo.messages);
    setHistory(['input']);
    setStep('debate');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Shared props passed down to every step ----
  const sharedProps = {
    topic, setTopic,
    depth, setDepth,
    lang, setLang,
    darkMode, setDarkMode,
    showSettings, setShowSettings,
    settings, setSettings: setSettingsAndPersist,
    toastMsg, toastVisible, showToast,
    history, navigateTo, goBack,
    selectedProto, setSelectedProto,
    generatedConcepts, setGeneratedConcepts,
    generatedPrototypes, setGeneratedPrototypes,
    onNewSession,
    // History
    historyEntries,
    onRestoreHistory,
    onDeleteHistory,
    onPrototypeHistoryUpdate,
    // Custom mode
    customConfig, setCustomConfig,
  };

  const debateProps = {
    messages, setMessages,
    completedCount, setCompletedCount,
    debateComplete, setDebateComplete,
    isStreaming, setIsStreaming,
    demoReplayMessages, // DEMO
  };

  const continueProps = {
    continueMessages, setContinueMessages,
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Toast */}
      {toastVisible && (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* Step routing */}
      {step === 'input' && (
        <StepInput {...sharedProps} onStartDebate={onStartDebate} onDemoSkip={onDemoSkip} /* DEMO */ />
      )}
      {step === 'debate' && (
        <StepDebate {...sharedProps} {...debateProps} onDebateHistorySave={onDebateHistorySave} customConfig={customConfig} />
      )}
      {step === 'prototypes' && (
        <StepPrototypes {...sharedProps} messages={messages} />
      )}
      {step === 'continue' && (
        <StepContinue {...sharedProps} {...debateProps} {...continueProps} />
      )}
    </div>
  );
}
