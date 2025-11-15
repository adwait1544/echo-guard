import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";

interface WaveformVisualizerProps {
  audioBuffer: AudioBuffer | null;
}

export const WaveformVisualizer = ({ audioBuffer }: WaveformVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.fillStyle = "hsl(var(--card))";
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 1;
    ctx.strokeStyle = "hsl(var(--primary))";
    ctx.beginPath();

    for (let i = 0; i < width; i++) {
      const min = Math.min(...Array.from({ length: step }, (_, j) => data[i * step + j] || 0));
      const max = Math.max(...Array.from({ length: step }, (_, j) => data[i * step + j] || 0));
      
      ctx.moveTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
    }

    ctx.stroke();
  }, [audioBuffer]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Audio Waveform</h3>
      <canvas
        ref={canvasRef}
        width={800}
        height={200}
        className="w-full h-auto bg-card rounded"
      />
    </Card>
  );
};
