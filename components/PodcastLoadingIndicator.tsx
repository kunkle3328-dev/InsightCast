import React, { useState, useEffect } from 'react';

const loadingSteps = [
  "Initializing cognitive matrix...",
  "Accessing knowledge archives...",
  "Synthesizing host personas...",
  "Generating conversational script...",
  "Calibrating dialogue flow...",
];

export const PodcastLoadingIndicator: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % loadingSteps.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/30">
        <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_theme(colors.cyan.400)]"></div>
      </div>
      <div className="flex-1 pt-1.5">
        <p className="font-medium text-cyan-300 transition-opacity duration-500">
          {loadingSteps[currentStep]}
        </p>
        <div className="w-full h-1 mt-2 bg-black/30 rounded-full overflow-hidden border border-cyan-500/20">
            <div className="h-full animate-progress"></div>
        </div>
      </div>
    </div>
  );
};