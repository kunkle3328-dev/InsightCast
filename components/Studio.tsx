import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LogoIcon,
  MicIcon,
  PauseIcon,
  PlayIcon,
  MessageSquareIcon,
  SendIcon,
  ChartBarIcon,
  UsersIcon,
  ServerIcon,
} from './icons';
import {
  LiveConversationMessage,
  sendLiveTurn,
} from '../services/geminiService';

interface StudioProps {
  onNavigate: (view: 'credit_store') => void;
}

type ConversationMessage = LiveConversationMessage & { id: string };

type SessionMetric = {
  title: string;
  value: string;
  caption: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const DEFAULT_SUGGESTIONS = [
  'Summarize the latest breakthroughs',
  'Explain it like I am in a rush',
  'Show me something visual',
  'What should I ask next?',
];

const DEFAULT_HIGHLIGHTS = [
  'Real-time responses tuned to your vibe',
  'Hands-free mic controls for live follow-ups',
  'Automatic highlights build your recap as you talk',
];

const INITIAL_ASSISTANT_MESSAGE: ConversationMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hey, I'm Gemini Live. Ask me anything and I’ll respond in real time with context-aware insights.",
};

const MessageBubble: React.FC<{
  message: ConversationMessage;
  isAssistant: boolean;
  isStreaming?: boolean;
}> = ({ message, isAssistant, isStreaming }) => (
  <div
    className={`group flex gap-4 ${
      isAssistant ? 'items-start' : 'items-start justify-end flex-row-reverse'
    }`}
  >
    <div
      className={`mt-1 h-9 w-9 flex-shrink-0 rounded-full border border-white/10 bg-white/10 backdrop-blur-lg flex items-center justify-center ${
        isAssistant ? 'shadow-[0_0_20px_rgba(92,225,230,0.35)] text-cyan-300' : 'text-white'
      }`}
    >
      {isAssistant ? 'G' : 'You'}
    </div>
    <div
      className={`max-w-3xl rounded-3xl border px-5 py-4 text-sm leading-relaxed shadow-lg transition-all duration-300 ${
        isAssistant
          ? 'border-cyan-400/20 bg-[rgba(16,33,61,0.65)] text-slate-100 backdrop-blur-xl'
          : 'border-white/10 bg-white/10 text-white backdrop-blur-lg'
      }`}
    >
      <p className={`whitespace-pre-wrap text-base ${isStreaming ? 'live-streaming-text' : ''}`}>
        {message.content}
      </p>
      {isAssistant && (
        <div className="mt-3 flex items-center gap-2 text-xs uppercase tracking-widest text-cyan-200/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Gemini Live Response
        </div>
      )}
    </div>
  </div>
);

const StreamingBubble: React.FC<{ content: string }> = ({ content }) => (
  <div className="flex items-start gap-4">
    <div className="mt-1 h-9 w-9 flex-shrink-0 rounded-full border border-white/10 bg-white/10 backdrop-blur-lg flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(92,225,230,0.35)]">
      G
    </div>
    <div className="max-w-3xl rounded-3xl border border-cyan-400/20 bg-[rgba(16,33,61,0.65)] px-5 py-4 text-sm leading-relaxed text-slate-100 shadow-lg backdrop-blur-xl">
      <p className="live-streaming-text whitespace-pre-wrap text-base">{content || '…'}</p>
    </div>
  </div>
);

