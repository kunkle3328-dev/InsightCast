import React, { useState, useCallback } from 'react';
import { Source, SourceType } from '../types';
import { PlusIcon, DocumentIcon, LinkIcon, PDFIcon, LoadingSpinnerIcon, TrashIcon, UploadCloudIcon } from './icons';

declare const pdfjsLib: any;

interface SourceManagerProps {
  sources: Source[];
  onAddSource: (source: Omit<Source, 'id' | 'intel' | 'isIntelLoading'>) => void;
  onRemoveSource: (sourceId: string) => void;
  onViewSource: (sourceId: string) => void;
  activeSourceId: string | null;
  highlightedSourceId: string | null;
}

const SourceTypeTab: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 flex items-center justify-center space-x-2 p-2 text-sm font-semibold rounded-md transition-colors ${
      isActive
        ? 'bg-[var(--bg-accent-primary)]/20 text-[var(--text-accent-primary)]'
        : 'text-[var(--text-secondary)] hover:bg-gray-500/20'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    sourceName: string;
    isDeleting: boolean;
}> = ({ isOpen, onClose, onConfirm, sourceName, isDeleting }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={onClose}>
            <div className="relative w-full max-w-md p-6 bg-[var(--bg-surface-glass)] border border-[var(--border-danger)] rounded-xl shadow-2xl shadow-red-500/20 text-center" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-[var(--text-danger)]">Confirm Deletion</h2>
                <p className="mt-2 text-[var(--text-primary)]">
                    Are you sure you want to permanently remove the source: <br/><span className="font-bold">"{sourceName}"</span>?
                </p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">This action cannot be undone.</p>
                <div className="mt-6 flex gap-3 justify-center">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] bg-gray-500/20 rounded-md hover:bg-gray-500/40 transition w-full">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={isDeleting} className="flex justify-center items-center px-4 py-2 text-sm font-semibold text-white bg-[var(--bg-danger)] rounded-md hover:bg-[var(--bg-danger-hover)] transition shadow-[0_0_8px_theme(colors.red.500)] w-full disabled:opacity-50 disabled:cursor-wait">
                        {isDeleting ? <LoadingSpinnerIcon className="w-5 h-5"/> : 'Delete Source'}
                    </button>
                </div>
            </div>
        </div>
    );
};


