import React, { useState, useEffect } from 'react';
import { ChatMessage, Speaker } from '../types';
import { AlexIcon, BenIcon, SaveIcon, TrashIcon, GripVerticalIcon, LoadingSpinnerIcon, CheckCircleIcon, SparklesIcon, WandIcon } from './icons';

interface ScriptEditorProps {
    messages: ChatMessage[];
    savedClips: ChatMessage[];
    finalScript: ChatMessage[];
    onSaveClip: (clip: ChatMessage) => void;
    onRemoveClip: (clipId: string) => void;
    onUpdateFinalScript: (newScript: ChatMessage[]) => void;
    onRefineScript: (instruction: string) => void;
    isRefining: boolean;
}

const ClipCard: React.FC<{
    clip: ChatMessage;
    isDraggable?: boolean;
    onDragStart?: (e: React.DragEvent<HTMLDivElement>, clip: ChatMessage) => void;
    onRemove?: (clipId: string) => void;
}> = ({ clip, isDraggable = false, onDragStart, onRemove }) => (
    <div
        draggable={isDraggable}
        onDragStart={(e) => isDraggable && onDragStart?.(e, clip)}
        className="p-3 bg-[var(--bg-surface-2)] border border-[var(--border-primary)] rounded-lg flex items-start space-x-3"
    >
        {isDraggable && <GripVerticalIcon className="w-5 h-5 text-gray-500 mt-1 cursor-grab" />}
        <div className="flex-shrink-0">
            {clip.speaker === Speaker.Alex ? <AlexIcon className="w-5 h-5 text-[var(--text-host-alex)]"/> : <BenIcon className="w-5 h-5 text-[var(--text-host-ben)]"/>}
        </div>
        <div className="flex-1">
            <p className="text-sm text-[var(--text-secondary)]">{clip.text}</p>
        </div>
        {onRemove && (
            <button onClick={() => onRemove(clip.id)} className="p-1 text-gray-500 hover:text-[var(--text-danger)]">
                <TrashIcon className="w-4 h-4" />
            </button>
        )}
    </div>
);

const RefineModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onRefine: (instruction: string) => void;
    isRefining: boolean;
}> = ({ isOpen, onClose, onRefine, isRefining }) => {
    if (!isOpen) return null;

    const refinementOptions = [
        "Tighten dialogue for clarity",
        "Remove filler words and redundancies",
        "Make the tone more professional",
        "Make the conversation more concise",
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg" onClick={onClose}>
            <div className="bg-[var(--bg-surface-glass)] p-6 rounded-xl border border-[var(--text-accent-secondary)]/50 shadow-2xl shadow-[var(--shadow-color-secondary)]/30 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex items-center space-x-3 mb-4">
                    <WandIcon className="w-6 h-6 text-[var(--text-accent-secondary)]"/>
                    <h2 className="text-xl font-bold text-[var(--text-accent-secondary)]">Magic Refine</h2>
                </div>
                <p className="text-[var(--text-secondary)] mb-4">Select a refinement option to apply to your final script.</p>
                {isRefining ? (
                    <div className="flex flex-col items-center justify-center h-40 space-y-3">
                        <LoadingSpinnerIcon className="w-8 h-8 text-[var(--text-accent-secondary)]"/>
                        <p className="text-[var(--text-accent-secondary)]">Refining script...</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {refinementOptions.map(opt => (
                            <button key={opt} onClick={() => onRefine(opt)} className="w-full text-left p-3 bg-[var(--bg-surface-2)] hover:bg-[var(--bg-accent-secondary)]/20 rounded-md transition-colors">
                                {opt}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


export const ScriptEditor: React.FC<ScriptEditorProps> = ({
    messages,
    savedClips,
    finalScript,
    onSaveClip,
    onRemoveClip,
    onUpdateFinalScript,
    onRefineScript,
    isRefining,
}) => {
    const [dragOver, setDragOver] = useState(false);
    const [savingClipId, setSavingClipId] = useState<string | null>(null);
    const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);
    
    const conversationClips = messages.filter(m => m.speaker !== Speaker.User);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, clip: ChatMessage) => {
        e.dataTransfer.setData('application/json', JSON.stringify(clip));
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        const clip = JSON.parse(e.dataTransfer.getData('application/json')) as ChatMessage;
        if (!finalScript.find(c => c.id === clip.id)) {
            onUpdateFinalScript([...finalScript, clip]);
        }
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleSaveClick = (clip: ChatMessage) => {
        setSavingClipId(clip.id);
        setTimeout(() => {
            onSaveClip(clip);
            setSavingClipId(null);
        }, 500);
    };

    const handleRefine = (instruction: string) => {
        onRefineScript(instruction);
        // Don't close modal immediately, let the loading spinner show
    };

    useEffect(() => {
        if (!isRefining && isRefineModalOpen) {
            setIsRefineModalOpen(false);
        }
    }, [isRefining, isRefineModalOpen]);

    const isClipSaved = (clipId: string) => savedClips.some(c => c.id === clipId);

    return (
        <>
        <div className="grid md:grid-cols-2 gap-8">
            {/* Conversation Source Panel */}
            <div>
                <h2 className="text-xl font-bold text-shadow-primary mb-4">Conversation Clips</h2>
                <div className="space-y-2 p-4 bg-[var(--bg-surface-1)] border border-[var(--border-primary)] rounded-lg h-[60vh] overflow-y-auto">
                    {conversationClips.length > 0 ? conversationClips.map(clip => (
                        <div key={clip.id} className="flex items-center space-x-2">
                            <div className="flex-1 p-3 bg-[var(--bg-surface-2)] border border-transparent rounded-lg flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-1">
                                    {clip.speaker === Speaker.Alex ? <AlexIcon className="w-5 h-5 text-[var(--text-host-alex)]"/> : <BenIcon className="w-5 h-5 text-[var(--text-host-ben)]"/>}
                                </div>
                                <p className="text-sm text-[var(--text-secondary)]">{clip.text}</p>
                            </div>
                            <button 
                                onClick={() => handleSaveClick(clip)} 
                                className="p-2 bg-[var(--bg-surface-2)] rounded-full disabled:cursor-not-allowed"
                                title={isClipSaved(clip.id) ? "Clip saved" : "Save clip to timeline"}
                                disabled={savingClipId === clip.id || isClipSaved(clip.id)}
                            >
                                {savingClipId === clip.id ? (
                                    <LoadingSpinnerIcon className="w-5 h-5 text-[var(--text-accent-primary)]" />
                                ) : isClipSaved(clip.id) ? (
                                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                ) : (
                                    <SaveIcon className="w-5 h-5 text-gray-500 hover:text-[var(--text-accent-primary)]"/>
                                )}
                            </button>
                        </div>
                    )) : <p className="text-center text-[var(--text-secondary)]">Generate a conversation first.</p>}
                </div>
            </div>

            {/* Final Script Timeline Panel */}
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-shadow-primary">Final Script Timeline</h2>
                    <button 
                        onClick={() => setIsRefineModalOpen(true)}
                        disabled={finalScript.length === 0}
                        className="flex items-center space-x-2 px-3 py-1 text-sm bg-[var(--bg-accent-secondary)] rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <WandIcon className="w-4 h-4"/>
                        <span>Magic Refine</span>
                    </button>
                 </div>
                 <div 
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={() => setDragOver(false)}
                    className={`space-y-2 p-4 bg-[var(--bg-surface-1)] border-2 rounded-lg h-[60vh] overflow-y-auto transition-colors ${dragOver ? 'border-[var(--border-accent)] bg-[var(--bg-accent-primary)]/10' : 'border-dashed border-[var(--border-secondary)]'}`}
                >
                    {finalScript.length > 0 ? finalScript.map(clip => (
                         <ClipCard key={clip.id} clip={clip} isDraggable onDragStart={handleDragStart} onRemove={onRemoveClip} />
                    )) : (
                         <div className="flex items-center justify-center h-full">
                             <p className="text-center text-[var(--text-secondary)]">Drag and drop saved clips here to build your final script.</p>
                        </div>
                    )}
                 </div>
            </div>
        </div>
        <RefineModal 
            isOpen={isRefineModalOpen}
            onClose={() => setIsRefineModalOpen(false)}
            onRefine={handleRefine}
            isRefining={isRefining}
        />
        </>
    );
};