import React, { useState } from 'react';
import { LogoIcon, UploadCloudIcon, VoicemailIcon, MessageSquareIcon, QuoteIcon, ChevronDownIcon } from './icons';

interface LandingPageProps {
  onNavigate: (view: 'studio' | 'admin_login') => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-black/20 p-6 rounded-lg border border-cyan-500/20 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(0,255,255,0.1)] hover:-translate-y-1">
    <div className="flex items-center space-x-4">
      <div className="bg-cyan-500/10 p-3 rounded-full">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-200">{title}</h3>
    </div>
    <p className="mt-4 text-gray-400">
      {children}
    </p>
  </div>
);

const FaqItem: React.FC<{ q: string; a: string; }> = ({ q, a }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-cyan-500/20">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left py-4">
                <span className="font-semibold text-lg text-gray-200">{q}</span>
                <ChevronDownIcon className={`w-6 h-6 text-cyan-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <p className="pb-4 text-gray-400">{a}</p>
                </div>
            </div>
        </div>
    );
};

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="futuristic-bg min-h-screen text-white overflow-y-auto">
      <header className="container mx-auto px-6 py-4 flex justify-between items-center sticky top-0 z-40 bg-[#050510]/80 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <LogoIcon className="w-8 h-8 text-cyan-400" />
          <span className="text-xl font-bold text-shadow-cyan">AI Podcast Studio</span>
        </div>
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-300 hover:text-cyan-400 transition">Features</a>
          <a href="#pricing" className="text-gray-300 hover:text-cyan-400 transition">Pricing</a>
          <a href="#faq" className="text-gray-300 hover:text-cyan-400 transition">FAQ</a>
        </nav>
        <button onClick={() => onNavigate('studio')} className="hidden md:block px-5 py-2 bg-cyan-600/50 text-cyan-200 font-semibold rounded-full hover:bg-cyan-600 hover:text-white transition">
            Launch App
        </button>
      </header>
      
      <main className="container mx-auto px-6 pt-24 pb-16 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold text-shadow-cyan tracking-tight leading-tight">
          Create Studio-Quality AI Podcasts in Minutes.
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-gray-400">
          Transform your documents, articles, or ideas into engaging conversations with our advanced AI hosts, ALEX & BEN. Generate, customize, and publish with unprecedented ease.
        </p>
        <button 
          onClick={() => onNavigate('studio')}
          className="mt-10 px-8 py-4 bg-cyan-600 font-semibold rounded-full shadow-lg hover:bg-cyan-500 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-[0_0_20px_theme(colors.cyan.500)]"
        >
          Start Your Free Trial
        </button>
        <p className="mt-4 text-sm text-gray-500">150 free credits included. No credit card required.</p>
      </main>

      <section id="features" className="container mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center text-shadow-cyan mb-12">An Entire Content Studio, Powered by AI</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard 
            icon={<UploadCloudIcon className="w-6 h-6 text-cyan-400" />} 
            title="Intelligent Sourcing"
          >
            Upload PDFs, paste text, or add URLs. Our AI reads and understands your content to form the basis of the conversation.
          </FeatureCard>
          <FeatureCard 
            icon={<VoicemailIcon className="w-6 h-6 text-cyan-400" />}
            title="Versatile Voice Casting"
          >
            Choose from a variety of standard and premium text-to-speech voices for AI hosts ALEX and BEN to match your desired tone.
          </FeatureCard>
          <FeatureCard
            icon={<MessageSquareIcon className="w-6 h-6 text-cyan-400" />}
            title="Dynamic Dialogue Generation"
          >
            Ask a question or provide a topic, and watch as ALEX and BEN generate a natural, insightful podcast script in seconds.
          </FeatureCard>
        </div>
      </section>

       <section id="pricing" className="container mx-auto px-6 py-16">
          <h2 className="text-4xl font-bold text-center text-shadow-cyan mb-12">Simple, Credit-Based Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-black/20 p-8 rounded-lg border-2 border-cyan-500/20 text-center">
                  <h3 className="text-2xl font-bold text-cyan-300">Starter Pack</h3>
                  <p className="text-5xl font-extrabold my-4">100</p>
                  <p className="text-gray-400 mb-4">Credits</p>
                  <p className="text-3xl font-bold">$5</p>
              </div>
              <div className="bg-black/20 p-8 rounded-lg border-2 border-cyan-500 text-center transform scale-105 shadow-[0_0_25px_rgba(0,255,255,0.15)]">
                   <p className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-4 py-1 text-sm font-bold rounded-full bg-cyan-500 text-black">Most Popular</p>
                  <h3 className="text-2xl font-bold text-cyan-300">Creator Pack</h3>
                  <p className="text-5xl font-extrabold my-4">500</p>
                  <p className="text-gray-400 mb-4">Credits</p>
                  <p className="text-3xl font-bold">$20</p>
              </div>
               <div className="bg-black/20 p-8 rounded-lg border-2 border-cyan-500/20 text-center">
                  <h3 className="text-2xl font-bold text-cyan-300">Studio Pro</h3>
                  <p className="text-5xl font-extrabold my-4">2,000</p>
                  <p className="text-gray-400 mb-4">Credits</p>
                  <p className="text-3xl font-bold">$75</p>
              </div>
          </div>
          <p className="text-center mt-8 text-gray-400">Podcast generation costs 10 credits. Your free trial includes 150 credits to get you started!</p>
       </section>
       
       <section id="testimonials" className="container mx-auto px-6 py-16">
          <h2 className="text-4xl font-bold text-center text-shadow-cyan mb-12">Trusted by Modern Content Creators</h2>
           <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-black/20 p-6 rounded-lg border border-cyan-500/10">
                  <QuoteIcon className="w-8 h-8 text-cyan-500/50 mb-4"/>
                  <p className="text-gray-300">"This tool is a game-changer for brainstorming. I can test content angles in minutes instead of hours."</p>
                  <p className="mt-4 font-bold text-white">- Casey N., Tech Podcaster</p>
              </div>
               <div className="bg-black/20 p-6 rounded-lg border border-cyan-500/10">
                  <QuoteIcon className="w-8 h-8 text-cyan-500/50 mb-4"/>
                  <p className="text-gray-300">"As an educator, I can turn dense research papers into accessible audio content for my students. Incredible."</p>
                  <p className="mt-4 font-bold text-white">- Dr. Aliyah Khan, Professor</p>
              </div>
              <div className="bg-black/20 p-6 rounded-lg border border-cyan-500/10">
                  <QuoteIcon className="w-8 h-8 text-cyan-500/50 mb-4"/>
                  <p className="text-gray-300">"The quality of the AI conversation is shockingly good. It's like having two experts on call 24/7."</p>
                  <p className="mt-4 font-bold text-white">- Mark Chen, Marketing Lead</p>
              </div>
           </div>
       </section>

      <section id="faq" className="container mx-auto px-6 py-16 max-w-4xl">
           <h2 className="text-4xl font-bold text-center text-shadow-cyan mb-12">Frequently Asked Questions</h2>
           <div className="space-y-2">
               <FaqItem q="How do credits work?" a="One podcast generation, regardless of length, costs 10 credits. Your free trial comes with 150 credits. You can buy more from the Credit Store inside the app."/>
               <FaqItem q="Can I use my own voice?" a="Currently, we offer a curated selection of high-quality standard and premium voices for our AI hosts, ALEX & BEN. Custom voice cloning is on our future roadmap."/>
               <FaqItem q="What kind of sources can I use?" a="You can paste in raw text, provide a URL to a web page (our AI will scrape the content), or upload a PDF document. The AI will use this information as the foundation for the podcast dialogue."/>
               <FaqItem q="How long can the podcasts be?" a="The length of the generated podcast depends on the complexity of your prompt and the amount of source material provided. The model is optimized for creating focused, conversational segments around 5-15 minutes in length."/>
           </div>
      </section>

      <footer className="text-center py-8 mt-16 border-t border-cyan-500/10">
        <p className="text-gray-500">&copy; 2024 AI Podcast Studio. All Rights Reserved.</p>
        <button onClick={() => onNavigate('admin_login')} className="text-gray-600 hover:text-cyan-500 text-xs mt-2">
            Admin Panel
        </button>
      </footer>
    </div>
  );
};

export default LandingPage;