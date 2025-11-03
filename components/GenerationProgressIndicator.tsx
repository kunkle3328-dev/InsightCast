import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, LoadingSpinnerIcon } from './icons';

type Stage = 'script' | 'synthesis';

interface GenerationProgressIndicatorProps {
  stage: Stage;
  progress: {
    completed: number;
    total: number;
  };
}

const Step: React.FC<{ text: string, isActive: boolean, isCompleted: boolean }> = ({ text, isActive, isCompleted }) => (
    <div className="flex items-center space-x-3 transition-opacity duration-300">
        <div className="flex-shrink-0">
            {isCompleted ? <CheckCircleIcon className="w-5 h-5 text-green-400"/> : 
             isActive ? <LoadingSpinnerIcon className="w-5 h-5 text-[var(--text-accent-primary)]"/> :
             <div className="w-5 h-5 rounded-full bg-gray-700/50 border border-gray-600"></div>
            }
        </div>
        <p className={`font-medium ${isCompleted ? 'text-[var(--text-secondary)] line-through' : isActive ? 'text-[var(--text-accent-primary)]' : 'text-gray-500'}`}>{text}</p>
    </div>
);


export const GenerationProgressIndicator: React.FC<GenerationProgressIndicatorProps> = ({ stage, progress }) => {
    const [showFinalizing, setShowFinalizing] = useState(false);

    const isScriptDone = stage === 'synthesis';
    const isSynthesisDone = isScriptDone && progress.total > 0 && progress.completed === progress.total;
    
    useEffect(() => {
        // Fix: Refactored to correctly handle setTimeout cleanup and avoid NodeJS types.
        if (isSynthesisDone) {
            const timer = setTimeout(() => setShowFinalizing(true), 300);
            return () => clearTimeout(timer);
        } else {
            setShowFinalizing(false);
        }
    }, [isSynthesisDone]);

    const synthesisProgressText = stage === 'synthesis' ? ` (${progress.completed}/${progress.total})` : '';
    const synthesisPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
    
    return (
        <div className="p-4 bg-[var(--bg-surface-1)] border border-[var(--border-primary)] rounded-lg shadow-lg">
            <h3 className="text-lg font-bold text-[var(--text-primary)] text-shadow-primary mb-4">Crafting Your Podcast...</h3>
            <div className="space-y-3">
                <Step text="Generating script" isActive={stage === 'script'} isCompleted={isScriptDone} />
                <div>
                    <Step text={`Synthesizing audio${synthesisProgressText}`} isActive={stage === 'synthesis' && !isSynthesisDone} isCompleted={isSynthesisDone} />
                    {stage === 'synthesis' && !isSynthesisDone && (
                        <div className="w-full h-1.5 mt-2 ml-8 bg-[var(--bg-surface-2)] rounded-full overflow-hidden border border-[var(--border-primary)]">
                            <div className="h-full bg-[var(--bg-accent-primary)] rounded-full transition-all duration-300" style={{ width: `${synthesisPercent}%` }}></div>
                        </div>
                    )}
                </div>
                {(isSynthesisDone || showFinalizing) && (
                     <Step text="Adding finishing touches" isActive={showFinalizing} isCompleted={false} />
                )}
            </div>
        </div>
    );
};