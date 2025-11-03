
import React from 'react';
import { ChatMessage, Speaker } from '../types';
import { Message } from './Message';
import { LogoIcon, PlayIcon, StopIcon, LoadingSpinnerIcon, MicIcon } from './icons';
import { GenerationProgressIndicator } from './GenerationProgressIndicator';
import { AudioVisualizer } from './AudioVisualizer';

interface ChatViewProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onPlayPause: (message: ChatMessage) => void;
  currentlyPlayingId: string | null;
  isAudioLoadingId: string | null;
  onPlayFullPodcast: () => void;
  isPodcastPlaying: boolean;
  isPodcastLoading: boolean;
  highlightedMessageId: string | null;
  frequencyData: Uint8Array | null;
  onAskLiveQuestion: () => void;
  setMessageRef: (id: string, el: HTMLDivElement | null) => void;
  generationStage: 'script' | 'synthesis';
  synthesisProgress: { completed: number; total: number; };
  onHighlightSource: (sourceId: string | null) => void;
  onCitationClick: (sourceId: string, quote: string) => void;
}

const WelcomeMessage: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <LogoIcon className="w-24 h-24 text-[var(--text-accent-primary)]/50" />
    <h2 className="mt-6 text-2xl font-bold text-[var(--text-primary)] text-shadow-primary">Welcome to AI Podcast Studio</h2>
    <p className="mt-2 text-lg text-[var(--text-secondary)] max-w-md">
      Add a source from the sidebar, then ask a question below to start a conversation with our AI hosts, ALEX & BEN.
    </p>
  </div>
);

const PlaybackControls: React.FC<{
    onPlayClick: () => void;
    onAskClick: () => void;
    isPlaying: boolean;
    isLoading: boolean;
}> = ({ onPlayClick, onAskClick, isPlaying, isLoading }) => (
    <div className="flex justify-center items-center space-x-4">
        <button
            onClick={onPlayClick}
            disabled={isLoading}
            className="flex items-center justify-center space-x-3 px-6 py-3 bg-[var(--bg-accent-primary)] text-white font-semibold rounded-full shadow-lg hover:bg-[var(--bg-accent-primary-hover)] disabled:bg-[var(--bg-disabled)] disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-[0_0_15px_var(--shadow-color-accent)] disabled:shadow-none"
        >
            {isLoading ? (
                <>
                    <LoadingSpinnerIcon className="w-5 h-5"/>
                    <span>Synthesizing...</span>
                </>
            ) : isPlaying ? (
                <>
                    <StopIcon className="w-5 h-5"/>
                    <span>Stop Podcast</span>
                </>
            ) : (
                <>
                    <PlayIcon className="w-5 h-5"/>
                    <span>Play Full Podcast</span>
                </>
            )}
        </button>
        {isPlaying && (
            <button
                onClick={onAskClick}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-[var(--bg-accent-secondary)] text-white font-semibold rounded-full shadow-lg hover:bg-[var(--bg-accent-secondary)]/80 transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-[0_0_15px_var(--shadow-color-secondary)] animate-pulse"
                title="Ask a live question"
            >
                <MicIcon className="w-5 h-5" />
                <span>Ask Live</span>
            </button>
        )}
    </div>
);

export const ChatView: React.FC<ChatViewProps> = ({ 
    messages, 
    isLoading, 
    onPlayPause, 
    currentlyPlayingId, 
    isAudioLoadingId,
    onPlayFullPodcast,
    isPodcastPlaying,
    isPodcastLoading,
    highlightedMessageId,
    frequencyData,
    onAskLiveQuestion,
    setMessageRef,
    generationStage,
    synthesisProgress,
    onHighlightSource,
    onCitationClick,
}) => {
  const hasPodcastContent = messages.some(m => m.speaker === Speaker.Alex || m.speaker === Speaker.Ben);

  return (
    <div>
      {messages.length === 0 && !isLoading && <WelcomeMessage />}
      
      {hasPodcastContent && (
        <div className="mb-6 space-y-4">
          <PlaybackControls
            onPlayClick={onPlayFullPodcast}
            onAskClick={onAskLiveQuestion}
            isPlaying={isPodcastPlaying}
            isLoading={isPodcastLoading}
          />
          <AudioVisualizer 
            frequencyData={frequencyData} 
            isPlaying={isPodcastPlaying} 
          />
        </div>
      )}

      <div className="space-y-6">
        {messages.map(msg => (
          <Message 
            key={msg.id}
            setRef={(el) => setMessageRef(msg.id, el)}
            message={msg}
            onPlayPause={onPlayPause}
            isPlaying={currentlyPlayingId === msg.id}
            isAudioLoading={isAudioLoadingId === msg.id}
            isHighlighted={highlightedMessageId === msg.id}
            isPodcastPlaying={isPodcastPlaying}
            onHighlightSource={onHighlightSource}
            onCitationClick={onCitationClick}
          />
        ))}
        {isLoading && (
            <GenerationProgressIndicator 
                stage={generationStage} 
                progress={synthesisProgress} 
            />
        )}
      </div>
    </div>
  );
};
