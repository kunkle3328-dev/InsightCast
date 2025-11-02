import React from 'react';
// Fix: Correct import path by providing content for icons.tsx
import { LogoIcon } from './icons';

export const LoadingScreen: React.FC = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050510]">
    <div className="relative flex items-center justify-center">
      <LogoIcon className="w-24 h-24 text-cyan-400 animate-pulse" />
      <div className="absolute inset-0 rounded-full border-2 border-cyan-400/50 animate-ping opacity-75"></div>
       <div className="absolute inset-0 rounded-full border-4 border-cyan-400/20 animate-ping delay-500"></div>
    </div>
    <p className="mt-8 text-lg font-medium text-cyan-300 tracking-widest animate-pulse">
      INITIALIZING INTERFACE...
    </p>
  </div>
);
