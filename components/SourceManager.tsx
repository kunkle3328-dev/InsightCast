import React, { useState, useCallback } from 'react';
import { Source, SourceType } from '../types';
import { PlusIcon, DocumentIcon, LinkIcon, PDFIcon, LoadingSpinnerIcon } from './icons';

// Make pdfjsLib globally available
declare const pdfjsLib: any;

interface SourceManagerProps {
  sources: Source[];
  onAddSource: (source: Source) => void;
}

const SourceTypeTab: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center space-x-2 p-2 text-sm font-semibold rounded-md transition-colors ${
      isActive
        ? 'bg-cyan-500/20 text-cyan-300'
        : 'text-gray-400 hover:bg-gray-500/20'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export const SourceManager: React.FC<SourceManagerProps> = ({ sources, onAddSource }) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<SourceType>('text');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setName('');
    setContent('');
    setIsAdding(false);
    setPdfError(null);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && content.trim()) {
      onAddSource({
        id: Date.now().toString(),
        name,
        content,
        type: activeTab,
      });
      resetForm();
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfLoading(true);
    setPdfError(null);
    if (!name) setName(file.name.replace('.pdf', ''));

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const numPages = pdf.numPages;
      let fullText = '';
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ');
        fullText += '\n\n';
      }
      setContent(fullText);
    } catch (error) {
      console.error("Failed to parse PDF:", error);
      setPdfError("Failed to parse PDF. Please try another file.");
      setContent('');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {isAdding ? (
        <form onSubmit={handleSubmit} className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-lg space-y-4 shadow-lg">
          <div className="flex bg-black/30 rounded-lg p-1 space-x-1">
            <SourceTypeTab label="Text" icon={<DocumentIcon className="w-4 h-4" />} isActive={activeTab === 'text'} onClick={() => setActiveTab('text')} />
            <SourceTypeTab label="Link" icon={<LinkIcon className="w-4 h-4" />} isActive={activeTab === 'url'} onClick={() => setActiveTab('url')} />
            <SourceTypeTab label="PDF" icon={<PDFIcon className="w-4 h-4" />} isActive={activeTab === 'pdf'} onClick={() => setActiveTab('pdf')} />
          </div>
          
          <div>
            <label htmlFor="source-name" className="block text-sm font-medium text-cyan-300 mb-1">Source Name</label>
            <input
              id="source-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                  activeTab === 'text' ? 'e.g., Photosynthesis Article' :
                  activeTab === 'url' ? 'e.g., Gemini API Docs' : 'e.g., Research Paper on AI'
              }
              className="w-full bg-black/30 border border-cyan-500/30 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition"
              required
            />
          </div>

          {activeTab === 'text' && (
            <div>
              <label htmlFor="source-content-text" className="block text-sm font-medium text-cyan-300 mb-1">Content</label>
              <textarea id="source-content-text" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste your source text here..." rows={8}
                className="w-full bg-black/30 border border-cyan-500/30 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition" required />
            </div>
          )}

          {activeTab === 'url' && (
             <div>
              <label htmlFor="source-content-url" className="block text-sm font-medium text-cyan-300 mb-1">URL</label>
              <input id="source-content-url" type="url" value={content} onChange={(e) => setContent(e.target.value)} placeholder="https://example.com"
                className="w-full bg-black/30 border border-cyan-500/30 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition" required />
            </div>
          )}

          {activeTab === 'pdf' && (
             <div>
              <label htmlFor="source-content-pdf" className="block text-sm font-medium text-cyan-300 mb-1">Upload PDF</label>
              <input id="source-content-pdf" type="file" accept=".pdf" onChange={handleFileChange}
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30" required />
              {pdfLoading && <div className="flex items-center space-x-2 mt-2 text-cyan-300"><LoadingSpinnerIcon className="w-4 h-4" /> <span>Parsing PDF...</span></div>}
              {pdfError && <p className="text-red-400 mt-2 text-sm">{pdfError}</p>}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-500/20 rounded-md hover:bg-gray-500/40 transition">Cancel</button>
            <button type="submit" disabled={pdfLoading || !name.trim() || !content.trim()} className="px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-500 transition shadow-[0_0_8px_theme(colors.cyan.500)] disabled:bg-gray-600 disabled:cursor-not-allowed">Add Source</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setIsAdding(true)} className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-cyan-500/10 text-cyan-300 rounded-lg border-2 border-dashed border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition">
          <PlusIcon className="w-5 h-5" />
          <span>Add New Source</span>
        </button>
      )}

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-300 mt-6 text-shadow-cyan">Your Sources</h3>
        {sources.length > 0 ? (
          <ul className="space-y-2">
            {sources.map(source => (
              <li key={source.id} className="flex items-center p-3 bg-black/20 border border-cyan-500/10 rounded-lg shadow-md">
                {source.type === 'text' && <DocumentIcon className="w-5 h-5 mr-3 text-cyan-400 flex-shrink-0" />}
                {source.type === 'url' && <LinkIcon className="w-5 h-5 mr-3 text-cyan-400 flex-shrink-0" />}
                {source.type === 'pdf' && <PDFIcon className="w-5 h-5 mr-3 text-cyan-400 flex-shrink-0" />}
                <span className="text-gray-200 truncate" title={source.name}>{source.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-center py-4">No sources added yet.</p>
        )}
      </div>
    </div>
  );
};