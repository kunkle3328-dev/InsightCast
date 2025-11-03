export type SourceType = 'text' | 'url' | 'pdf';

export interface SourceIntel {
    summary: string;
    keyTopics: string[];
    suggestedQuestions: string[];
}

export interface Source {
  id: string;
  name: string;
  content: string;
  type: SourceType;
  intel?: SourceIntel;
  isIntelLoading?: boolean;
}

export enum Speaker {
  Alex = 'ALEX',
  Ben = 'BEN',
  User = 'USER',
}

export interface ChatMessage {
  id:string;
  speaker: Speaker;
  text: string;
  audioBuffer?: AudioBuffer;
  citation?: {
    sourceId: string;
    quote: string;
  } | null;
  citationNumber?: number;
}

export interface User {
  id:string;
  email: string;
  name: string;
  credits: number;
  role: 'User' | 'Admin';
  tier: 'Free' | 'Creator' | 'Pro';
}

export interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    price: number;
    tag?: 'Best Value' | 'Most Popular';
}

export type VoiceTier = 'Standard' | 'Premium';

export interface Voice {
    name: string;
    tier: VoiceTier;
    description: string;
    cost: number;
}

// FIX: Moved VOICES constant here to be shared across components.
export const VOICES: Voice[] = [
    { name: 'zephyr', tier: 'Standard', description: 'A balanced and clear standard voice.', cost: 0 },
    { name: 'puck', tier: 'Standard', description: 'A slightly deeper, engaging tone.', cost: 0 },
    { name: 'charon', tier: 'Standard', description: 'A mature and authoritative voice.', cost: 0 },
    { name: 'kore', tier: 'Standard', description: 'A bright and energetic presence.', cost: 0 },
    { name: 'fenrir', tier: 'Standard', description: 'A resonant, deep, and synthetic voice.', cost: 0 },
    { name: 'gacrux', tier: 'Premium', description: 'A highly realistic and expressive voice.', cost: 5 },
    { name: 'alnilam', tier: 'Premium', description: 'A charismatic voice with cinematic quality.', cost: 5 },
    { name: 'zubenelgenubi', tier: 'Premium', description: 'A deep, professional narrator-style voice.', cost: 5 },
];