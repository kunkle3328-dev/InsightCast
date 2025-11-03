import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { ChatView } from './ChatView';
import { InputBar } from './InputBar';
import { LiveQuestionModal } from './LiveQuestionModal';
import { CreditModal } from './CreditModal';
import { ScriptEditor } from './ScriptEditor';
import { PodcastOverview } from './PodcastOverview';
import { SourceViewer } from './SourceViewer';
import { ChatMessage, Source, Speaker, Voice, VOICES } from '../types';
import { generatePodcast, answerLiveQuestion, generateSpeech, generateSummary, generateKeyTakeaways, refineScript, generateSourceIntel } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { INTRO_MUSIC_BASE64, OUTRO_MUSIC_BASE64 } from '../utils/audioAssets';
import { useCredits } from '../hooks/useCredits';
import { MenuIcon, XIcon } from './icons';

const SAMPLE_RATE = 24000;
const NUM_CHANNELS = 1;
const PODCAST_GENERATION_COST = 10;
const PREMIUM_VOICE_COST_ADDON = 5;

type StudioView = 'conversation' | 'notebook' | 'overview';

interface StudioProps {
    onNavigate: (view: 'credit_store') => void;
}

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
            isActive
                ? 'text-[var(--text-accent-primary)] border-[var(--border-accent)] bg-[var(--bg-surface-1)]'
                : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
        }`}
    >
        {label}
    </button>
);

interface ProjectData {
  sources: Source[];
  savedClips: ChatMessage[];
  finalScript: ChatMessage[];
}

export const Studio: React.FC<StudioProps> = ({ onNavigate }) => {
  const [sources, setSources] = useState<Source[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<StudioView>('conversation');
  
  // Source viewer state
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  const [highlightedQuote, setHighlightedQuote] = useState<string | null>(null);
  const [highlightedSourceId, setHighlightedSourceId] = useState<string | null>(null);

  // Script Editor / Notebook State
  const [savedClips, setSavedClips] = useState<ChatMessage[]>([]);
  const [finalScript, setFinalScript] = useState<ChatMessage[]>([]);

  // Credits
  const { credits, deductCredits, isLoading: isCreditsLoading } = useCredits();
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);

  // Voice selection
  const [alexVoice, setAlexVoice] = useState('zephyr');
  const [benVoice, setBenVoice] = useState('puck');

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [generationStage, setGenerationStage] = useState<'script' | 'synthesis'>('script');
  const [synthesisProgress, setSynthesisProgress] = useState({ completed: 0, total: 0 });
  const [isPodcastLoading, setIsPodcastLoading] = useState(false);
  const [isAudioLoadingId, setIsAudioLoadingId] = useState<string | null>(null);
  const [isLiveQuestionModalOpen, setIsLiveQuestionModalOpen] = useState(false);
  const [isLiveQuestionLoading, setIsLiveQuestionLoading] = useState(false);
  
  // Playback
  const [isPodcastPlaying, setIsPodcastPlaying] = useState(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  
  // Summary & Overview
  const [summary, setSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>([]);
  const [isTakeawaysLoading, setIsTakeawaysLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);


  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frequencyDataRef = useRef<Uint8Array | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const playbackQueueRef = useRef<ChatMessage[]>([]);
  const currentPlaybackIndexRef = useRef<number>(0);
  const resumeAfterIdRef = useRef<string | null>(null);
  const introMusicBufferRef = useRef<AudioBuffer | null>(null);
  const outroMusicBufferRef = useRef<AudioBuffer | null>(null);
  const isPlayingRef = useRef(isPodcastPlaying);

  useEffect(() => {
    isPlayingRef.current = isPodcastPlaying;
  }, [isPodcastPlaying]);


  useEffect(() => {
    if (!audioContextRef.current) {
        try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
            audioContextRef.current = context;

            const analyser = context.createAnalyser();
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            frequencyDataRef.current = new Uint8Array(bufferLength);
            analyser.connect(context.destination);
            analyserRef.current = analyser;
            
            const loadMusicAssets = async () => {
                if (!context) return;
                try {
                    const introData = decode(INTRO_MUSIC_BASE64).buffer;
                    introMusicBufferRef.current = await context.decodeAudioData(introData);
                    const outroData = decode(OUTRO_MUSIC_BASE64).buffer;
                    outroMusicBufferRef.current = await context.decodeAudioData(outroData);
                } catch (error) {
                    console.error("Failed to decode music assets:", error);
                }
            };
            loadMusicAssets();

        } catch (e) {
            console.error("Web Audio API is not supported in this browser.", e);
        }
    }
    return () => {
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
        }
    };
  }, []);

  const setMessageRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
        messageRefs.current.set(id, el);
    } else {
        messageRefs.current.delete(id);
    }
  }, []);

    const visualizeAudio = useCallback(() => {
        if (!isPlayingRef.current || !analyserRef.current || !frequencyDataRef.current) {
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
            return;
        };
        analyserRef.current.getByteFrequencyData(frequencyDataRef.current);
        setCurrentlyPlayingId(prev => prev);
        animationFrameIdRef.current = requestAnimationFrame(visualizeAudio);
    }, []);

    useEffect(() => {
        if (isPodcastPlaying) {
            animationFrameIdRef.current = requestAnimationFrame(visualizeAudio);
        } else {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        }
        return () => {
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        }
    }, [isPodcastPlaying, visualizeAudio]);

  useEffect(() => {
    const synthesizeNewMessages = async () => {
        if (audioContextRef.current?.state === 'suspended') {
            return;
        }

        const aiMessages = messages.filter(
            m => (m.speaker === Speaker.Alex || m.speaker === Speaker.Ben) && !m.audioBuffer
        );

        if (aiMessages.length > 0) {
            setSynthesisProgress(prev => ({ ...prev, total: prev.total + aiMessages.length }));

            for (const msg of aiMessages) {
                if (msg.audioBuffer) continue;
                
                setIsAudioLoadingId(msg.id);
                try {
                    const voiceName = msg.speaker === Speaker.Alex ? alexVoice : benVoice;
                    const base64Audio = await generateSpeech(msg.text, voiceName);
                    const audioData = decode(base64Audio);
                    if (audioContextRef.current) {
                        const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, SAMPLE_RATE, NUM_CHANNELS);
                        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, audioBuffer } : m));
                    }
                } catch (error) {
                    console.error(`Failed to synthesize audio for message ${msg.id}`, error);
                } finally {
                    setSynthesisProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
                }
            }
             setIsAudioLoadingId(null);
        } else if (isLoading && generationStage === 'synthesis') {
            setIsLoading(false);
        }
    };

    synthesizeNewMessages();
  }, [messages, alexVoice, benVoice, isLoading, generationStage]);

  const stopPodcastPlayback = useCallback(() => {
    sourceNodesRef.current.forEach(source => source.stop());
    sourceNodesRef.current.clear();
    setIsPodcastPlaying(false);
    setCurrentlyPlayingId(null);
    setHighlightedMessageId(null);
  }, []);
  
const playSequence = useCallback(async () => {
    if (currentPlaybackIndexRef.current >= playbackQueueRef.current.length) {
        if (isPlayingRef.current && outroMusicBufferRef.current && audioContextRef.current) {
            setHighlightedMessageId(null);
            const outroSource = audioContextRef.current.createBufferSource();
            outroSource.buffer = outroMusicBufferRef.current;
            outroSource.connect(analyserRef.current!);
            outroSource.onended = () => {
                sourceNodesRef.current.delete('outro-music');
                stopPodcastPlayback();
            };
            outroSource.start();
            sourceNodesRef.current.set('outro-music', outroSource);
        } else {
            stopPodcastPlayback();
        }
        return;
    }

    let message = playbackQueueRef.current[currentPlaybackIndexRef.current];
    
    if (!message.audioBuffer) {
        setIsAudioLoadingId(message.id);
        try {
            if (!audioContextRef.current) throw new Error("AudioContext is not available");
            if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
            
            const voiceName = message.speaker === Speaker.Alex ? alexVoice : benVoice;
            const base64Audio = await generateSpeech(message.text, voiceName);
            const audioData = decode(base64Audio);
            const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, SAMPLE_RATE, NUM_CHANNELS);

            const updatedMessage = { ...message, audioBuffer };
            setMessages(prev => prev.map(m => m.id === message.id ? updatedMessage : m));
            playbackQueueRef.current[currentPlaybackIndexRef.current] = updatedMessage;
            message = updatedMessage;
        } catch (error) {
            console.error(`JIT Synthesis failed for message ${message.id}:`, error);
            stopPodcastPlayback();
            return;
        } finally {
            setIsAudioLoadingId(null);
        }
    }
    
    if (!message?.audioBuffer || !audioContextRef.current) {
        currentPlaybackIndexRef.current++;
        await playSequence();
        return;
    }
    
    setHighlightedMessageId(message.id);
    const messageEl = messageRefs.current.get(message.id);
    messageEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const source = audioContextRef.current.createBufferSource();
    source.buffer = message.audioBuffer;
    source.connect(analyserRef.current!);
    
    source.onended = () => {
        sourceNodesRef.current.delete(message.id);
        if (isPlayingRef.current) {
            currentPlaybackIndexRef.current++;
            playSequence();
        }
    };

    source.start();
    sourceNodesRef.current.set(message.id, source);
}, [stopPodcastPlayback, alexVoice, benVoice]);

const handlePlayFullPodcast = useCallback(async (startAfterId: string | null = null) => {
    if (isPodcastPlaying) {
        stopPodcastPlayback();
        return;
    }

    if (!audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
    }

    setIsPodcastPlaying(true);
    const allMessages = messages.filter(m => m.speaker === Speaker.Alex || m.speaker === Speaker.Ben);
    
    let startIndex = 0;
    if (startAfterId) {
        const resumeIndex = allMessages.findIndex(m => m.id === startAfterId);
        if (resumeIndex !== -1) {
            startIndex = resumeIndex + 1;
        }
    }

    if (startIndex >= allMessages.length && allMessages.length > 0) {
        if (outroMusicBufferRef.current) {
            const outroSource = audioContextRef.current.createBufferSource();
            outroSource.buffer = outroMusicBufferRef.current;
            outroSource.connect(analyserRef.current!);
            outroSource.onended = () => stopPodcastPlayback();
            outroSource.start();
            sourceNodesRef.current.set('outro-music', outroSource);
        } else {
            stopPodcastPlayback();
        }
        return;
    }

    playbackQueueRef.current = allMessages;
    currentPlaybackIndexRef.current = startIndex;

    if (startIndex === 0 && introMusicBufferRef.current) {
        const introSource = audioContextRef.current.createBufferSource();
        introSource.buffer = introMusicBufferRef.current;
        introSource.connect(analyserRef.current!);
        introSource.onended = () => {
            sourceNodesRef.current.delete('intro-music');
            if (isPlayingRef.current) {
                playSequence();
            }
        };
        introSource.start();
        sourceNodesRef.current.set('intro-music', introSource);
    } else {
        playSequence();
    }
}, [messages, isPodcastPlaying, stopPodcastPlayback, playSequence]);
  
    const handleSendMessage = async (prompt: string) => {
    const alexVoiceData = VOICES.find(v => v.name === alexVoice);
    const benVoiceData = VOICES.find(v => v.name === benVoice);
    let currentCost = PODCAST_GENERATION_COST;
    if (alexVoiceData?.tier === 'Premium' || benVoiceData?.tier === 'Premium') {
        currentCost += PREMIUM_VOICE_COST_ADDON;
    }
    
    if (credits < currentCost) {
        setIsCreditModalOpen(true);
        return;
    }
    
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
    }
    
    stopPodcastPlayback();
    setIsLoading(true);
    setMessages([]);
    setSummary('');
    setKeyTakeaways([]);
    setSavedClips([]);
    setFinalScript([]);
    setActiveSourceId(null);
    setGenerationStage('script');
    setSynthesisProgress({ completed: 0, total: 0 });

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, speaker: Speaker.User, text: prompt };
    setMessages([userMessage]);
    
    try {
      const podcastMessages = await generatePodcast(prompt, sources);
      deductCredits(currentCost);

      setGenerationStage('synthesis');
      setMessages(prev => [...prev, ...podcastMessages]);
    } catch (error) {
      console.error("Failed to generate podcast:", error);
      setIsLoading(false);
    }
  };

  const handleSubmitLiveQuestion = async (question: string) => {
    setIsLiveQuestionLoading(true);
    try {
        const introMessage: ChatMessage = {
            id: `live-q-intro-${Date.now()}`,
            speaker: Speaker.Ben,
            text: "Hold on, it looks like we have a live question coming in...",
        };
        const questionMessage: ChatMessage = {
            id: `live-q-user-${Date.now()}`,
            speaker: Speaker.Alex,
            text: `The question is: "${question}"`,
        };

        const answerMessage = await answerLiveQuestion(messages, question, sources);
        
        const playingMessageIndex = messages.findIndex(m => m.id === highlightedMessageId);
        const insertionIndex = playingMessageIndex !== -1 ? playingMessageIndex + 1 : messages.length;
        
        const newMessages = [...messages];
        newMessages.splice(insertionIndex, 0, introMessage, questionMessage, answerMessage);

        resumeAfterIdRef.current = answerMessage.id;
        
        setMessages(newMessages);

    } catch (error) {
        console.error("Failed to handle live question:", error);
    } finally {
        setIsLiveQuestionLoading(false);
        setIsLiveQuestionModalOpen(false);
    }
  };
  
    const handleInitiateLiveQuestion = () => {
        resumeAfterIdRef.current = highlightedMessageId;
        stopPodcastPlayback();
        setIsLiveQuestionModalOpen(true);
    };

    const handleGenerateSummary = async () => {
        setIsSummaryLoading(true);
        try {
            const result = await generateSummary(messages.filter(m => m.speaker !== Speaker.User));
            setSummary(result);
        } catch (error) {
            console.error("Failed to generate summary", error);
        } finally {
            setIsSummaryLoading(false);
        }
    };

    const handleGenerateTakeaways = async () => {
      setIsTakeawaysLoading(true);
      try {
          const takeaways = await generateKeyTakeaways(messages.filter(m => m.speaker !== Speaker.User));
          setKeyTakeaways(takeaways);
      } catch (error) {
          console.error("Failed to generate key takeaways", error);
      } finally {
          setIsTakeawaysLoading(false);
      }
    };

    const handleRefineScript = async (instruction: string) => {
        setIsRefining(true);
        try {
            const refined = await refineScript(finalScript, instruction);
            const refinedWithIds = refined.map((item, index) => ({
                ...item,
                id: `refined-${Date.now()}-${index}`,
                speaker: item.speaker === 'ALEX' ? Speaker.Alex : Speaker.Ben,
            }));
            setFinalScript(refinedWithIds);
        } catch (error) {
            console.error("Error refining script", error);
        } finally {
            setIsRefining(false);
        }
    };

    const handleCitationClick = (sourceId: string, quote: string) => {
        setActiveSourceId(sourceId);
        setHighlightedQuote(quote);
    };
    
    const handleImportProject = (data: ProjectData) => {
      if (
        Array.isArray(data.sources) &&
        Array.isArray(data.savedClips) &&
        Array.isArray(data.finalScript)
      ) {
        stopPodcastPlayback();
        setSources(data.sources);
        setSavedClips(data.savedClips);
        setFinalScript(data.finalScript);
        setMessages([]);
        setSummary('');
        setKeyTakeaways([]);
        setActiveSourceId(null);
        setActiveView('notebook');
        // A toast notification would be better here in a real app
        alert('Project imported successfully!');
      } else {
        alert('Invalid project file format.');
      }
    };

    const handleAddSource = async (sourceData: Omit<Source, 'id' | 'intel' | 'isIntelLoading'>) => {
        const newSource: Source = {
            ...sourceData,
            id: `source-${Date.now()}`,
            isIntelLoading: true,
        };
        setSources(prev => [...prev, newSource]);

        try {
            const intel = await generateSourceIntel(newSource.content);
            setSources(prev => prev.map(s => 
                s.id === newSource.id ? { ...s, intel, isIntelLoading: false } : s
            ));
        } catch (error) {
            console.error("Failed to generate intel for source:", newSource.id, error);
            // still set loading to false on error so it doesn't spin forever
            setSources(prev => prev.map(s => 
                s.id === newSource.id ? { ...s, isIntelLoading: false } : s
            ));
        }
    };

    const activeSource = sources.find(s => s.id === activeSourceId);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        sources={sources}
        onAddSource={handleAddSource}
        onRemoveSource={(id) => {
            setSources(prev => prev.filter(s => s.id !== id));
            if (activeSourceId === id) setActiveSourceId(null);
        }}
        onViewSource={(id) => setActiveSourceId(id)}
        activeSourceId={activeSourceId}
        highlightedSourceId={highlightedSourceId}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        alexVoice={alexVoice}
        benVoice={benVoice}
        onAlexVoiceChange={setAlexVoice}
        onBenVoiceChange={setBenVoice}
        credits={isCreditsLoading ? 0 : credits}
        onNavigateToStore={() => onNavigate('credit_store')}
        onImportProject={handleImportProject}
      />
      <main className={`flex-1 flex flex-col relative bg-[var(--bg-main)] transition-all duration-300 ease-in-out`}>
         <button onClick={() => setIsSidebarOpen(true)} className={`absolute top-4 left-4 z-30 p-2 rounded-md hover:bg-[var(--bg-accent-primary)]/20 text-[var(--text-accent-primary)] md:hidden ${isSidebarOpen ? 'hidden' : 'block'}`} aria-label="Open sidebar">
             <MenuIcon className="w-6 h-6" />
        </button>
        
        <div className="border-b border-[var(--border-primary)] px-6 pt-2">
            <div className="flex space-x-2">
                <TabButton label="Conversation" isActive={activeView === 'conversation'} onClick={() => setActiveView('conversation')} />
                <TabButton label="Notebook" isActive={activeView === 'notebook'} onClick={() => setActiveView('notebook')} />
                <TabButton label="Podcast Overview" isActive={activeView === 'overview'} onClick={() => setActiveView('overview')} />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
             {activeView === 'conversation' && (
                <ChatView 
                    messages={messages}
                    isLoading={isLoading}
                    onPlayPause={() => {}}
                    currentlyPlayingId={currentlyPlayingId}
                    isAudioLoadingId={isAudioLoadingId}
                    onPlayFullPodcast={() => handlePlayFullPodcast(resumeAfterIdRef.current)}
                    isPodcastPlaying={isPodcastPlaying}
                    isPodcastLoading={isPodcastLoading}
                    highlightedMessageId={highlightedMessageId}
                    frequencyData={frequencyDataRef.current}
                    onAskLiveQuestion={handleInitiateLiveQuestion}
                    setMessageRef={setMessageRef}
                    generationStage={generationStage}
                    synthesisProgress={synthesisProgress}
                    onHighlightSource={setHighlightedSourceId}
                    onCitationClick={handleCitationClick}
                />
             )}
             {activeView === 'notebook' && (
                <ScriptEditor
                    messages={messages}
                    savedClips={savedClips}
                    finalScript={finalScript}
                    onSaveClip={(c) => setSavedClips(p => p.find(pc => pc.id === c.id) ? p : [...p, c])}
                    onRemoveClip={(id) => {
                        setSavedClips(p => p.filter(c => c.id !== id));
                        setFinalScript(p => p.filter(c => c.id !== id));
                    }}
                    onUpdateFinalScript={setFinalScript}
                    onRefineScript={handleRefineScript}
                    isRefining={isRefining}
                />
             )}
             {activeView === 'overview' && (
                 <PodcastOverview
                    script={messages.filter(m => m.speaker !== Speaker.User)}
                    summary={summary}
                    isSummaryLoading={isSummaryLoading}
                    onGenerateSummary={handleGenerateSummary}
                    keyTakeaways={keyTakeaways}
                    isTakeawaysLoading={isTakeawaysLoading}
                    onGenerateTakeaways={handleGenerateTakeaways}
                    sources={sources}
                    savedClips={savedClips}
                    finalScript={finalScript}
                 />
             )}
          </div>
        </div>
        
        <div className="p-4 md:p-6 bg-[var(--bg-surface-glass)]/50 backdrop-blur-sm border-t border-[var(--border-primary)]">
          <div className="max-w-4xl mx-auto">
            <InputBar onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </div>
      </main>
        
        <SourceViewer 
            source={activeSource}
            highlightedQuote={highlightedQuote}
            onClose={() => setActiveSourceId(null)}
        />

      <LiveQuestionModal
        isOpen={isLiveQuestionModalOpen}
        onClose={() => {
            setIsLiveQuestionModalOpen(false);
            if (resumeAfterIdRef.current) {
                handlePlayFullPodcast(resumeAfterIdRef.current);
            }
        }}
        onSubmit={handleSubmitLiveQuestion}
        isLoading={isLiveQuestionLoading}
      />
      <CreditModal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        onGoToStore={() => {
            setIsCreditModalOpen(false);
            onNavigate('credit_store');
        }}
      />
    </div>
  );
};