import React from 'react';
import { LogoIcon, CreditCardIcon } from './icons';

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToStore: () => void;
}

export const CreditModal: React.FC<CreditModalProps> = ({ isOpen, onClose, onGoToStore }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
        onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md p-6 bg-black/30 border border-cyan-500/50 rounded-xl shadow-2xl shadow-cyan-500/20 text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
            <LogoIcon className="w-16 h-16 text-cyan-400"/>
        </div>
        <h2 className="text-2xl font-bold text-cyan-300 text-shadow-cyan">You're Low on Credits!</h2>
        <p className="mt-2 text-gray-400">
            You've used all your available credits for generating content. Please purchase more to continue creating amazing podcasts.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-500/20 rounded-md hover:bg-gray-500/40 transition w-full"
            >
                Maybe Later
            </button>
            <button 
                onClick={onGoToStore}
                className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-500 transition shadow-[0_0_8px_theme(colors.cyan.500)] w-full"
            >
                <CreditCardIcon className="w-5 h-5" />
                <span>Go to Credit Store</span>
            </button>
        </div>
      </div>
    </div>
  );
};
