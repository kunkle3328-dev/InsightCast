import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { ChatView } from './ChatView';
import { InputBar } from './InputBar';
import { LiveQuestionModal } from './LiveQuestionModal';
import { CreditModal } from './CreditModal';
import { ChatMessage, Source, Speaker } from '../types';
import { generatePodcast, answerLiveQuestion, generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { INTRO_MUSIC_BASE64, OUTRO_MUSIC_BASE64 } from '../utils/audioAssets';
import { useCredits } from '../hooks/useCredits';

const SAMPLE_RATE = 24000;
const NUM_CHANNELS = 1;
const PODCAST_GENERATION_COST = 10;

interface StudioProps {
    onNavigate: (view: 'credit_store') => void;
}

export const Studio: React.FC<StudioProps> = ({ onNavigate }) => {
  const [sources, setSources] = useState<Source[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Credit system
  const { credits, deductCredits, isLoading: isCreditsLoading } = useCredits();
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);

  // Voice selection state
  const [alexVoice, setAlexVoice] = useState('Zephyr');
  const [benVoice, setBenVoice] = useState('Puck');

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioLoadingId, setIsAudioLoadingId] = useState<string | null>(null);
  const [isPodcastLoading, setIsPodcastLoading] = useState(false);
  const [isLiveQuestionLoading, setIsLiveQuestionLoading] = useState(false);
  
  // Playback states
  const [isPodcastPlaying, setIsPodcastPlaying] = useState(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // Modal state
  const [isLiveQuestionModalOpen, setIsLiveQuestionModalOpen] = useState(false);

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mainSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frequencyDataRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Element refs for scrolling
  const messageRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize AudioContext
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        analyser.connect(audioContextRef.current.destination);
        analyserRef.current = analyser;
        frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
  }, []);

  const getVoiceForSpeaker = (speaker: Speaker) => {
    return speaker === Speaker.Alex ? alexVoice : benVoice;
  };

  const synthesizeAndCacheAudio = useCallback(async (message: ChatMessage): Promise<AudioBuffer | undefined> => {
    if (message.audioBuffer) return message.audioBuffer;
    if (message.speaker === Speaker.User) return;

    setIsAudioLoadingId(message.id);
    try {
      const voiceName = getVoiceForSpeaker(message.speaker);
      const base64Audio = await generateSpeech(message.text, voiceName);
      const audioData = decode(base64Audio);
      if (!audioContextRef.current) initAudioContext();
      const audioBuffer = await decodeAudioData(audioData, audioContextRef.current!, SAMPLE_RATE, NUM_CHANNELS);
      
      setMessages(prev => prev.map(m => m.id === message.id ? { ...m, audioBuffer } : m));
      return audioBuffer;
    } catch (error) {
      console.error("Failed to synthesize audio for message:", message.id, error);
      return undefined;
    } finally {
      setIsAudioLoadingId(null);
    }
  }, [alexVoice, benVoice, initAudioContext]);

  const stopAllPlayback = useCallback(() => {
    mainSourceNodeRef.current?.stop();
    mainSourceNodeRef.current = null;
    setIsPodcastPlaying(false);
    setCurrentlyPlayingId(null);
    setHighlightedMessageId(null);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  }, []);

  const handlePlayPause = useCallback(async (message: ChatMessage) => {
    initAudioContext();
    if (currentlyPlayingId === message.id) {
      stopAllPlayback();
      return;
    }

    const audioBuffer = await synthesizeAndCacheAudio(message);
    if (audioBuffer && audioContextRef.current) {
      if (mainSourceNodeRef.current) mainSourceNodeRef.current.stop();
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyserRef.current!);
      source.onended = () => {
        setCurrentlyPlayingId(null);
        setHighlightedMessageId(null);
      };
      source.start();
      mainSourceNodeRef.current = source;
      setCurrentlyPlayingId(message.id);
      setHighlightedMessageId(message.id);
    }
  }, [currentlyPlayingId, synthesizeAndCacheAudio, initAudioContext, stopAllPlayback]);
  
  const handlePlayFullPodcast = useCallback(async () => {
    initAudioContext();
    if (isPodcastPlaying) {
      stopAllPlayback();
      return;
    }
    
    setIsPodcastLoading(true);
    setIsPodcastPlaying(true);

    const podcastMessages = messages.filter(m => m.speaker !== Speaker.User);
    
    const sourcesToPlay: {id: string, source: AudioBufferSourceNode, duration: number}[] = [];

    const introBuffer = await decodeAudioData(decode(INTRO_MUSIC_BASE64), audioContextRef.current!, SAMPLE_RATE, NUM_CHANNELS);
    const introSource = audioContextRef.current!.createBufferSource();
    introSource.buffer = introBuffer;
    sourcesToPlay.push({id: 'intro', source: introSource, duration: introBuffer.duration});

    for (const message of podcastMessages) {
      const buffer = await synthesizeAndCacheAudio(message);
      if (buffer) {
        const source = audioContextRef.current!.createBufferSource();
        source.buffer = buffer;
        sourcesToPlay.push({ id: message.id, source, duration: buffer.duration });
      }
    }
    
    const outroBuffer = await decodeAudioData(decode(OUTRO_MUSIC_BASE64), audioContextRef.current!, SAMPLE_RATE, NUM_CHANNELS);
    const outroSource = audioContextRef.current!.createBufferSource();
    outroSource.buffer = outroBuffer;
    sourcesToPlay.push({id: 'outro', source: outroSource, duration: outroBuffer.duration});

    setIsPodcastLoading(false);

    let nextStartTime = audioContextRef.current!.currentTime;
    sourcesToPlay.forEach(({ id, source, duration }) => {
        source.connect(analyserRef.current!);
        const scheduledTime = nextStartTime;
        source.start(scheduledTime);

        setTimeout(() => {
          setHighlightedMessageId(id);
        }, (scheduledTime - audioContextRef.current!.currentTime) * 1000);

        nextStartTime += duration;
    });

    const totalDuration = nextStartTime - audioContextRef.current!.currentTime;
    setTimeout(stopAllPlayback, totalDuration * 1000);

  }, [isPodcastPlaying, messages, synthesizeAndCacheAudio, stopAllPlayback, initAudioContext]);
  
  const handleSendMessage = async (prompt: string) => {
    if (credits < PODCAST_GENERATION_COST) {
        setIsCreditModalOpen(true);
        return;
    }

    setIsLoading(true);
    stopAllPlayback();

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, speaker: Speaker.User, text: prompt };
    setMessages([userMessage]);
    
    try {
      const sourceMaterial = sources.map(s => `--- ${s.name} ---\n${s.content}`).join('\n\n');
      const podcastMessages = await generatePodcast(prompt, sourceMaterial);
      deductCredits(PODCAST_GENERATION_COST);
      setMessages(prev => [...prev, ...podcastMessages]);
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = { id: `error-${Date.now()}`, speaker: Speaker.Alex, text: "I seem to be having trouble connecting. Let's try that again later." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitLiveQuestion = async (question: string) => {
    setIsLiveQuestionLoading(true);
    try {
        const sourceMaterial = sources.map(s => `--- ${s.name} ---\n${s.content}`).join('\n\n');
        const answerMessage = await answerLiveQuestion(messages, question, sourceMaterial);
        
        stopAllPlayback();
        setIsLiveQuestionModalOpen(false);
        setMessages(prev => [...prev, answerMessage]);
        
        handlePlayPause(answerMessage);

    } catch (error) {
        console.error("Failed to answer live question:", error);
    } finally {
        setIsLiveQuestionLoading(false);
    }
  };
  
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);
  useEffect(() => {
    const loop = () => {
        if (analyserRef.current && frequencyDataRef.current) {
            analyserRef.current.getByteFrequencyData(frequencyDataRef.current);
            setFrequencyData(new Uint8Array(frequencyDataRef.current));
        }
        animationFrameRef.current = requestAnimationFrame(loop);
    };
    if (isPodcastPlaying || currentlyPlayingId) {
        loop();
    } else {
        setFrequencyData(null);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPodcastPlaying, currentlyPlayingId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        sources={sources}
        onAddSource={(source) => setSources(prev => [...prev, source])}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        alexVoice={alexVoice}
        benVoice={benVoice}
        onAlexVoiceChange={setAlexVoice}
        onBenVoiceChange={setBenVoice}
        credits={isCreditsLoading ? 0 : credits}
        onNavigateToStore={() => onNavigate('credit_store')}
      />
      <main className="flex-1 flex flex-col relative">
        <button onClick={() => setIsSidebarOpen(true)} className={`absolute top-4 left-4 z-30 p-2 rounded-md hover:bg-cyan-500/20 text-cyan-400 md:hidden ${isSidebarOpen ? 'hidden' : 'block'}`} aria-label="Open sidebar">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
        </button>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <ChatView 
              messages={messages}
              isLoading={isLoading}
              onPlayPause={handlePlayPause}
              currentlyPlayingId={currentlyPlayingId}
              isAudioLoadingId={isAudioLoadingId}
              onPlayFullPodcast={handlePlayFullPodcast}
              isPodcastPlaying={isPodcastPlaying}
              isPodcastLoading={isPodcastLoading}
              highlightedMessageId={highlightedMessageId}
              frequencyData={frequencyData}
              onAskLiveQuestion={() => setIsLiveQuestionModalOpen(true)}
              setMessageRef={(id, el) => messageRefs.current.set(id, el)}
            />
             <div ref={chatEndRef} />
          </div>
        </div>
        
        <div className="p-4 md:p-6 bg-black/10 backdrop-blur-sm border-t border-cyan-500/20">
          <div className="max-w-4xl mx-auto">
            <InputBar onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </div>
      </main>

      <LiveQuestionModal
        isOpen={isLiveQuestionModalOpen}
        onClose={() => setIsLiveQuestionModalOpen(false)}
        onSubmit={handleSubmitLiveQuestion}
        isLoading={isLiveQuestionLoading}
      />
      <CreditModal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        onGoToStore={() => onNavigate('credit_store')}
      />
    </div>
  );
};
