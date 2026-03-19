// lib/history.ts

import { Lang, Depth, ProtoId, Message, ConceptData } from '@/types';

export interface HistoryEntry {
  id: string;                            // Date.now().toString() — unique per session
  savedAt: number;                       // timestamp for display
  topic: string;
  lang: Lang;
  depth: Depth;
  messages: Message[];                   // full debate transcript incl. synthesis
  concepts: Record<string, ConceptData>; // A / B / C concept cards
  selectedProto: ProtoId;               // which prototype the user picked (null if none)
  selectedHtml: string | null;           // HTML of the selected prototype only
}

const KEY = 'archai_history';
const MAX = 10;

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch { return []; }
}

function persist(entries: HistoryEntry[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch {}
}

/** Insert or update an entry (matched by id). Keeps newest-first, max 10. */
export function upsertEntry(entry: HistoryEntry): void {
  const entries = loadHistory();
  const idx = entries.findIndex(e => e.id === entry.id);
  if (idx >= 0) {
    entries[idx] = entry;
  } else {
    entries.unshift(entry);
    if (entries.length > MAX) entries.splice(MAX);
  }
  persist(entries);
}

export function deleteEntry(id: string): void {
  persist(loadHistory().filter(e => e.id !== id));
}

/** Human-readable relative timestamp — "3h ago", "2d ago", etc. */
export function relativeDate(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
