import React, { useState, useEffect } from 'react';
import { AetherWaveLogo, QuoteIcon, ChevronDownIcon, SourceIntelIcon, VoiceSynthIcon, DialogueEngineIcon, AlexIcon, BenIcon } from './icons';

interface LandingPageProps {
  onNavigate: (view: 'studio' | 'admin_login') => void;
}

const ShimmerCard: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`relative overflow-hidden ${className}`}>
        {children}
        <div 
            className="absolute top-0 left-0 w-full h-full shimmer-overlay"
            style={{
                background: `linear-gradient(110deg, transparent 40%, rgba(255, 255, 255, 0.1) 50%, transparent 60%)`,
                backgroundSize: '200% 100%',
                animation: `shimmer 5s infinite linear`,
            }}
        />
    </div>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <ShimmerCard className="bg-white/5 p-6 rounded-2xl border border-[var(--border-primary)] backdrop-blur-lg transition-all duration-300 hover:border-[var(--border-accent)]/50 hover:shadow-[0_0_35px_rgba(0,255,255,0.15)] hover:-translate-y-2">
    <div className="flex items-center space-x-4">
      <div className="bg-[var(--bg-accent-primary)]/10 p-3 rounded-xl border border-[var(--border-primary)]">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[var(--text-primary)]">{title}</h3>
    </div>
    <p className="mt-4 text-[var(--text-secondary)] leading-relaxed">
      {children}
    </p>
  </ShimmerCard>
);

