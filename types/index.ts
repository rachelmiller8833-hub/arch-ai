// types/index.ts

export type Step = 'input' | 'debate' | 'prototypes' | 'continue';

export interface ConceptData {
  id: 'A' | 'B' | 'C';
  title: string;
  description: string;
  ux: string;
  visual: string;
}
export type Depth = 'mini' | 'quick' | 'full' | 'custom';
export type Lang = 'en' | 'he';

export interface CustomConfig {
  agentModels: Record<string, string>; // agent id → model id
  prototypeCount: 1 | 2 | 3;
  agentCount: 4 | 8;
}
export type ProtoId = 'A' | 'B' | 'C' | null;

export interface Message {
  id: number;
  name: string;
  role: string;
  model: string;
  initials: string;
  avatarBg: string;
  threadColor: string;
  text: string;
  streaming: boolean;
  visible: boolean;
  isConclusion: boolean;
  conclusionTitle?: string;
}