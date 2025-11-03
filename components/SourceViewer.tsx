import React, { useEffect, useMemo, useState } from 'react';
import { Source } from '../types';
import { XIcon, DocumentIcon, SourceIntelIcon, LoadingSpinnerIcon } from './icons';
import { marked } from 'marked';

interface SourceViewerProps {
    source: Source | null | undefined;
    highlightedQuote: string | null;
    onClose: () => void;
}

export const SourceViewer: React.FC<SourceViewerProps> = ({ source, highlightedQuote, onClose }) => {
    const [activeTab, setActiveTab] = useState<'content' | 'intel'>('content');
    const contentRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        setActiveTab('content');
    }, [source?.id]);

    const processedContent = useMemo(() => {
        if (!source) return '';
        // Basic markdown support for better text formatting
        let content = source.content;
        
        if (highlightedQuote) {
            // Escape special characters in the quote for regex safety
            const escapedQuote = highlightedQuote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedQuote})`, 'gi');
            content = content.replace(regex, `<mark>$1</mark>`);
        }
        
        // This is a simple protection, for a real app, use a proper sanitizer like DOMPurify
        const dirtyHtml = marked.parse(content);
        return dirtyHtml;
    }, [source, highlightedQuote]);


    useEffect(() => {
        if (highlightedQuote && contentRef.current) {
            const markElement = contentRef.current.querySelector('mark');
            if (markElement) {
                markElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [highlightedQuote, processedContent]);

    const handleCopyQuestion = (question: string) => {
        navigator.clipboard.writeText(question);
        // A toast notification would be a good addition here.
    };

    return (
        <aside className={`fixed top-0 right-0 h-full bg-[var(--bg-surface-glass)] backdrop-blur-lg border-l border-[var(--border-primary)] transition-transform duration-300 ease-in-out z-20 w-full md:w-[450px] lg:w-[550px] ${source ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)] flex-shrink-0">
                    <div className="flex items-center space-x-3 min-w-0">
                        <DocumentIcon className="w-6 h-6 text-[var(--text-accent-primary)] flex-shrink-0" />
                        <h2 className="text-lg font-bold text-[var(--text-primary)] truncate text-shadow-primary" title={source?.name}>{source?.name || 'Source Viewer'}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-md hover:bg-[var(--bg-accent-primary)]/20 text-[var(--text-accent-primary)]">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Tabs */}
                <div className="flex-shrink-0 border-b border-[var(--border-primary)] px-4">
                    <div className="flex space-x-4">
                        <button onClick={() => setActiveTab('content')} className={`py-3 text-sm font-semibold border-b-2 ${activeTab === 'content' ? 'text-[var(--text-accent-primary)] border-[var(--border-accent)]' : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'}`}>
                            Content
                        </button>
                        <button onClick={() => setActiveTab('intel')} className={`py-3 text-sm font-semibold border-b-2 flex items-center space-x-1.5 ${activeTab === 'intel' ? 'text-[var(--text-accent-primary)] border-[var(--border-accent)]' : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'}`}>
                            <SourceIntelIcon className="w-4 h-4" />
                            <span>Source Intel</span>
                        </button>
                    </div>
                </div>

                {activeTab === 'content' && (
                    <div ref={contentRef} className="flex-1 p-6 overflow-y-auto prose prose-invert prose-sm max-w-none prose-p:text-[var(--text-secondary)] prose-headings:text-[var(--text-primary)] prose-strong:text-[var(--text-primary)]">
                        {source ? (
                            <div dangerouslySetInnerHTML={{ __html: processedContent }} />
                        ) : (
                            <p className="text-[var(--text-secondary)]">Select a source to view its content.</p>
                        )}
                        <style>{`
                            .prose mark {
                                background-color: var(--text-accent-primary);
                                color: var(--bg-main);
                                padding: 2px 0;
                                border-radius: 3px;
                            }
                        `}</style>
                    </div>
                )}
                
                {activeTab === 'intel' && (
                    <div className="flex-1 p-6 overflow-y-auto">
                        {source?.isIntelLoading && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <LoadingSpinnerIcon className="w-8 h-8 text-[var(--text-accent-primary)]" />
                                <p className="mt-4 text-[var(--text-secondary)]">Analyzing source...</p>
                            </div>
                        )}
                        {!source?.isIntelLoading && source?.intel && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--text-accent-primary)] mb-2">Summary</h3>
                                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{source.intel.summary}</p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--text-accent-primary)] mb-2">Key Topics</h3>
                                    <ul className="space-y-1.5 list-disc list-inside">
                                        {source.intel.keyTopics.map((topic, i) => <li key={i} className="text-[var(--text-secondary)] text-sm">{topic}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--text-accent-primary)] mb-2">Suggested Questions</h3>
                                    <div className="space-y-2">
                                        {source.intel.suggestedQuestions.map((q, i) => (
                                            <div key={i} className="p-3 bg-[var(--bg-surface-2)] rounded-md text-sm text-[var(--text-primary)] hover:bg-[var(--bg-accent-primary)]/10 cursor-pointer" onClick={() => handleCopyQuestion(q)} title="Click to copy">
                                                {q}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                         {!source?.isIntelLoading && !source?.intel && source && (
                             <div className="flex flex-col items-center justify-center h-full text-center">
                                <p className="text-[var(--text-secondary)]">Could not generate intel for this source.</p>
                            </div>
                         )}
                    </div>
                )}
            </div>
        </aside>
    );
};