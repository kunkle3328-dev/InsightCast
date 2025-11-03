import React, { useState } from 'react';
// Fix: Correct import path by providing content for icons.tsx
import { SendIcon } from './icons';

interface InputBarProps {
  onSendMessage: (prompt: string) => void;
  isLoading: boolean;
}

export const InputBar: React.FC<InputBarProps> = ({ onSendMessage, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSendMessage(prompt);
      setPrompt('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question or start a topic..."
        className="w-full bg-[var(--bg-surface-2)] border border-[var(--border-secondary)] rounded-lg p-4 pr-16 text-[var(--text-primary)] resize-none focus:ring-2 focus:ring-[var(--border-accent)] focus:border-[var(--border-accent)] transition-shadow shadow-lg"
        rows={1}
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !prompt.trim()}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[var(--bg-accent-primary)] text-white disabled:bg-[var(--bg-disabled)] disabled:cursor-not-allowed hover:bg-[var(--bg-accent-primary-hover)] transition-all transform hover:scale-110 shadow-[0_0_10px_var(--shadow-color-accent)] disabled:shadow-none"
        aria-label="Send message"
      >
        <SendIcon className="w-5 h-5" />
      </button>
    </form>
  );
};