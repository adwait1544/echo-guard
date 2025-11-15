import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useEffect, useRef } from "react";

interface AnalysisResultsProps {
  authenticity: number;
  isProcessing: boolean;
  audioBuffer?: AudioBuffer | null;
}

export const AnalysisResults = ({ authenticity, isProcessing, audioBuffer }: AnalysisResultsProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.fillStyle = 'hsl(var(--background))';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'hsl(var(--primary))';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    for (let i = 0; i < width; i++) {
      const min = Math.min(...Array.from(data.slice(i * step, (i + 1) * step)));
      const max = Math.max(...Array.from(data.slice(i * step, (i + 1) * step)));
      
      ctx.moveTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
    }

    ctx.stroke();
  }, [audioBuffer]);
  const getStatus = () => {
    if (authenticity >= 0.8) return { 
      label: "Authentic", 
      color: "text-success",
      icon: CheckCircle,
      bgColor: "bg-success/20"
    };
    if (authenticity >= 0.5) return { 
      label: "Uncertain", 
      color: "text-warning",
      icon: AlertTriangle,
      bgColor: "bg-warning/20"
    };
    return { 
      label: "Forged", 
      color: "text-destructive",
      icon: XCircle,
      bgColor: "bg-destructive/20"
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Detection Results</h3>
      
      {isProcessing ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-muted-foreground">Analyzing audio...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {audioBuffer && (
            <div className="p-4 rounded-lg bg-card border border-border">
              <p className="text-sm text-muted-foreground mb-2">Audio Waveform</p>
              <canvas
                ref={canvasRef}
                width={600}
                height={80}
                className="w-full h-20 rounded"
              />
            </div>
          )}

          <div className={`flex items-center gap-3 p-4 rounded-lg ${status.bgColor}`}>
            <StatusIcon className={`w-8 h-8 ${status.color}`} />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className={`text-2xl font-bold ${status.color}`}>{status.label}</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Authenticity Score</span>
              <span className="text-sm font-semibold">{(authenticity * 100).toFixed(1)}%</span>
            </div>
            <Progress value={authenticity * 100} className="h-3" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-sm text-muted-foreground">Confidence</p>
              <p className="text-lg font-semibold">
                {authenticity >= 0.8 || authenticity <= 0.2 ? "High" : "Medium"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Model</p>
              <p className="text-lg font-semibold">CNN-MFCC</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
