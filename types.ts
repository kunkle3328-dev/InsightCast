export type SourceType = 'text' | 'url' | 'pdf';

export interface Source {
  id: string;
  name: string;
  content: string;
  type: SourceType;
}

export enum Speaker {
  Alex = 'ALEX',
  Ben = 'BEN',
  User = 'USER',
}

export interface ChatMessage {
  id: string;
  speaker: Speaker;
  text: string;
  audioBuffer?: AudioBuffer; // To store synthesized audio
}

export interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  role: 'User' | 'Admin';
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
}
