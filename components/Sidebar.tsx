import React from 'react';
import { Source } from '../types';
import { SourceManager } from './SourceManager';
import { LogoIcon, AlexIcon, BenIcon } from './icons';

const VOICES = ['Zephyr', 'Charon', 'Kore', 'Puck', 'Fenrir'];

interface SidebarProps {
  sources: Source[];
  onAddSource: (source: Source) => void;
  isOpen: boolean;
  onToggle: () => void;
  alexVoice: string;
  benVoice: string;
  onAlexVoiceChange: (voice: string) => void;
  onBenVoiceChange: (voice: string) => void;
}

const VoiceSelector: React.FC<{
  label: string;
  icon: React.ReactNode;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
}> = ({ label, icon, selectedVoice, onVoiceChange }) => (
  <div>
    <label className="flex items-center space-x-2 text-sm font-medium text-cyan-300 mb-2">
      {icon}
      <span>{label}</span>
    </label>
    <select
      value={selectedVoice}
      onChange={(e) => onVoiceChange(e.target.value)}
      className="w-full bg-black/30 border border-cyan-500/30 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition"
      aria-label={`Select voice for ${label}`}
    >
      {VOICES.map(voice => (
        <option key={voice} value={voice} className="bg-gray-800 text-white">
          {voice}
        </option>
      ))}
    </select>
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ 
  sources, 
  onAddSource, 
  isOpen, 
  onToggle,
  alexVoice,
  benVoice,
  onAlexVoiceChange,
  onBenVoiceChange
}) => {
  return (
    <>
      <aside className={`absolute md:relative z-20 flex flex-col h-full bg-black/20 backdrop-blur-lg border-r border-cyan-500/20 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-80 md:w-96`}>
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/20">
          <div className="flex items-center space-x-3">
            <LogoIcon className="w-8 h-8 text-cyan-400" />
            <h1 className="text-xl font-bold text-gray-200 text-shadow-cyan">Configuration</h1>
          </div>
          <button onClick={onToggle} className="p-2 rounded-md hover:bg-cyan-500/20 text-cyan-400 md:hidden" aria-label="Close sidebar">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-3 text-shadow-cyan">Voice Configuration</h3>
              <div className="space-y-4 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
                <VoiceSelector 
                  label="ALEX's Voice" 
                  icon={<AlexIcon className="w-5 h-5 text-indigo-400"/>} 
                  selectedVoice={alexVoice} 
                  onVoiceChange={onAlexVoiceChange} 
                />
                <VoiceSelector 
                  label="BEN's Voice" 
                  icon={<BenIcon className="w-5 h-5 text-teal-400"/>} 
                  selectedVoice={benVoice} 
                  onVoiceChange={onBenVoiceChange} 
                />
              </div>
            </div>
            <SourceManager sources={sources} onAddSource={onAddSource} />
          </div>
        </div>
      </aside>
       {isOpen && <div onClick={onToggle} className="fixed inset-0 z-10 bg-black/60 backdrop-blur-sm md:hidden" aria-hidden="true"></div>}
    </>
  );
};
