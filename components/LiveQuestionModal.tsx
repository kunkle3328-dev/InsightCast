import React, { useState, useEffect } from 'react';
// Fix: Correct import path by providing content for icons.tsx
import { LoadingSpinnerIcon, MicIcon, SendIcon } from './icons';

interface LiveQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: string) => void;
  isLoading: boolean;
}

export const LiveQuestionModal: React.FC<LiveQuestionModalProps> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [question, setQuestion] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setQuestion('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isLoading) {
      onSubmit(question);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
        onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg p-6 bg-[var(--bg-surface-glass)] border border-[var(--text-accent-secondary)]/50 rounded-xl shadow-2xl shadow-[var(--shadow-color-secondary)]/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 mb-4">
            <MicIcon className="w-6 h-6 text-[var(--text-accent-secondary)]"/>
            <h2 className="text-xl font-bold text-[var(--text-accent-secondary)] text-shadow-secondary">Ask a Live Question</h2>
        </div>
        
        {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
                <LoadingSpinnerIcon className="w-10 h-10 text-[var(--text-accent-secondary)]" />
                <p className="text-[var(--text-accent-secondary)]">The hosts are thinking...</p>
            </div>
        ) : (
            <form onSubmit={handleSubmit}>
                <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask something..."
                    className="w-full h-32 bg-[var(--bg-surface-2)] border border-[var(--text-accent-secondary)]/40 rounded-lg p-4 text-[var(--text-primary)] resize-none focus:ring-2 focus:ring-[var(--text-accent-secondary)] focus:border-[var(--text-accent-secondary)] transition-shadow"
                    autoFocus
                />
                <div className="flex justify-end space-x-3 mt-4">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-500/20 rounded-md hover:bg-gray-500/40 transition"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        disabled={!question.trim()}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-[var(--bg-accent-secondary)] rounded-md hover:bg-[var(--bg-accent-secondary)]/80 transition shadow-[0_0_8px_var(--shadow-color-secondary)] disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        <SendIcon className="w-4 h-4" />
                        <span>Ask Now</span>
                    </button>
                </div>
            </form>
        )}
      </div>
    </div>
  );
};