const FaqItem: React.FC<{ q: string; a: string; }> = ({ q, a }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-[var(--border-primary)]">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left py-5">
                <span className="font-semibold text-lg text-[var(--text-primary)]">{q}</span>
                <ChevronDownIcon className={`w-6 h-6 text-[var(--text-accent-primary)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <p className="pb-5 text-[var(--text-secondary)] leading-relaxed">{a}</p>
                </div>
            </div>
        </div>
    );
};

const LiveUIDemo: React.FC = () => {
    const [messages, setMessages] = useState<any[]>([]);
    const demoScript = [
        { speaker: 'ALEX', text: 'Analyzing source data on quantum computing...' },
        { speaker: 'BEN', text: 'Fascinating stuff, ALEX. At its core, it feels less like computation and more like conducting an orchestra of probabilities, doesn\'t it?' },
        { speaker: 'ALEX', text: 'An imprecise but effective analogy, BEN. The core principle is superposition, allowing qubits to exist in multiple states simultaneously, leading to exponential processing power.' },
        { speaker: 'BEN', text: 'Right, it shatters the binary chains of classical computing. Imagine the implications for complex simulations... drug discovery, climate modeling... It\'s a paradigm shift.' },
    ];

    useEffect(() => {
        let messageIndex = 0;
        const interval = setInterval(() => {
            if (messageIndex < demoScript.length) {
                setMessages(prev => [...prev, { ...demoScript[messageIndex], isTyping: true }]);
                setTimeout(() => {
                    setMessages(prev => prev.map((msg, i) => i === messageIndex ? { ...msg, isTyping: false } : msg));
                    messageIndex++;
                }, 1500); // Typing animation duration
            } else {
                // Reset animation
                messageIndex = 0;
                setMessages([]);
            }
        }, 3000); // Time between messages

        return () => clearInterval(interval);
    }, []);

    return (
        <ShimmerCard className="w-full max-w-2xl mx-auto mt-16 p-6 rounded-2xl border border-[var(--border-accent)]/30 bg-[var(--bg-surface-glass)] backdrop-blur-xl shadow-2xl shadow-[var(--shadow-glow)]">
            <div className="space-y-5">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start space-x-3 animate-fade-in`}>
                         <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${msg.speaker === 'ALEX' ? 'bg-[var(--text-host-alex)] shadow-[var(--text-host-alex)]/50' : 'bg-[var(--text-host-ben)] shadow-[var(--text-host-ben)]/50'}`}>
                            {msg.speaker === 'ALEX' ? <AlexIcon className="w-5 h-5 text-white" /> : <BenIcon className="w-5 h-5 text-white" />}
                        </div>
                        <div className="flex-1">
                             <div className={`flex items-center space-x-2 ${msg.speaker === 'ALEX' ? 'text-[var(--text-host-alex)]' : 'text-[var(--text-host-ben)]'}`}>
                                <span className="font-bold">{msg.speaker}</span>
                                {!msg.isTyping && (
                                     <div className="flex items-end space-x-0.5 h-4">
                                        <span className="w-1 h-2 bg-current rounded-full animate-[live-demo-wave_1.2s_infinite_ease-in-out_0.1s]"></span>
                                        <span className="w-1 h-4 bg-current rounded-full animate-[live-demo-wave_1.2s_infinite_ease-in-out_0.2s]"></span>
                                        <span className="w-1 h-3 bg-current rounded-full animate-[live-demo-wave_1.2s_infinite_ease-in-out_0.3s]"></span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-1 p-3 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-primary)] text-[var(--text-primary)] text-left">
                                {msg.isTyping ? <div className="typing-indicator"><span></span><span></span><span></span></div> : msg.text}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <style>{`
                .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
                @keyframes fadeIn { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
                .typing-indicator span { height: 8px; width: 8px; background-color: var(--text-secondary); display: inline-block; border-radius: 50%; margin: 0 1px; animation: wave 1.2s infinite ease-in-out; }
                .typing-indicator span:nth-of-type(2) { animation-delay: -1.0s; }
                .typing-indicator span:nth-of-type(3) { animation-delay: -0.8s; }
                @keyframes wave { 0%, 60%, 100% { transform: initial; } 30% { transform: translateY(-8px); } }
            `}</style>
        </ShimmerCard>
    );
};


const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="futuristic-bg min-h-screen text-white overflow-y-auto">
      <header className="container mx-auto px-6 py-4 flex justify-between items-center fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-7xl bg-[var(--bg-surface-glass)] backdrop-blur-lg border border-[var(--border-primary)] rounded-2xl shadow-2xl shadow-black/20">
        <div className="flex items-center space-x-3">
          <AetherWaveLogo className="w-8 h-8" />
          <span className="text-xl font-bold text-shadow-primary">AetherWave Studio</span>
        </div>
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-[var(--text-secondary)] hover:text-[var(--text-accent-primary)] transition">Features</a>
          <a href="#pricing" className="text-[var(--text-secondary)] hover:text-[var(--text-accent-primary)] transition">Pricing</a>
          <a href="#faq" className="text-[var(--text-secondary)] hover:text-[var(--text-accent-primary)] transition">FAQ</a>
        </nav>
        <button onClick={() => onNavigate('studio')} className="hidden md:block px-5 py-2 bg-white/10 text-[var(--text-accent-primary)] font-semibold rounded-full border border-[var(--border-secondary)] hover:bg-[var(--bg-accent-primary)]/20 hover:text-white hover:border-[var(--border-accent)] transition hover:shadow-[0_0_15px_var(--shadow-glow)]">
            Launch App
        </button>
      </header>
      
      <main className="container mx-auto px-6 pt-32 pb-16 text-center relative z-10">
        <h1 className="text-5xl md:text-7xl font-extrabold text-shadow-primary tracking-tight leading-tight">
          Craft Ethereal Dialogues with AI.
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-[var(--text-secondary)]">
          Transform any content into studio-quality conversations. AetherWave gives you two advanced AI hosts, turning your ideas into engaging podcasts in minutes.
        </p>
        <button 
          onClick={() => onNavigate('studio')}
          className="mt-10 px-8 py-4 bg-[var(--bg-accent-primary)] font-semibold rounded-full shadow-lg hover:bg-[var(--bg-accent-primary-hover)] transition-all duration-300 ease-in-out transform hover:scale-105 animate-pulse-glow"
        >
          Start Generating for Free
        </button>
        <p className="mt-4 text-sm text-gray-500">150 free credits included. No credit card required.</p>
        <LiveUIDemo />
      </main>

      <section id="features" className="container mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center text-shadow-primary mb-12">An Entire Content Studio, Reimagined</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard 
            icon={<SourceIntelIcon className="w-8 h-8 text-[var(--text-accent-primary)]" />} 
            title="Source Intelligence"
          >
            Feed the AI any source material—PDFs, web articles, or raw text. It intelligently analyzes the content to fuel a deep, informed conversation.
          </FeatureCard>
          <FeatureCard 
            icon={<VoiceSynthIcon className="w-8 h-8 text-[var(--text-accent-primary)]" />}
            title="Advanced Voice Synthesis"
          >
            Choose from a library of standard and premium voices. Cast your AI hosts, ALEX & BEN, to perfectly match the tone of your content.
          </FeatureCard>
          <FeatureCard
            icon={<DialogueEngineIcon className="w-8 h-8 text-[var(--text-accent-primary)]" />}
            title="Dynamic Dialogue Engine"
          >
            Beyond simple Q&A, our AI generates natural, multi-turn debates and discussions, complete with unique personas for each host.
          </FeatureCard>
        </div>
      </section>

       <section id="pricing" className="container mx-auto px-6 py-16">
          <h2 className="text-4xl font-bold text-center text-shadow-primary mb-12">Simple, Credit-Based Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <ShimmerCard className="bg-white/5 p-8 rounded-2xl border border-[var(--border-primary)] backdrop-blur-lg text-center transition-all duration-300 hover:border-[var(--border-accent)]/50">
                  <h3 className="text-2xl font-bold text-[var(--text-accent-primary)]">Starter</h3>
                  <p className="text-5xl font-extrabold my-4">100</p>
                  <p className="text-[var(--text-secondary)] mb-4">Credits</p>
                  <p className="text-3xl font-bold">$5</p>
                   <button onClick={() => onNavigate('studio')} className="w-full mt-6 py-3 font-semibold rounded-lg bg-white/10 hover:bg-white/20 transition">Get Started</button>
              </ShimmerCard>
              <div className="relative bg-white/5 p-8 rounded-2xl border-2 border-[var(--border-accent)] text-center transform md:scale-105 shadow-[0_0_35px_var(--shadow-glow)] backdrop-blur-lg">
                   <p className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-4 py-1 text-sm font-bold rounded-full bg-[var(--bg-accent-primary)] text-[var(--text-inverted)]">Most Popular</p>
                  <h3 className="text-2xl font-bold text-[var(--text-accent-primary)]">Creator</h3>
                  <p className="text-5xl font-extrabold my-4">500</p>
                  <p className="text-[var(--text-secondary)] mb-4">Credits</p>
                  <p className="text-3xl font-bold">$20</p>
                   <button onClick={() => onNavigate('studio')} className="w-full mt-6 py-3 font-semibold rounded-lg bg-[var(--bg-accent-primary)] hover:bg-[var(--bg-accent-primary-hover)] transition shadow-[0_0_15px_var(--shadow-color-accent)]">Get Started</button>
                    <div 
                        className="absolute top-0 left-0 w-full h-full shimmer-overlay"
                        style={{
                            background: `linear-gradient(110deg, transparent 35%, rgba(255, 255, 255, 0.15) 50%, transparent 65%)`,
                            backgroundSize: '200% 100%',
                            animation: `shimmer 4s infinite linear`,
                        }}
                    />
              </div>
               <ShimmerCard className="bg-white/5 p-8 rounded-2xl border border-[var(--border-primary)] backdrop-blur-lg text-center transition-all duration-300 hover:border-[var(--border-accent)]/50">
                  <h3 className="text-2xl font-bold text-[var(--text-accent-primary)]">Studio Pro</h3>
                  <p className="text-5xl font-extrabold my-4">2,000</p>
                  <p className="text-[var(--text-secondary)] mb-4">Credits</p>
                  <p className="text-3xl font-bold">$75</p>
                   <button onClick={() => onNavigate('studio')} className="w-full mt-6 py-3 font-semibold rounded-lg bg-white/10 hover:bg-white/20 transition">Get Started</button>
              </ShimmerCard>
          </div>
          <p className="text-center mt-8 text-[var(--text-secondary)]">Podcast generation costs 10 credits for standard voices. Your trial includes 150 free credits!</p>
       </section>
       
       <section id="testimonials" className="container mx-auto px-6 py-16">
          <h2 className="text-4xl font-bold text-center text-shadow-primary mb-12">Trusted by Modern Content Creators</h2>
           <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <ShimmerCard className="bg-white/5 p-8 rounded-2xl border border-[var(--border-primary)] backdrop-blur-lg">
                  <QuoteIcon className="w-8 h-8 text-[var(--text-accent-primary)]/50 mb-4"/>
                  <p className="text-[var(--text-secondary)] leading-relaxed">"This tool is a game-changer for brainstorming. I can test content angles in minutes instead of hours."</p>
                  <p className="mt-4 font-bold text-[var(--text-primary)]">- Casey N., Tech Podcaster</p>
              </ShimmerCard>
               <ShimmerCard className="bg-white/5 p-8 rounded-2xl border border-[var(--border-primary)] backdrop-blur-lg">
                  <QuoteIcon className="w-8 h-8 text-[var(--text-accent-primary)]/50 mb-4"/>
                  <p className="text-[var(--text-secondary)] leading-relaxed">"As an educator, I can turn dense research papers into accessible audio content for my students. Incredible."</p>
                  <p className="mt-4 font-bold text-[var(--text-primary)]">- Dr. Aliyah Khan, Professor</p>
              </ShimmerCard>
              <ShimmerCard className="bg-white/5 p-8 rounded-2xl border border-[var(--border-primary)] backdrop-blur-lg">
                  <QuoteIcon className="w-8 h-8 text-[var(--text-accent-primary)]/50 mb-4"/>
                  <p className="text-[var(--text-secondary)] leading-relaxed">"The quality of the AI conversation is shockingly good. It's like having two experts on call 24/7."</p>
                  <p className="mt-4 font-bold text-[var(--text-primary)]">- Mark Chen, Marketing Lead</p>
              </ShimmerCard>
           </div>
       </section>

      <section id="faq" className="container mx-auto px-6 py-16 max-w-4xl">
           <h2 className="text-4xl font-bold text-center text-shadow-primary mb-12">Frequently Asked Questions</h2>
           <div className="bg-white/5 p-4 rounded-2xl border border-[var(--border-primary)] backdrop-blur-lg">
               <FaqItem q="How do credits work?" a="One podcast generation costs 10 credits with standard voices, or more for premium voices. Your free trial comes with 150 credits. You can buy more from the Credit Store inside the app."/>
               <FaqItem q="Can I use my own voice?" a="Currently, we offer a curated selection of high-quality standard and premium voices for our AI hosts. Custom voice cloning is a feature we are exploring for the future."/>
               <FaqItem q="What kind of sources can I use?" a="You can paste in raw text, provide a URL to a web page (our AI will scrape the content), or upload a PDF document. The AI will use this information as the foundation for the podcast dialogue."/>
               <FaqItem q="How long can the podcasts be?" a="The length depends on your prompt and source material. The model excels at creating focused, conversational segments, typically around 5-15 minutes, ensuring high-quality and coherent dialogue."/>
           </div>
      </section>

      <footer className="text-center py-8 mt-16 border-t border-[var(--border-primary)]">
        <p className="text-gray-500">© 2025 Created By Corey English | EDC Media | All Rights Reserved.</p>
        <button onClick={() => onNavigate('admin_login')} className="text-gray-600 hover:text-[var(--text-accent-primary)] text-xs mt-2 transition-colors">
            Admin Panel
        </button>
      </footer>
    </div>
  );
};

export default LandingPage;