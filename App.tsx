
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { InputBar } from './components/InputBar';
import { Source, ChatMessage, Speaker } from './types';
import { generatePodcast, generateSpeech, answerLiveQuestion } from './services/geminiService';
import { LogoIcon } from './components/icons';
import { decode, decodeAudioData, concatAudioBuffers } from './utils/audioUtils';
import { INTRO_MUSIC_BASE64, OUTRO_MUSIC_BASE64 } from './utils/audioAssets';
import { LoadingScreen } from './components/LoadingScreen';
import { LiveQuestionModal } from './components/LiveQuestionModal';

const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  const [sources, setSources] = useState<Source[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Voice selection state
  const [alexVoice, setAlexVoice] = useState('Zephyr');
  const [benVoice, setBenVoice] = useState('Charon');

  // Individual audio state
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [isAudioLoadingId, setIsAudioLoadingId] = useState<string | null>(null);
  
  // Full podcast playback state
  const [isPodcastPlaying, setIsPodcastPlaying] = useState<boolean>(false);
  const [isPodcastLoading, setIsPodcastLoading] = useState<boolean>(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);

  // Live question state
  const [isAskingLiveQuestion, setIsAskingLiveQuestion] = useState<boolean>(false);
  const [podcastPausedAt, setPodcastPausedAt] = useState<number | null>(null);
  const [isAnsweringLiveQuestion, setIsAnsweringLiveQuestion] = useState<boolean>(false);

  const audioCache = useRef(new Map<string, AudioBuffer>());
  const audioAssetsCache = useRef(new Map<string, AudioBuffer>());
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const playbackTimestampsRef = useRef<{ id: string, startTime: number, endTime: number }[]>([]);
  const fullPodcastBufferRef = useRef<AudioBuffer | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    // Auto-scroll to highlighted message
    if (highlightedMessageId && messageRefs.current[highlightedMessageId]) {
      messageRefs.current[highlightedMessageId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightedMessageId]);

  useEffect(() => {
    setTimeout(() => setIsAppLoading(false), 1500);
  }, []);

  const stopCurrentPlayback = useCallback((stopFullPodcast = true) => {
    if (audioSourceRef.current) {
      audioSourceRef.current.onended = null;
      try { audioSourceRef.current.stop(); } catch (e) { /* Already stopped */ }
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
     if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    setFrequencyData(null);
    setCurrentlyPlayingId(null);
    if (stopFullPodcast) {
      setIsPodcastPlaying(false);
      setHighlightedMessageId(null);
      setPodcastPausedAt(null);
    }
  }, []);

  const playAudioBuffer = useCallback((audioBuffer: AudioBuffer, messageId: string, onEndedCallback?: () => void) => {
    if (!audioContextRef.current) return;
    stopCurrentPlayback();
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.start();
    setCurrentlyPlayingId(messageId);
    audioSourceRef.current = source;
    source.onended = () => {
      if (audioSourceRef.current === source) {
        setCurrentlyPlayingId(null);
        audioSourceRef.current = null;
        onEndedCallback?.();
      }
    };
  }, [stopCurrentPlayback]);
  
  const startVisualizationAndHighlightingLoop = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    
    let lastHighlightedId: string | null = null;
    const dataArray = analyserRef.current ? new Uint8Array(analyserRef.current.frequencyBinCount) : null;
    
    const loop = () => {
      if (!audioSourceRef.current || !audioContextRef.current) {
        setFrequencyData(null);
        setHighlightedMessageId(null);
        return;
      }
      
      // Update visualizer data
      if (analyserRef.current && dataArray) {
          analyserRef.current.getByteFrequencyData(dataArray);
          setFrequencyData(new Uint8Array(dataArray));
      }
      
      // Update highlighted message
      const elapsed = audioContextRef.current.currentTime - playbackStartTimeRef.current;
      const activeMessage = playbackTimestampsRef.current.find(
          ts => elapsed >= ts.startTime && elapsed < ts.endTime
      );
      const activeId = activeMessage ? activeMessage.id : null;
      
      if (activeId !== lastHighlightedId) {
          setHighlightedMessageId(activeId);
          lastHighlightedId = activeId;
      }

      animationFrameIdRef.current = requestAnimationFrame(loop);
    };
    animationFrameIdRef.current = requestAnimationFrame(loop);
  }, []);


  const startPodcastAudio = useCallback((startTime: number) => {
    if (!fullPodcastBufferRef.current || !audioContextRef.current) return;
    
    stopCurrentPlayback(false); // Stop any individual playback
    
    const audioContext = audioContextRef.current;
    const source = audioContext.createBufferSource();
    source.buffer = fullPodcastBufferRef.current;
    
    if (!analyserRef.current) {
       analyserRef.current = audioContext.createAnalyser();
       analyserRef.current.fftSize = 256;
    }
    
    source.connect(analyserRef.current);
    analyserRef.current.connect(audioContext.destination);

    source.start(0, startTime);
    playbackStartTimeRef.current = audioContext.currentTime - startTime;
    
    setIsPodcastPlaying(true);
    setPodcastPausedAt(null);
    
    setTimeout(startVisualizationAndHighlightingLoop, 0);

    audioSourceRef.current = source;
    
    source.onended = () => {
      if (audioSourceRef.current === source) {
        stopCurrentPlayback();
      }
    };
  }, [stopCurrentPlayback, startVisualizationAndHighlightingLoop]);

  const resumePodcastPlayback = useCallback(() => {
      if (podcastPausedAt !== null) {
          startPodcastAudio(podcastPausedAt);
      }
  }, [podcastPausedAt, startPodcastAudio]);

  const handlePlayFullPodcast = useCallback(async () => {
    if (isPodcastPlaying) {
        if (!audioContextRef.current) return;
        const elapsed = audioContextRef.current.currentTime - playbackStartTimeRef.current;
        stopCurrentPlayback();
        setPodcastPausedAt(elapsed > 0 ? elapsed : 0);
        return;
    }
    
    if (podcastPausedAt !== null) {
      resumePodcastPlayback();
      return;
    }
    
    stopCurrentPlayback(false);
    setError(null);
    setIsPodcastLoading(true);

    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }
    const audioContext = audioContextRef.current;

    const podcastMessages = messages.filter(m => m.speaker === Speaker.Alex || m.speaker === Speaker.Ben);

    try {
        const decodeAsset = async (name: string, data: string) => {
            if (audioAssetsCache.current.has(name)) return audioAssetsCache.current.get(name)!;
            const buffer = await decodeAudioData(decode(data), audioContext, 24000, 1);
            audioAssetsCache.current.set(name, buffer);
            return buffer;
        }

      const [introBuffer, outroBuffer, ...speechBuffers] = await Promise.all([
        decodeAsset('intro', INTRO_MUSIC_BASE64),
        decodeAsset('outro', OUTRO_MUSIC_BASE64),
        ...podcastMessages.map(async (message) => {
          if (audioCache.current.has(message.id)) {
            return audioCache.current.get(message.id)!;
          }
          const voiceName = message.speaker === Speaker.Alex ? alexVoice : benVoice;
          const base64Audio = await generateSpeech(message.text, voiceName);
          const decodedBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
          audioCache.current.set(message.id, decodedBuffer);
          return decodedBuffer;
        })
      ]);

      fullPodcastBufferRef.current = concatAudioBuffers([introBuffer, ...speechBuffers, outroBuffer], audioContext);
      
      let currentTime = introBuffer.duration;
      playbackTimestampsRef.current = speechBuffers.map((buffer, index) => {
        const startTime = currentTime;
        const endTime = startTime + buffer.duration;
        currentTime = endTime;
        return { id: podcastMessages[index].id, startTime, endTime };
      });
      
      startPodcastAudio(0); // Play from the beginning

    } catch (err) {
      console.error(err);
      setError('Sorry, could not generate the full podcast audio.');
      stopCurrentPlayback();
    } finally {
      setIsPodcastLoading(false);
    }
  }, [isPodcastPlaying, messages, stopCurrentPlayback, resumePodcastPlayback, podcastPausedAt, alexVoice, benVoice, startPodcastAudio]);

  const handlePlayPause = useCallback(async (message: ChatMessage) => {
    if (currentlyPlayingId === message.id) {
      stopCurrentPlayback();
      return;
    }

    stopCurrentPlayback();

    if (audioCache.current.has(message.id)) {
      playAudioBuffer(audioCache.current.get(message.id)!, message.id);
      return;
    }

    setIsAudioLoadingId(message.id);
    setError(null);

    try {
      const voiceName = message.speaker === Speaker.Alex ? alexVoice : benVoice;
      const base64Audio = await generateSpeech(message.text, voiceName);
      
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }
      
      const audioContext = audioContextRef.current;
      const decodedBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
      
      audioCache.current.set(message.id, decodedBuffer);

      if (isAudioLoadingId === message.id) {
          playAudioBuffer(decodedBuffer, message.id);
      }
    } catch (err) {
      console.error(err);
      setError('Sorry, could not generate audio for this message.');
    } finally {
       if (isAudioLoadingId === message.id) {
        setIsAudioLoadingId(null);
      }
    }
  }, [currentlyPlayingId, isAudioLoadingId, playAudioBuffer, stopCurrentPlayback, alexVoice, benVoice]);

  const handleToggleLiveQuestion = useCallback(() => {
    if (!audioContextRef.current || !isPodcastPlaying) return;
    
    const elapsed = audioContextRef.current.currentTime - playbackStartTimeRef.current;
    stopCurrentPlayback(false); // Stop playback but keep podcast state
    setIsPodcastPlaying(false); // Update button state
    setPodcastPausedAt(elapsed > 0 ? elapsed : 0);
    setIsAskingLiveQuestion(true);

  }, [isPodcastPlaying, stopCurrentPlayback]);
  
  const handleSendLiveQuestion = useCallback(async (question: string) => {
    setIsAnsweringLiveQuestion(true);
    setError(null);
    
    const sourceMaterial = sources.map(s => `Source (${s.type}): ${s.name}\nContent:\n${s.content}`).join('\n\n---\n\n');
    const scriptSoFar = messages.filter(m => m.speaker !== Speaker.User);

    try {
      const answerMessage = await answerLiveQuestion(scriptSoFar, question, sourceMaterial);
      
      const userQuestionMessage: ChatMessage = { id: `live-q-${Date.now()}`, speaker: Speaker.User, text: question };
      setMessages(prev => [...prev, userQuestionMessage, answerMessage]);

      const voiceName = answerMessage.speaker === Speaker.Alex ? alexVoice : benVoice;
      const base64Audio = await generateSpeech(answerMessage.text, voiceName);
      
      if (!audioContextRef.current) return;
      const decodedBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
      
      playAudioBuffer(decodedBuffer, answerMessage.id, resumePodcastPlayback);

    } catch (err) {
      console.error("Error handling live question: ", err);
      setError("Sorry, there was an error answering your question. Resuming podcast.");
      setTimeout(resumePodcastPlayback, 1000);
    } finally {
      setIsAnsweringLiveQuestion(false);
      setIsAskingLiveQuestion(false);
    }
  }, [messages, sources, playAudioBuffer, resumePodcastPlayback, alexVoice, benVoice]);

  const handleAddSource = useCallback((source: Source) => {
    setSources(prevSources => [...prevSources, source]);
  }, []);

  const handleSendMessage = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;
    
    audioCache.current.clear();
    fullPodcastBufferRef.current = null;
    playbackTimestampsRef.current = [];
    stopCurrentPlayback();
    setError(null);
    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      speaker: Speaker.User,
      text: prompt,
    };
    
    setMessages([userMessage]); 

    const sourceMaterial = sources.map(s => `Source (${s.type}): ${s.name}\nContent:\n${s.content}`).join('\n\n---\n\n');

    try {
      const podcastMessages = await generatePodcast(prompt, sourceMaterial);
      setMessages(prev => [userMessage, ...podcastMessages]);
    } catch (err) {
      console.error(err);
      setError('Sorry, something went wrong. Please try again.');
      setMessages([]); 
    } finally {
      setIsLoading(false);
    }
  }, [sources, stopCurrentPlayback]);
  
  const handleVoiceChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (newVoice: string) => {
    audioCache.current.clear();
    fullPodcastBufferRef.current = null;
    playbackTimestampsRef.current = [];
    stopCurrentPlayback();
    setter(newVoice);
  }

  const chatViewRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatViewRef.current && !highlightedMessageId && messages.length > 0) {
        // Scroll to bottom for new messages, but not when playback ends
        const lastMessage = messages[messages.length - 1];
        // FIX: The original condition was logically equivalent to this simpler one,
        // but was causing a TypeScript type error. This refactoring clarifies the
        // intent and resolves the error.
        if (lastMessage.speaker === Speaker.User || isLoading) {
            chatViewRef.current.scrollTop = chatViewRef.current.scrollHeight;
        }
    }
  }, [messages, highlightedMessageId, isLoading]);

  if (isAppLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen text-gray-100 font-sans antialiased futuristic-bg">
      <Sidebar 
        sources={sources} 
        onAddSource={handleAddSource} 
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        alexVoice={alexVoice}
        benVoice={benVoice}
        onAlexVoiceChange={handleVoiceChange(setAlexVoice)}
        onBenVoiceChange={handleVoiceChange(setBenVoice)}
      />
      
      <main className="flex flex-col flex-1 h-screen transition-all duration-300">
        <header className="flex items-center p-4 border-b border-cyan-500/20 bg-black/20 backdrop-blur-lg">
           <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
             className="p-2 mr-4 rounded-md hover:bg-cyan-500/20 text-cyan-400 md:hidden"
           >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
          <div className="flex items-center space-x-3">
            <LogoIcon className="w-8 h-8 text-cyan-400" />
            <h1 className="text-xl font-bold text-gray-200 text-shadow-cyan">AI Podcast Studio</h1>
          </div>
        </header>
        
        <div ref={chatViewRef} className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
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
            onAskLiveQuestion={handleToggleLiveQuestion}
            setMessageRef={(id, el) => messageRefs.current[id] = el}
          />
        </div>
        
        {error && (
          <div className="px-8 pb-4">
            <p className="text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-lg shadow-lg">{error}</p>
          </div>
        )}
        
        <div className="p-4 md:p-6 lg:p-8 border-t border-cyan-500/20 bg-black/20 backdrop-blur-lg">
          <InputBar onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
        <footer className="p-2 text-center text-xs text-gray-500 bg-black/20">
          <p>© 2025 Created By Corey English | EDC Media | All Rights Reserved.</p>
        </footer>
      </main>
      
      <LiveQuestionModal
        isOpen={isAskingLiveQuestion}
        onClose={() => {
            setIsAskingLiveQuestion(false);
            resumePodcastPlayback();
        }}
        onSubmit={handleSendLiveQuestion}
        isLoading={isAnsweringLiveQuestion}
      />
    </div>
  );
};

export default App;
