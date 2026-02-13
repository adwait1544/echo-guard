import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AudioUploader } from "@/components/AudioUploader";
import { WaveformVisualizer } from "@/components/WaveformVisualizer";
import { MFCCVisualizer } from "@/components/MFCCVisualizer";
import { AnalysisResults } from "@/components/AnalysisResults";
import { extractMFCC, analyzeForgery, ForgeryAnalysisResult } from "@/utils/audioProcessing";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Activity, History, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [mfccData, setMfccData] = useState<number[][] | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ForgeryAnalysisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const { toast } = useToast();
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const buffer = await audioContext.decodeAudioData(arrayBuffer);
      
      setAudioBuffer(buffer);
      
      toast({
        title: "Extracting MFCC features...",
        description: "Processing audio signal",
      });
      
      const mfcc = extractMFCC(buffer);
      setMfccData(mfcc);
      
      toast({
        title: "Running AI analysis...",
        description: "Detecting potential forgery",
      });
      
      const result = await analyzeForgery(mfcc, buffer.duration, buffer.sampleRate);
      setAnalysisResult(result);
      
      // Save to database
      if (user) {
        const { error: dbError } = await supabase
          .from("audio_analyses")
          .insert({
            user_id: user.id,
            file_name: file.name,
            authenticity_score: result.authenticity_score,
            duration: buffer.duration,
            sample_rate: buffer.sampleRate,
            mfcc_data: mfcc,
          });

        if (dbError) {
          console.error("Error saving analysis:", dbError);
        }
      }
      
      toast({
        title: "Analysis complete",
        description: `Verdict: ${result.verdict} (${(result.authenticity_score * 100).toFixed(1)}%)`,
      });
    } catch (error) {
      toast({
        title: "Error processing audio",
        description: error instanceof Error ? error.message : "Please try a different file",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Audio Forgery Detection</h1>
                <p className="text-muted-foreground">AI-powered MFCC Analysis System</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/history")}>
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {!audioBuffer ? (
            <AudioUploader onFileSelect={handleFileSelect} />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Analyzing: {fileName}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Duration: {audioBuffer.duration.toFixed(2)}s | Sample Rate: {audioBuffer.sampleRate}Hz
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAudioBuffer(null);
                    setMfccData(null);
                    setAnalysisResult(null);
                    setFileName("");
                  }}
                  className="text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                >
                  Upload New File
                </button>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                  <WaveformVisualizer audioBuffer={audioBuffer} />
                  <MFCCVisualizer mfccData={mfccData} />
                </div>
                
                <div>
                  <AnalysisResults 
                    result={analysisResult}
                    isProcessing={isProcessing}
                    audioBuffer={audioBuffer}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>AI-Powered Audio Forensics • MFCC Feature Extraction</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
