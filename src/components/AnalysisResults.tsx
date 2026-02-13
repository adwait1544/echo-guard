import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { ForgeryAnalysisResult } from "@/utils/audioProcessing";

interface AnalysisResultsProps {
  result: ForgeryAnalysisResult | null;
  isProcessing: boolean;
  audioBuffer?: AudioBuffer | null;
}

export const AnalysisResults = ({ result, isProcessing, audioBuffer }: AnalysisResultsProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const styles = getComputedStyle(canvas);
    const bgColor = styles.getPropertyValue('--background').trim();
    const primaryColor = styles.getPropertyValue('--primary').trim();

    const width = canvas.width;
    const height = canvas.height;
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.fillStyle = bgColor ? `hsl(${bgColor})` : "#181d2a";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = primaryColor ? `hsl(${primaryColor})` : "#22b8cf";
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
    if (!result) return { label: "Pending", color: "text-muted-foreground", icon: AlertTriangle, bgColor: "bg-muted" };
    
    if (result.verdict === "authentic" || result.authenticity_score >= 0.8) return { 
      label: "Authentic", color: "text-success", icon: CheckCircle, bgColor: "bg-success/20"
    };
    if (result.verdict === "uncertain" || result.authenticity_score >= 0.5) return { 
      label: "Uncertain", color: "text-warning", icon: AlertTriangle, bgColor: "bg-warning/20"
    };
    return { 
      label: "Forged", color: "text-destructive", icon: XCircle, bgColor: "bg-destructive/20"
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
          <p className="text-muted-foreground">Analyzing audio with AI...</p>
        </div>
      ) : result ? (
        <div className="space-y-6">
          {audioBuffer && (
            <div className="p-4 rounded-lg bg-card border border-border">
              <p className="text-sm text-muted-foreground mb-2">Audio Waveform</p>
              <canvas ref={canvasRef} width={600} height={80} className="w-full h-20 rounded" />
            </div>
          )}

          <div className={`flex items-center gap-3 p-4 rounded-lg ${status.bgColor}`}>
            <StatusIcon className={`w-8 h-8 ${status.color}`} />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Verdict</p>
              <p className={`text-2xl font-bold ${status.color}`}>{status.label}</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Authenticity Score</span>
              <span className="text-sm font-semibold">{(result.authenticity_score * 100).toFixed(1)}%</span>
            </div>
            <Progress value={result.authenticity_score * 100} className="h-3" />
          </div>

          <div className="p-4 rounded-lg bg-card border border-border">
            <p className="text-sm text-muted-foreground mb-1">AI Reasoning</p>
            <p className="text-sm">{result.reasoning}</p>
          </div>

          {result.detected_anomalies.length > 0 && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm font-semibold text-destructive mb-2">Detected Anomalies</p>
              <ul className="text-sm space-y-1">
                {result.detected_anomalies.map((anomaly, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>{anomaly}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-sm text-muted-foreground">Confidence</p>
              <p className="text-lg font-semibold capitalize">{result.confidence}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Model</p>
              <p className="text-lg font-semibold">AI + MFCC</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">Upload audio to begin analysis</p>
      )}
    </Card>
  );
};