export const Studio: React.FC<StudioProps> = () => {
  const [messages, setMessages] = useState<ConversationMessage[]>([INITIAL_ASSISTANT_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [highlights, setHighlights] = useState<string[]>(DEFAULT_HIGHLIGHTS);
  const [sessionStatus, setSessionStatus] = useState('Listening');
  const [sessionVibe, setSessionVibe] = useState('Curious & encouraging');
  const [micActive, setMicActive] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingAssistant, setPendingAssistant] = useState<string | null>(null);
  const [streamedAssistantText, setStreamedAssistantText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const metrics: SessionMetric[] = useMemo(
    () => [
      {
        title: 'Participants',
        value: '1 : 1',
        caption: 'You & Gemini Live',
        icon: UsersIcon,
      },
      {
        title: 'Latency',
        value: isProcessing || isStreaming ? '~280 ms' : '~120 ms',
        caption: 'Edge optimized',
        icon: ServerIcon,
      },
      {
        title: 'Insights logged',
        value: `${Math.max(3, highlights.length)}`,
        caption: 'Auto-saved to recap',
        icon: ChartBarIcon,
      },
    ],
    [highlights.length, isProcessing, isStreaming]
  );

  useEffect(() => {
    if (!pendingAssistant) {
      return;
    }

    let cancelled = false;
    const reply = pendingAssistant;
    setIsStreaming(true);
    setStreamedAssistantText('');

    const interval = window.setInterval(() => {
      setStreamedAssistantText(current => {
        if (cancelled) {
          return current;
        }
        const nextLength = current.length + 3;
        const nextText = reply.slice(0, nextLength);
        if (nextText.length >= reply.length) {
          clearInterval(interval);
          if (!cancelled) {
            setMessages(prev => [
              ...prev,
              {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: reply,
              },
            ]);
            setIsStreaming(false);
            setStreamedAssistantText('');
            setPendingAssistant(null);
          }
        }
        return nextText;
      });
    }, 18);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [pendingAssistant]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedAssistantText, isStreaming]);

  const handleTextareaResize = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 180)}px`;
  };

  const handleSendMessage = async (rawValue?: string) => {
    const text = (rawValue ?? inputValue).trim();
    if (!text || isProcessing) {
      return;
    }

    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.value = '';
      handleTextareaResize(inputRef.current);
    }
    setIsProcessing(true);
    setSessionStatus('Processing');

    try {
      const history: LiveConversationMessage[] = [...messages, userMessage].map(({ role, content }) => ({
        role,
        content,
      }));
      const liveResponse = await sendLiveTurn(history, text);

      if (liveResponse.suggestedFollowUps.length) {
        setSuggestions(liveResponse.suggestedFollowUps);
      }
      if (liveResponse.highlights.length) {
        setHighlights(liveResponse.highlights);
      }
      setSessionVibe(liveResponse.vibe || 'Curious & encouraging');
      setSessionStatus(liveResponse.status || 'Responding');
      setPendingAssistant(liveResponse.reply || '');
    } catch (error) {
      console.error(error);
      setSessionStatus('Reconnecting…');
      setPendingAssistant('I hit a snag on my end. Give me a second and feel free to try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMic = () => {
    setMicActive(prev => !prev);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04050f] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(69,226,243,0.12),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(142,97,255,0.18),transparent_50%),radial-gradient(circle_at_50%_80%,rgba(255,115,161,0.14),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/10 to-transparent lg:block" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex flex-col gap-6 px-8 pb-6 pt-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
                <LogoIcon className="h-7 w-7 text-cyan-200" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">Gemini Live</p>
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">Conversational Studio</h1>
              </div>
            </div>
            <p className="max-w-2xl text-base text-white/70">
              A near-clone of Google’s Gemini Live interface. Switch on your mic, speak naturally, and get multimodal responses, follow-ups, and live highlights without missing a beat.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                Connected to Gemini Edge
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl">
                <PlayIcon className="h-4 w-4 text-rose-300" />
                Live Session
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl">
                <MessageSquareIcon className="h-4 w-4 text-cyan-200" />
                {messages.length} turns processed
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-left backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Session vibe</p>
              <p className="mt-1 text-lg font-semibold text-white">{sessionVibe}</p>
              <p className="mt-2 text-sm text-white/60">Gemini adapts tone live based on your prompts.</p>
            </div>
            <button
              onClick={toggleMic}
              className={`relative flex h-14 w-14 items-center justify-center rounded-full border border-white/10 transition-all duration-300 ${
                micActive
                  ? 'bg-gradient-to-br from-cyan-400/80 via-blue-500/60 to-indigo-500/70 shadow-[0_0_35px_rgba(6,182,212,0.45)]'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <MicIcon className={`h-6 w-6 ${micActive ? 'text-white' : 'text-white/70'}`} />
              {micActive && (
                <span className="absolute inset-0 -z-10 animate-pulse-slow rounded-full border border-cyan-300/20" />
              )}
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6 px-8 pb-36 lg:flex-row">
          <section className="flex-1 overflow-hidden rounded-[32px] border border-white/10 bg-[rgba(7,12,26,0.75)] p-6 shadow-[0_0_50px_rgba(12,26,64,0.35)] backdrop-blur-xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Live transcription</p>
                  <p className="text-lg font-semibold text-white">Realtime conversation feed</p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur-xl">
                  <PauseIcon className="h-4 w-4" />
                  Auto-captions on
                </div>
              </div>

              <div className="mt-6 flex-1 space-y-6 overflow-y-auto pr-4">
                {messages.map(message => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isAssistant={message.role === 'assistant'}
                  />
                ))}

                {isStreaming && <StreamingBubble content={streamedAssistantText} />}

                <div ref={chatEndRef} />
              </div>
            </div>
          </section>

          <aside className="lg:w-[28rem] xl:w-[30rem]">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Session status</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className={`flex h-3 w-3 rounded-full ${
                    sessionStatus === 'Listening'
                      ? 'bg-emerald-400'
                      : sessionStatus === 'Processing'
                      ? 'bg-amber-300'
                      : sessionStatus === 'Reconnecting…'
                      ? 'bg-rose-400'
                      : 'bg-cyan-300'
                  }`} />
                  <p className="text-base font-semibold text-white">{sessionStatus}</p>
                </div>
                <p className="mt-3 text-sm text-white/65">
                  Gemini Live mirrors the conversational flow of Google’s experience with adaptive tone, quick follow-ups, and summary building that updates every turn.
                </p>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Highlights</p>
                <ul className="mt-4 space-y-3 text-sm text-white/80">
                  {highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-cyan-300" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {metrics.map(metric => (
                  <div
                    key={metric.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70 backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-3">
                      <metric.icon className="h-4 w-4 text-cyan-200" />
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">{metric.title}</p>
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-white">{metric.value}</p>
                    <p className="mt-1 text-xs text-white/60">{metric.caption}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </main>

        <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center pb-8">
          <div className="pointer-events-auto w-full max-w-5xl rounded-[32px] border border-white/10 bg-[rgba(7,12,26,0.9)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
            <div className="flex flex-wrap gap-2">
              {suggestions.map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-cyan-400/40 hover:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-end gap-4">
              <button
                onClick={toggleMic}
                className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border transition ${
                  micActive
                    ? 'border-cyan-400/60 bg-cyan-400/20 text-white shadow-[0_0_25px_rgba(34,211,238,0.35)]'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <MicIcon className="h-6 w-6" />
              </button>

              <div className="flex-1 rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={event => {
                    setInputValue(event.target.value);
                    handleTextareaResize(event.target);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Talk to Gemini Live…"
                  rows={1}
                  className="max-h-40 w-full resize-none border-none bg-transparent text-base text-white placeholder:text-white/40 focus:outline-none"
                />
              </div>

              <button
                onClick={() => handleSendMessage()}
                disabled={isProcessing || (!inputValue.trim() && !pendingAssistant && !isStreaming)}
                className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border transition ${
                  isProcessing
                    ? 'border-white/10 bg-white/5 text-white/40'
                    : 'border-cyan-400/60 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 text-white shadow-[0_0_25px_rgba(59,130,246,0.35)] hover:scale-[1.02]'
                }`}
              >
                <SendIcon className="h-5 w-5" />
              </button>
            </div>

            {(isProcessing || isStreaming) && (
              <div className="mt-4 flex items-center gap-2 text-sm text-white/60">
                <span className="inline-flex h-2.5 w-2.5 animate-ping-slow rounded-full bg-cyan-300" />
                Gemini is composing a live response…
              </div>
            )}
          </div>
        </footer>
      </div>

      <style>{`
        .live-streaming-text {
          background: linear-gradient(90deg, rgba(125, 211, 252, 0.85), rgba(192, 132, 252, 0.85));
          -webkit-background-clip: text;
          color: transparent;
          animation: shimmer 1.2s linear infinite;
        }
        @keyframes shimmer {
          0% {
            filter: brightness(0.9);
          }
          50% {
            filter: brightness(1.3);
          }
          100% {
            filter: brightness(0.9);
          }
        }
        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(0.95);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2.4s ease-in-out infinite;
        }
        @keyframes ping-slow {
          0% {
            transform: scale(0.95);
            opacity: 0.75;
          }
          75% {
            transform: scale(1.4);
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
        .animate-ping-slow {
          animation: ping-slow 2.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};