export const SourceManager: React.FC<SourceManagerProps> = ({ sources, onAddSource, onRemoveSource, onViewSource, activeSourceId, highlightedSourceId }) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<SourceType>('text');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  
  const [sourceToDelete, setSourceToDelete] = useState<Source | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const resetForm = useCallback(() => {
    setName('');
    setContent('');
    setIsAdding(false);
    setPdfError(null);
    setUrlError(null);
    setIsSubmitting(false);
  }, []);

  const handleTabChange = (tab: SourceType) => {
    setActiveTab(tab);
    setContent('');
    setPdfError(null);
    setUrlError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled()) return;
    setIsSubmitting(true);
    
    // Simulate async operation for URL fetching or PDF parsing
    setTimeout(() => {
        let sourceData;
        if (activeTab === 'url') {
            sourceData = {
                name: content.trim(), // Use URL as name
                content: `Content from URL: ${content.trim()}`, // Placeholder for fetched content
                type: 'url',
            };
        } else { // Text and PDF
            sourceData = {
                name: name.trim(),
                content: content.trim(),
                type: activeTab,
            };
        }
        onAddSource(sourceData);
        resetForm();
    }, 500);
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // PDF handling logic
  };

  const handleDeleteClick = (e: React.MouseEvent, source: Source) => {
      e.stopPropagation(); // Prevent opening the source viewer
      setSourceToDelete(source);
  };

  const handleDeleteConfirm = () => {
    if (sourceToDelete) {
        setIsDeleting(true);
        setTimeout(() => {
            onRemoveSource(sourceToDelete.id);
            setIsDeleting(false);
            setSourceToDelete(null);
        }, 1000);
    }
  };

  const isSubmitDisabled = () => {
    if (isSubmitting) return true;
    if (activeTab === 'url') return !content.trim();
    return !name.trim() || !content.trim();
  };

  return (
    <div className="space-y-4">
      {isAdding ? (
        <form onSubmit={handleSubmit} className="p-4 bg-[var(--bg-surface-1)] border border-[var(--border-primary)] rounded-lg space-y-4 shadow-lg">
           <div className="flex bg-[var(--bg-surface-2)] p-1 rounded-lg">
             <SourceTypeTab label="Text" icon={<DocumentIcon className="w-4 h-4" />} isActive={activeTab === 'text'} onClick={() => handleTabChange('text')} />
             <SourceTypeTab label="URL" icon={<LinkIcon className="w-4 h-4" />} isActive={activeTab === 'url'} onClick={() => handleTabChange('url')} />
             <SourceTypeTab label="PDF" icon={<PDFIcon className="w-4 h-4" />} isActive={activeTab === 'pdf'} onClick={() => handleTabChange('pdf')} />
           </div>
           
           {activeTab !== 'url' && (
                <input
                    type="text"
                    placeholder="Source Name (e.g., 'Article on AI')"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[var(--bg-surface-2)] border border-[var(--border-secondary)] rounded-md p-2 text-sm text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--border-accent)]"
                />
           )}
           {activeTab === 'text' && (
                <textarea
                    placeholder="Paste your text content here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                    className="w-full bg-[var(--bg-surface-2)] border border-[var(--border-secondary)] rounded-md p-2 text-sm text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--border-accent)]"
                />
           )}
            {activeTab === 'url' && (
                 <input
                    type="url"
                    placeholder="https://example.com/article"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-[var(--bg-surface-2)] border border-[var(--border-secondary)] rounded-md p-2 text-sm text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--border-accent)]"
                />
            )}
            {activeTab === 'pdf' && (
                <div>
                     <label htmlFor="pdf-upload" className="w-full flex flex-col items-center justify-center p-4 bg-[var(--bg-surface-2)] border-2 border-dashed border-[var(--border-secondary)] rounded-md cursor-pointer hover:border-[var(--border-accent)]">
                        <UploadCloudIcon className="w-8 h-8 text-[var(--text-secondary)]"/>
                        <span className="mt-2 text-sm text-[var(--text-secondary)]">Click to upload a PDF</span>
                     </label>
                     <input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileChange} className="hidden"/>
                </div>
            )}
           
           <div className="flex justify-end space-x-2">
                <button type="button" onClick={resetForm} className="px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-gray-500/20 rounded-md">Cancel</button>
                <button type="submit" disabled={isSubmitDisabled()} className="flex justify-center items-center w-28 px-3 py-2 text-xs font-semibold text-white bg-[var(--bg-accent-primary)] hover:bg-[var(--bg-accent-primary-hover)] rounded-md disabled:opacity-50 disabled:cursor-wait">
                    {isSubmitting ? <LoadingSpinnerIcon className="w-4 h-4"/> : 'Add Source'}
                </button>
           </div>
        </form>
      ) : (
        <button onClick={() => setIsAdding(true)} className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[var(--bg-accent-primary)]/10 text-[var(--text-accent-primary)] rounded-lg border-2 border-dashed border-[var(--border-secondary)] hover:bg-[var(--bg-accent-primary)]/20 hover:border-[var(--border-accent)]/50 transition">
          <PlusIcon className="w-5 h-5" />
          <span>Add New Source</span>
        </button>
      )}

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-6 text-shadow-primary">Your Sources</h3>
        {sources.length > 0 ? (
          <ul className="space-y-2">
            {sources.map(source => {
              const isActive = source.id === activeSourceId;
              const isCited = source.id === highlightedSourceId;
              return (
              <li key={source.id} >
                  <button onClick={() => onViewSource(source.id)} className={`group w-full flex items-center justify-between p-3 rounded-lg shadow-md transition-all duration-300 text-left ${isActive ? 'bg-[var(--bg-accent-primary)]/20 ring-2 ring-[var(--border-accent)]' : `bg-[var(--bg-surface-1)] border border-[var(--border-primary)]/50 hover:bg-[var(--bg-accent-primary)]/5 ${isCited ? 'animate-pulse-glow' : ''}`}`}>
                    <div className="flex items-center min-w-0">
                        {source.type === 'text' && <DocumentIcon className="w-5 h-5 mr-3 text-[var(--text-accent-primary)] flex-shrink-0" />}
                        {source.type === 'url' && <LinkIcon className="w-5 h-5 mr-3 text-[var(--text-accent-primary)] flex-shrink-0" />}
                        {source.type === 'pdf' && <PDFIcon className="w-5 h-5 mr-3 text-[var(--text-accent-primary)] flex-shrink-0" />}
                        <span className="text-[var(--text-primary)] truncate" title={source.name}>{source.name}</span>
                        {source.isIntelLoading && <LoadingSpinnerIcon className="w-4 h-4 ml-2 text-[var(--text-accent-primary)] flex-shrink-0" />}
                    </div>
                    <div className="flex items-center flex-shrink-0">
                        <div 
                            onClick={(e) => handleDeleteClick(e, source)}
                            className="ml-3 p-1 rounded-full text-gray-500 hover:text-[var(--text-danger)] hover:bg-[var(--bg-danger)]/10 opacity-0 group-hover:opacity-100 transition-all"
                            aria-label={`Delete source ${source.name}`}
                            title="Delete source"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </div>
                    </div>
                  </button>
              </li>
            )})}
          </ul>
        ) : (
          <p className="text-[var(--text-secondary)] text-center py-4">No sources added yet.</p>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!sourceToDelete}
        onClose={() => setSourceToDelete(null)}
        onConfirm={handleDeleteConfirm}
        sourceName={sourceToDelete?.name || ''}
        isDeleting={isDeleting}
      />
    </div>
  );
};