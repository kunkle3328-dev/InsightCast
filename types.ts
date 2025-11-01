export enum Speaker {
  Alex = 'Alex',
  Ben = 'Ben',
  User = 'User',
  System = 'System',
}

export interface ChatMessage {
  id: string;
  speaker: Speaker;
  text: string;
}

export type SourceType = 'text' | 'url' | 'pdf';

export interface Source {
  id: string;
  name: string;
  content: string;
  type: SourceType;
}