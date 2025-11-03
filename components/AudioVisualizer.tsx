
import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  frequencyData: Uint8Array | null;
  isPlaying: boolean;
}

const BAR_WIDTH = 4;
const BAR_GAP = 2;

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ frequencyData, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frequencyData) {
        // Clear canvas if no data or not playing
        const ctx = canvas?.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        return;
    };

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const computedStyle = getComputedStyle(document.documentElement);
    const colorStop1 = computedStyle.getPropertyValue('--accent-stop-1').trim();
    const colorStop2 = computedStyle.getPropertyValue('--accent-stop-2').trim();
    const shadowColor = computedStyle.getPropertyValue('--shadow-glow').trim();

    const { width, height } = canvas;
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, colorStop1);
    gradient.addColorStop(1, colorStop2);

    ctx.clearRect(0, 0, width, height);
    
    ctx.fillStyle = gradient;
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 10;

    const bufferLength = frequencyData.length;
    const totalBarWidth = BAR_WIDTH + BAR_GAP;
    const numBars = Math.floor(width / totalBarWidth);
    const centerY = height / 2;
    
    let x = 0;

    for (let i = 0; i < numBars; i++) {
        // Use a subset of frequency data and apply a power curve for more dynamic visuals
        const dataIndex = Math.floor(i * (bufferLength / numBars));
        const barHeight = Math.pow(frequencyData[dataIndex] / 255, 2.5) * height;
        
        // Don't draw bars that are too small
        if (barHeight < 2) continue;

        const y = centerY - barHeight / 2;
        const radius = BAR_WIDTH / 2;
        
        // Draw rounded symmetrical bars from the center
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + BAR_WIDTH - radius, y);
        ctx.quadraticCurveTo(x + BAR_WIDTH, y, x + BAR_WIDTH, y + radius);
        ctx.lineTo(x + BAR_WIDTH, y + barHeight - radius);
        ctx.quadraticCurveTo(x + BAR_WIDTH, y + barHeight, x + BAR_WIDTH - radius, y + barHeight);
        ctx.lineTo(x + radius, y + barHeight);
        ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        x += totalBarWidth;
    }
    
  }, [frequencyData, isPlaying]); // Rerun when isPlaying changes to clear canvas on stop

  return (
    <div className={`transition-all duration-500 ease-in-out ${isPlaying ? 'h-20 opacity-100' : 'h-0 opacity-0'}`}>
        <canvas ref={canvasRef} width="600" height="80" className="w-full h-full" />
    </div>
  );
};
