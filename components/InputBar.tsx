import React, { useState } from 'react';
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
        className="w-full bg-black/30 border border-cyan-500/30 rounded-lg p-4 pr-16 text-gray-200 resize-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-shadow shadow-lg"
        rows={1}
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !prompt.trim()}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-cyan-600 text-white disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-cyan-500 transition-all transform hover:scale-110 shadow-[0_0_10px_theme(colors.cyan.500)] disabled:shadow-none"
        aria-label="Send message"
      >
        <SendIcon className="w-5 h-5" />
      </button>
    </form>
  );
};