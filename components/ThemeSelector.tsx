import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { CheckCircleIcon } from './icons';

const themes = [
    { id: 'cyberpunk', name: 'Cyberpunk', colors: ['#050510', '#22d3ee', '#a78bfa'] },
    { id: 'lightwave', name: 'Light Wave', colors: ['#f9fafb', '#0ea5e9', '#4f46e5'] },
    { id: 'nebula', name: 'Nebula', colors: ['#10051e', '#d946ef', '#c4b5fd'] },
    { id: 'solaris', name: 'Solaris', colors: ['#1a110a', '#ea580c', '#facc15'] },
    { id: 'oceanic', name: 'Oceanic', colors: ['#081426', '#14b8a6', '#67e8f9'] },
    { id: 'matrix', name: 'Matrix', colors: ['#020a02', '#22c55e', '#bef264'] },
] as const;

export const ThemeSelector: React.FC = () => {
    const { theme: currentTheme, setTheme } = useTheme();

    return (
        <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 text-shadow-primary">Theme</h3>
            <div className="space-y-2">
                {themes.map((theme) => (
                    <button
                        key={theme.id}
                        onClick={() => setTheme(theme.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200 ${currentTheme === theme.id ? 'border-[var(--border-accent)]' : 'border-transparent bg-[var(--bg-surface-1)] hover:bg-[var(--bg-surface-2)]'}`}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="flex -space-x-2">
                                {theme.colors.map((color, index) => (
                                    <div
                                        key={index}
                                        className="w-6 h-6 rounded-full border-2 border-[var(--bg-main)]"
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                            <span className="font-semibold text-[var(--text-primary)]">{theme.name}</span>
                        </div>
                        {currentTheme === theme.id && <CheckCircleIcon className="w-6 h-6 text-[var(--text-accent-primary)]" />}
                    </button>
                ))}
            </div>
        </div>
    );
};