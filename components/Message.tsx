import React, { useRef, useEffect } from 'react';
import { ChatMessage, Speaker } from '../types';
import { AlexIcon, BenIcon, UserIcon, PlayIcon, PauseIcon, LoadingSpinnerIcon, QuoteIcon } from './icons';

interface MessageProps {
  message: ChatMessage;
  onPlayPause: (message: ChatMessage) => void;
  isPlaying: boolean;
  isAudioLoading: boolean;
  isHighlighted: boolean;
  isPodcastPlaying: boolean;
  setRef: (el: HTMLDivElement | null) => void;
  onHighlightSource: (sourceId: string | null) => void;
  onCitationClick: (sourceId: string, quote: string) => void;
}

const SpeakerAvatar: React.FC<{ speaker: Speaker }> = ({ speaker }) => {
  const baseClasses = "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg";
  switch (speaker) {
    case Speaker.Alex:
      return <div className={`${baseClasses} bg-[var(--text-host-alex)] shadow-[var(--text-host-alex)]/50`}><AlexIcon className="w-6 h-6 text-white" /></div>;
    case Speaker.Ben:
      return <div className={`${baseClasses} bg-[var(--text-host-ben)] shadow-[var(--text-host-ben)]/50`}><BenIcon className="w-6 h-6 text-white" /></div>;
    case Speaker.User:
        return <div className={`${baseClasses} bg-gray-600 shadow-gray-600/50`}><UserIcon className="w-6 h-6 text-white" /></div>;
    default:
      return null;
  }
};

const SpeakerLabel: React.FC<{ speaker: Speaker }> = ({ speaker }) => {
    const getSpeakerClasses = () => {
        switch (speaker) {
            case Speaker.Alex: return 'text-[var(--text-host-alex)] text-shadow-secondary';
            case Speaker.Ben: return 'text-[var(--text-host-ben)] text-shadow-secondary';
            case Speaker.User: return 'text-gray-400';
            default: return 'text-gray-500';
        }
    };
    return <span className={`font-bold ${getSpeakerClasses()}`}>{speaker}</span>;
}

const Citation: React.FC<{ 
    citation: ChatMessage['citation'],
    citationNumber: number,
    onHighlightSource: (sourceId: string | null) => void,
    onCitationClick: (sourceId: string, quote: string) => void,
}> = ({ citation, citationNumber, onHighlightSource, onCitationClick }) => {
    if (!citation) return null;
    
    return (
        <div 
            className="group relative"
            onMouseEnter={() => onHighlightSource(citation.sourceId)}
            onMouseLeave={() => onHighlightSource(null)}
        >
            <button 
                onClick={() => onCitationClick(citation.sourceId, citation.quote)}
                className="flex items-center justify-center w-5 h-5 bg-[var(--bg-accent-primary)]/20 text-[var(--text-accent-primary)] text-xs font-bold rounded-full border border-[var(--border-secondary)] hover:bg-[var(--bg-accent-primary)]/40 hover:scale-110 transition-transform"
                title={`View source: "${citation.quote}"`}
            >
                {citationNumber}
            </button>
        </div>
    )
}

export const Message: React.FC<MessageProps> = ({ message, onPlayPause, isPlaying, isAudioLoading, isHighlighted, isPodcastPlaying, setRef, onHighlightSource, onCitationClick }) => {
    const isUser = message.speaker === Speaker.User;
    const isAIHost = message.speaker === Speaker.Alex || message.speaker === Speaker.Ben;
    
    const messageRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        setRef(messageRef.current);
    }, [setRef]);

    if (isUser) {
        return (
            <div ref={messageRef} className="flex items-start space-x-4 justify-end">
                 <div className="p-4 bg-gray-700/50 border border-gray-600/50 rounded-lg max-w-xl shadow-md">
                    <p className="text-[var(--text-primary)] whitespace-pre-wrap">{message.text}</p>
                </div>
                <SpeakerAvatar speaker={message.speaker} />
            </div>
        )
    }

    const speakerBorderColor = message.speaker === Speaker.Alex ? 'border-[var(--text-host-alex)]/30' : 'border-[var(--text-host-ben)]/30';
    const highlightClass = isHighlighted 
      ? 'bg-[var(--bg-accent-primary)]/20 ring-2 ring-[var(--border-accent)] shadow-[0_0_15px_var(--shadow-color-accent)]' 
      : 'bg-[var(--bg-surface-1)]';

  return (
    <div ref={messageRef} className="flex items-start space-x-4">
      <SpeakerAvatar speaker={message.speaker} />
      <div className="flex-1">
        <div className="flex items-center space-x-3">
            <SpeakerLabel speaker={message.speaker}/>
             {isAIHost && isAudioLoading && (
                <div className="flex items-center space-x-1.5 text-xs text-[var(--text-accent-primary)]/80">
                    <LoadingSpinnerIcon className="w-3 h-3" />
                    <span>Synthesizing...</span>
                </div>
            )}
            {message.citation && message.citationNumber && (
                <Citation 
                    citation={message.citation} 
                    citationNumber={message.citationNumber} 
                    onHighlightSource={onHighlightSource}
                    onCitationClick={onCitationClick}
                />
            )}
        </div>
        <div className={`mt-2 p-4 rounded-lg max-w-xl transition-all duration-300 backdrop-blur-md border ${speakerBorderColor} ${highlightClass} shadow-lg`}>
          <p className="text-[var(--text-primary)] whitespace-pre-wrap">{message.text}</p>
        </div>
      </div>
    </div>
  );
};