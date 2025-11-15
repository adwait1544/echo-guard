import { Card } from "@/components/ui/card";
import { useEffect, useRef } from "react";

interface MFCCVisualizerProps {
  mfccData: number[][] | null;
}

export const MFCCVisualizer = ({ mfccData }: MFCCVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!mfccData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cellWidth = width / mfccData[0].length;
    const cellHeight = height / mfccData.length;

    ctx.clearRect(0, 0, width, height);

    // Find min and max for normalization
    const flat = mfccData.flat();
    const min = Math.min(...flat);
    const max = Math.max(...flat);

    mfccData.forEach((row, i) => {
      row.forEach((value, j) => {
        const normalized = (value - min) / (max - min);
        const hue = 195; // Primary color hue
        const lightness = 30 + normalized * 50;
        ctx.fillStyle = `hsl(${hue}, 85%, ${lightness}%)`;
        ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
      });
    });
  }, [mfccData]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">MFCC Features</h3>
      <canvas
        ref={canvasRef}
        width={800}
        height={300}
        className="w-full h-auto bg-card rounded"
      />
    </Card>
  );
};
