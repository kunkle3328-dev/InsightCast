import React from 'react';
// Fix: Correct import path by providing content for icons.tsx
import { LogoIcon } from './icons';

export const LoadingScreen: React.FC = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-main)]">
    <div className="relative flex items-center justify-center">
      <LogoIcon className="w-24 h-24 text-[var(--text-accent-primary)] animate-pulse" />
      <div className="absolute inset-0 rounded-full border-2 border-[var(--border-accent)]/50 animate-ping opacity-75"></div>
       <div className="absolute inset-0 rounded-full border-4 border-[var(--border-accent)]/20 animate-ping delay-500"></div>
    </div>
    <p className="mt-8 text-lg font-medium text-[var(--text-accent-primary)] tracking-widest animate-pulse">
      INITIALIZING INTERFACE...
    </p>
  </div>
);