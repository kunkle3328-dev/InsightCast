import React, { useState, useRef, useEffect } from 'react';
// FIX: Moved VOICES constant to a shared file (types.ts) and importing it here.
import { Source, Voice, VoiceTier, VOICES } from '../types';
import { SourceManager } from './SourceManager';
import { LogoIcon, AlexIcon, BenIcon, CreditCardIcon, SparklesIcon, ChevronDownIcon, CheckCircleIcon, ImportIcon } from './icons';
import { ThemeSelector } from './ThemeSelector';

const PREMIUM_CREDIT_THRESHOLD = 20;

const PRESETS = [
    { name: 'Default Voices', alex: 'zephyr', ben: 'puck' },
    { name: 'Deep & Charismatic', alex: 'charon', ben: 'puck' },
    { name: 'Energetic Duo', alex: 'kore', ben: 'zephyr' },
    { name: 'Synthetic Resonance', alex: 'fenrir', ben: 'charon' },
];

interface SidebarProps {
  sources: Source[];
  onAddSource: (source: Omit<Source, 'id' | 'intel' | 'isIntelLoading'>) => void;
  onRemoveSource: (sourceId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  alexVoice: string;
  benVoice: string;
  onAlexVoiceChange: (voice: string) => void;
  onBenVoiceChange: (voice: string) => void;
  credits: number;
  onNavigateToStore: () => void;
  onViewSource: (sourceId: string) => void;
  activeSourceId: string | null;
  highlightedSourceId: string | null;
  onImportProject: (data: any) => void;
}

const PremiumWarningModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onGoToStore: () => void;
  credits: number;
}> = ({ isOpen, onClose, onGoToStore, credits }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div className="relative w-full max-w-md p-6 bg-[var(--bg-surface-glass)] border border-yellow-500/50 rounded-xl shadow-2xl shadow-yellow-500/20 text-center" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center mb-4">
          <SparklesIcon className="w-16 h-16 text-yellow-400"/>
        </div>
        <h2 className="text-2xl font-bold text-yellow-300">Premium Voice Selected</h2>
        <p className="mt-2 text-[var(--text-secondary)]">
          Premium voices provide higher quality audio and cost more credits to use for podcast generation.
        </p>
        <p className="mt-2 text-[var(--text-secondary)]">
          You currently have <span className="font-bold text-[var(--text-primary)]">{credits.toLocaleString()}</span> credits. We recommend having at least {PREMIUM_CREDIT_THRESHOLD} credits for premium generations.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-[var(--text-primary)] bg-gray-500/20 rounded-md hover:bg-gray-500/40 transition w-full">
                Okay, I Understand
            </button>
            <button onClick={onGoToStore} className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-semibold text-black bg-yellow-500 rounded-md hover:bg-yellow-400 transition shadow-[0_0_8px_theme(colors.yellow.500)] w-full">
                <CreditCardIcon className="w-5 h-5" />
                <span>Go to Credit Store</span>
            </button>
        </div>
      </div>
    </div>
  );
};

