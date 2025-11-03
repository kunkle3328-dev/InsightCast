import React, { useState } from 'react';
import { ChatMessage, Source, Speaker } from '../types';
import { SparklesIcon, LoadingSpinnerIcon, LinkIcon, DocumentIcon, PDFIcon, ChevronDownIcon, DownloadIcon, ClipboardIcon, CheckCircleIcon, ExportIcon } from './icons';

interface PodcastOverviewProps {
    script: ChatMessage[];
    summary: string;
    isSummaryLoading: boolean;
    onGenerateSummary: () => void;
    keyTakeaways: string[];
    isTakeawaysLoading: boolean;
    onGenerateTakeaways: () => void;
    sources: Source[];
    savedClips: ChatMessage[];
    finalScript: ChatMessage[];
}

const ExportMenu: React.FC<{ 
    script: ChatMessage[], 
    sources: Source[],
    savedClips: ChatMessage[],
    finalScript: ChatMessage[],
}> = ({ script, sources, savedClips, finalScript }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    
    const formatTranscript = () => script.map(msg => `${msg.speaker}:\n${msg.text}`).join('\n\n');
    
    const formatMarkdown = () => {
        return script.map(msg => `**${msg.speaker}:** ${msg.text}`).join('\n\n');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(formatTranscript());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const markdown = formatMarkdown();
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'podcast-script.md';
        a.click();
        URL.revokeObjectURL(url);
    };
    
    const handleExportProject = () => {
      const projectData = {
        sources,
        savedClips,
        finalScript: finalScript.length > 0 ? finalScript : script,
      };
      const jsonString = JSON.stringify(projectData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'aetherwave-project.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 px-4 py-2 text-sm bg-[var(--bg-surface-2)] rounded-md hover:bg-[var(--bg-accent-primary)]/20">
                <span>Export</span>
                <ChevronDownIcon className="w-4 h-4" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-[var(--bg-surface-glass)] border border-[var(--border-secondary)] rounded-lg shadow-xl z-10 backdrop-blur-md">
                    <button onClick={handleCopy} className="w-full text-left flex items-center space-x-2 px-3 py-2 hover:bg-[var(--bg-accent-primary)]/20 transition-colors">
                        {copied ? <CheckCircleIcon className="w-4 h-4 text-green-400"/> : <ClipboardIcon className="w-4 h-4"/>}
                        <span>{copied ? 'Copied!' : 'Copy Transcript'}</span>
                    </button>
                     <button onClick={handleDownload} className="w-full text-left flex items-center space-x-2 px-3 py-2 hover:bg-[var(--bg-accent-primary)]/20 transition-colors">
                        <DownloadIcon className="w-4 h-4"/>
                        <span>Download Script (.md)</span>
                    </button>
                     <button onClick={handleExportProject} className="w-full text-left flex items-center space-x-2 px-3 py-2 hover:bg-[var(--bg-accent-primary)]/20 transition-colors">
                        <ExportIcon className="w-4 h-4"/>
                        <span>Export Project (.json)</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export const PodcastOverview: React.FC<PodcastOverviewProps> = ({
    script,
    summary,
    isSummaryLoading,
    onGenerateSummary,
    keyTakeaways,
    isTakeawaysLoading,
    onGenerateTakeaways,
    sources,
    savedClips,
    finalScript,
}) => {
    if (script.length === 0 && finalScript.length === 0) {
        return (
            <div className="text-center py-16">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">No Podcast Generated</h2>
                <p className="mt-2 text-[var(--text-secondary)]">Start a conversation to create a podcast to see its overview here.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <input 
                    defaultValue="My AI-Generated Podcast"
                    className="w-full bg-transparent text-4xl font-bold text-shadow-primary focus:outline-none text-[var(--text-primary)] border-b-2 border-transparent focus:border-[var(--border-accent)] transition"
                />
                <ExportMenu 
                    script={script}
                    sources={sources}
                    savedClips={savedClips}
                    finalScript={finalScript}
                />
            </div>

            {/* Summary Section */}
            <div className="p-6 bg-[var(--bg-surface-1)] border border-[var(--border-primary)] rounded-lg">
                <h3 className="text-xl font-bold text-[var(--text-accent-primary)] mb-3">Executive Summary</h3>
                {summary ? (
                    <p className="text-[var(--text-primary)] whitespace-pre-wrap">{summary}</p>
                ) : (
                    <button onClick={onGenerateSummary} disabled={isSummaryLoading} className="flex items-center space-x-2 px-4 py-2 text-sm bg-[var(--bg-accent-secondary)] rounded-full hover:opacity-90 disabled:opacity-50">
                        {isSummaryLoading ? <LoadingSpinnerIcon className="w-5 h-5"/> : <SparklesIcon className="w-5 h-5"/>}
                        <span>Generate Summary</span>
                    </button>
                )}
            </div>

            {/* Key Takeaways Section */}
            <div className="p-6 bg-[var(--bg-surface-1)] border border-[var(--border-primary)] rounded-lg">
                <h3 className="text-xl font-bold text-[var(--text-accent-primary)] mb-3">Key Takeaways</h3>
                {keyTakeaways.length > 0 ? (
                    <ul className="space-y-2 list-disc list-inside">
                        {keyTakeaways.map((takeaway, index) => (
                            <li key={index} className="text-[var(--text-primary)]">{takeaway}</li>
                        ))}
                    </ul>
                ) : (
                     <button onClick={onGenerateTakeaways} disabled={isTakeawaysLoading} className="flex items-center space-x-2 px-4 py-2 text-sm bg-[var(--bg-accent-secondary)] rounded-full hover:opacity-90 disabled:opacity-50">
                        {isTakeawaysLoading ? <LoadingSpinnerIcon className="w-5 h-5"/> : <SparklesIcon className="w-5 h-5"/>}
                        <span>Generate Key Takeaways</span>
                    </button>
                )}
            </div>

            {/* Sources Section */}
            <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">Sources Used</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sources.map(source => (
                        <div key={source.id} className="flex items-center p-3 bg-[var(--bg-surface-1)] border border-[var(--border-primary)]/50 rounded-lg">
                           {source.type === 'text' && <DocumentIcon className="w-5 h-5 mr-3 text-[var(--text-accent-primary)] flex-shrink-0" />}
                           {source.type === 'url' && <LinkIcon className="w-5 h-5 mr-3 text-[var(--text-accent-primary)] flex-shrink-0" />}
                           {source.type === 'pdf' && <PDFIcon className="w-5 h-5 mr-3 text-[var(--text-accent-primary)] flex-shrink-0" />}
                           <span className="text-[var(--text-primary)] truncate">{source.name}</span>
                        </div>
                    ))}
                 </div>
            </div>

             {/* Transcript Section */}
            <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">Full Transcript</h3>
                 <div className="p-6 bg-[var(--bg-surface-1)] border border-[var(--border-primary)] rounded-lg space-y-4 max-h-[50vh] overflow-y-auto">
                    {script.map(msg => (
                        <div key={msg.id}>
                            <p className={`font-bold ${msg.speaker === Speaker.Alex ? 'text-[var(--text-host-alex)]' : 'text-[var(--text-host-ben)]'}`}>{msg.speaker}:</p>
                            <p className="text-[var(--text-primary)] pl-4">{msg.text}</p>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    );
};