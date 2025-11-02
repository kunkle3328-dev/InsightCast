import React, { useRef, useEffect } from 'react';
// Fix: Correct import path by providing content for types.ts
import { ChatMessage, Speaker } from '../types';
// Fix: Correct import path by providing content for icons.tsx
import { AlexIcon, BenIcon, UserIcon, PlayIcon, PauseIcon, LoadingSpinnerIcon } from './icons';

interface MessageProps {
  message: ChatMessage;
  onPlayPause: (message: ChatMessage) => void;
  isPlaying: boolean;
  isAudioLoading: boolean;
  isHighlighted: boolean;
  isPodcastPlaying: boolean;
  setRef: (el: HTMLDivElement | null) => void;
}

const SpeakerAvatar: React.FC<{ speaker: Speaker }> = ({ speaker }) => {
  const baseClasses = "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg";
  switch (speaker) {
    case Speaker.Alex:
      return <div className={`${baseClasses} bg-indigo-500 shadow-indigo-500/50`}><AlexIcon className="w-6 h-6 text-white" /></div>;
    case Speaker.Ben:
      return <div className={`${baseClasses} bg-teal-500 shadow-teal-500/50`}><BenIcon className="w-6 h-6 text-white" /></div>;
    case Speaker.User:
        return <div className={`${baseClasses} bg-gray-600 shadow-gray-600/50`}><UserIcon className="w-6 h-6 text-white" /></div>;
    default:
      return null;
  }
};

const SpeakerLabel: React.FC<{ speaker: Speaker }> = ({ speaker }) => {
    const getSpeakerClasses = () => {
        switch (speaker) {
            case Speaker.Alex: return 'text-indigo-400 text-shadow-indigo';
            case Speaker.Ben: return 'text-teal-400 text-shadow-teal';
            case Speaker.User: return 'text-gray-400';
            default: return 'text-gray-500';
        }
    };
    return <span className={`font-bold ${getSpeakerClasses()}`}>{speaker}</span>;
}

export const Message: React.FC<MessageProps> = ({ message, onPlayPause, isPlaying, isAudioLoading, isHighlighted, isPodcastPlaying, setRef }) => {
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
                    <p className="text-gray-200 whitespace-pre-wrap">{message.text}</p>
                </div>
                <SpeakerAvatar speaker={message.speaker} />
            </div>
        )
    }

    const speakerBorderColor = message.speaker === Speaker.Alex ? 'border-indigo-500/30' : 'border-teal-500/30';
    const highlightClass = isHighlighted 
      ? 'bg-cyan-500/20 ring-2 ring-cyan-400 shadow-[0_0_15px_theme(colors.cyan.500)]' 
      : 'bg-black/20';

  return (
    <div ref={messageRef} className="flex items-start space-x-4">
      <SpeakerAvatar speaker={message.speaker} />
      <div className="flex-1">
        <div className="flex items-center space-x-3">
            <SpeakerLabel speaker={message.speaker}/>
             {isAIHost && (
                <button 
                    onClick={() => onPlayPause(message)} 
                    className="p-1.5 rounded-full text-gray-400 bg-black/20 hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={isPlaying ? "Pause audio" : "Play audio"}
                    disabled={isAudioLoading || isPodcastPlaying}
                >
                    {isAudioLoading ? (
                        <LoadingSpinnerIcon className="w-5 h-5" />
                    ) : isPlaying ? (
                        <PauseIcon className="w-5 h-5 text-cyan-400" />
                    ) : (
                        <PlayIcon className="w-5 h-5" />
                    )}
                </button>
            )}
        </div>
        <div className={`mt-2 p-4 rounded-lg max-w-xl transition-all duration-300 backdrop-blur-md border ${speakerBorderColor} ${highlightClass} shadow-lg`}>
          <p className="text-gray-300 whitespace-pre-wrap">{message.text}</p>
        </div>
      </div>
    </div>
  );
};