const VoiceSelector: React.FC<{
  label: string;
  icon: React.ReactNode;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
}> = ({ label, icon, selectedVoice, onVoiceChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedVoiceDetails = VOICES.find(v => v.name === selectedVoice);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="flex items-center space-x-2 text-sm font-medium text-[var(--text-accent-primary)] mb-2">
        {icon}
        <span>{label}</span>
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[var(--bg-surface-2)] border border-[var(--border-secondary)] rounded-md p-2 text-left text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--border-accent)] focus:border-[var(--border-accent)] transition"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="capitalize">{selectedVoiceDetails?.name}</span>
        <ChevronDownIcon className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-[#10151d] border border-[var(--border-accent)]/50 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <ul role="listbox">
            {VOICES.map(voice => (
              <li
                key={voice.name}
                onClick={() => {
                  onVoiceChange(voice.name);
                  setIsOpen(false);
                }}
                className={`p-3 cursor-pointer hover:bg-[var(--bg-accent-primary)]/10 transition-colors border-b border-[var(--border-primary)] last:border-b-0 ${selectedVoice === voice.name ? 'bg-[var(--bg-accent-primary)]/20' : ''}`}
                role="option"
                aria-selected={selectedVoice === voice.name}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`font-semibold capitalize ${voice.tier === 'Premium' ? 'text-[var(--text-warning)]' : 'text-[var(--text-primary)]'}`}>{voice.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${voice.tier === 'Premium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-gray-500/20 text-gray-300'}`}>
                        {voice.tier}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{voice.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">+{voice.cost} Credits</p>
                    {selectedVoice === voice.name && <CheckCircleIcon className="w-5 h-5 text-[var(--text-accent-primary)] mt-1 ml-auto"/>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};


const CreditDisplay: React.FC<{ credits: number; onGetMore: () => void }> = ({ credits, onGetMore }) => (
  <div>
    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 text-shadow-primary">Credits</h3>
    <div className="p-4 bg-[var(--bg-surface-1)] border border-[var(--border-primary)] rounded-lg space-y-3">
        <div className="flex justify-between items-center">
            <span className="text-[var(--text-secondary)]">Available Credits:</span>
            <span className="font-bold text-xl text-[var(--text-primary)]">{credits.toLocaleString()}</span>
        </div>
        <button onClick={onGetMore} className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-[var(--bg-accent-primary)]/50 text-[var(--text-accent-primary)] rounded-md hover:bg-[var(--bg-accent-primary)]/80 transition">
            <CreditCardIcon className="w-5 h-5"/>
            <span>Get More Credits</span>
        </button>
    </div>
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ 
  sources, 
  onAddSource,
  onRemoveSource,
  isOpen, 
  onToggle,
  alexVoice,
  benVoice,
  onAlexVoiceChange,
  onBenVoiceChange,
  credits,
  onNavigateToStore,
  onViewSource,
  activeSourceId,
  highlightedSourceId,
  onImportProject,
}) => {
  const [isPremiumWarningOpen, setIsPremiumWarningOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPreset = PRESETS.find(p => p.alex === alexVoice && p.ben === benVoice);
  const selectedPresetValue = currentPreset ? currentPreset.name : "custom";

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = e.target.value;
    if (presetName === 'custom') return;
    const preset = PRESETS.find(p => p.name === presetName);
    if (preset) {
        onAlexVoiceChange(preset.alex);
        onBenVoiceChange(preset.ben);
    }
  };
  
  const handleVoiceSelection = (
    voiceName: string,
    onChange: (voice: string) => void
  ) => {
    const selectedVoice = VOICES.find(v => v.name === voiceName);
    if (selectedVoice?.tier === 'Premium' && credits < PREMIUM_CREDIT_THRESHOLD) {
      setIsPremiumWarningOpen(true);
    }
    onChange(voiceName);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (window.confirm('Importing a project will overwrite your current sources and scripts. Are you sure you want to continue?')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const result = JSON.parse(event.target?.result as string);
          onImportProject(result);
        } catch (error) {
          alert('Failed to parse project file. Please ensure it is a valid JSON file.');
          console.error('File parsing error:', error);
        }
      };
      reader.onerror = () => {
        alert('Error reading file.');
      };
      reader.readAsText(file);
    }
    
    // Reset file input value to allow re-uploading the same file
    if(e.target) e.target.value = '';
  };

  return (
    <>
      <aside className={`absolute md:relative z-20 flex flex-col h-full bg-[var(--bg-surface-glass)] backdrop-blur-lg border-r border-[var(--border-primary)] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-80 md:w-96`}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
          <div className="flex items-center space-x-3">
            <LogoIcon className="w-8 h-8 text-[var(--text-accent-primary)]" />
            <h1 className="text-xl font-bold text-[var(--text-primary)] text-shadow-primary">Configuration</h1>
          </div>
          <button onClick={onToggle} className="p-2 rounded-md hover:bg-[var(--bg-accent-primary)]/20 text-[var(--text-accent-primary)] md:hidden" aria-label="Close sidebar">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6">
            <CreditDisplay credits={credits} onGetMore={onNavigateToStore} />
            
            <ThemeSelector />

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 text-shadow-primary">Voice Style Presets</h3>
              <div className="bg-[var(--bg-surface-1)] border border-[var(--border-primary)] rounded-lg">
                <select
                  value={selectedPresetValue}
                  onChange={handlePresetChange}
                  className="w-full bg-[var(--bg-surface-2)] border border-[var(--border-secondary)] rounded-md p-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--border-accent)] focus:border-[var(--border-accent)] transition appearance-none"
                  aria-label="Select a voice style preset"
                >
                  <option value="custom" disabled className="bg-gray-800">Custom Selection</option>
                  {PRESETS.map(p => <option key={p.name} value={p.name} className="bg-gray-800">{p.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 text-shadow-primary">Voice Configuration</h3>
              <div className="space-y-4 p-4 bg-[var(--bg-surface-1)] border border-[var(--border-primary)] rounded-lg">
                <VoiceSelector 
                  label="ALEX's Voice" 
                  icon={<AlexIcon className="w-5 h-5 text-[var(--text-host-alex)]"/>} 
                  selectedVoice={alexVoice} 
                  onVoiceChange={(voice) => handleVoiceSelection(voice, onAlexVoiceChange)} 
                />
                <VoiceSelector 
                  label="BEN's Voice" 
                  icon={<BenIcon className="w-5 h-5 text-[var(--text-host-ben)]"/>} 
                  selectedVoice={benVoice} 
                  onVoiceChange={(voice) => handleVoiceSelection(voice, onBenVoiceChange)} 
                />
              </div>
            </div>

            <SourceManager
              sources={sources}
              onAddSource={onAddSource}
              onRemoveSource={onRemoveSource}
              onViewSource={onViewSource}
              activeSourceId={activeSourceId}
              highlightedSourceId={highlightedSourceId}
            />

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 text-shadow-primary">Project Management</h3>
              <div className="p-4 bg-[var(--bg-surface-1)] border border-[var(--border-primary)] rounded-lg">
                <button
                  onClick={handleImportClick}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-[var(--bg-surface-2)] text-[var(--text-secondary)] rounded-md hover:bg-[var(--bg-accent-primary)]/20 hover:text-[var(--text-accent-primary)] transition"
                >
                  <ImportIcon className="w-5 h-5" />
                  <span>Import Project (.json)</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelected}
                  className="hidden"
                  accept=".json"
                />
              </div>
            </div>
          </div>
        </div>
      </aside>
       {isOpen && <div onClick={onToggle} className="fixed inset-0 z-10 bg-black/60 backdrop-blur-sm md:hidden" aria-hidden="true"></div>}
       <PremiumWarningModal 
        isOpen={isPremiumWarningOpen}
        onClose={() => setIsPremiumWarningOpen(false)}
        onGoToStore={() => {
            setIsPremiumWarningOpen(false);
            onNavigateToStore();
        }}
        credits={credits}
     />
    </>
  );
};