import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  frequencyData: Uint8Array | null;
  isPlaying: boolean;
}

const BAR_WIDTH = 3;
const BAR_GAP = 2;
const BAR_COLOR = '#00ffff'; // Neon Cyan

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ frequencyData, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frequencyData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    
    ctx.fillStyle = BAR_COLOR;
    ctx.shadowColor = BAR_COLOR;
    ctx.shadowBlur = 5;

    const bufferLength = frequencyData.length;
    const totalBarWidth = BAR_WIDTH + BAR_GAP;
    const numBars = Math.floor(width / totalBarWidth);
    
    let x = 0;

    for (let i = 0; i < numBars; i++) {
        // Use a subset of frequency data to avoid visual clutter
        const dataIndex = Math.floor(i * (bufferLength / numBars));
        const barHeight = (frequencyData[dataIndex] / 255) * height * 0.8;
        
        const y = height - barHeight;

        ctx.fillRect(x, y, BAR_WIDTH, barHeight);
        x += totalBarWidth;
    }
    
  }, [frequencyData]);

  return (
    <div className={`transition-all duration-500 ease-in-out ${isPlaying ? 'h-16 opacity-100' : 'h-0 opacity-0'}`}>
        <canvas ref={canvasRef} width="600" height="64" className="w-full h-full" />
    </div>
  );
};
