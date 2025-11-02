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
        className="relative w-full max-w-lg p-6 bg-black/30 border border-indigo-500/50 rounded-xl shadow-2xl shadow-indigo-500/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 mb-4">
            <MicIcon className="w-6 h-6 text-indigo-400"/>
            <h2 className="text-xl font-bold text-indigo-300 text-shadow-indigo">Ask a Live Question</h2>
        </div>
        
        {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
                <LoadingSpinnerIcon className="w-10 h-10 text-indigo-400" />
                <p className="text-indigo-300">The hosts are thinking...</p>
            </div>
        ) : (
            <form onSubmit={handleSubmit}>
                <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask something..."
                    className="w-full h-32 bg-black/40 border border-indigo-500/40 rounded-lg p-4 text-gray-200 resize-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-shadow"
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
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition shadow-[0_0_8px_theme(colors.indigo.500)] disabled:bg-gray-600 disabled:cursor-not-allowed"
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
