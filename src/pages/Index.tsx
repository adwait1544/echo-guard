import { useState } from "react";
import { AudioUploader } from "@/components/AudioUploader";
import { WaveformVisualizer } from "@/components/WaveformVisualizer";
import { MFCCVisualizer } from "@/components/MFCCVisualizer";
import { AnalysisResults } from "@/components/AnalysisResults";
import { extractMFCC, analyzeForgery } from "@/utils/audioProcessing";
import { useToast } from "@/hooks/use-toast";
import { Activity } from "lucide-react";

const Index = () => {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [mfccData, setMfccData] = useState<number[][] | null>(null);
  const [authenticity, setAuthenticity] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const buffer = await audioContext.decodeAudioData(arrayBuffer);
      
      setAudioBuffer(buffer);
      
      // Extract MFCC features
      toast({
        title: "Extracting MFCC features...",
        description: "Processing audio signal",
      });
      
      const mfcc = extractMFCC(buffer);
      setMfccData(mfcc);
      
      // Analyze for forgery
      toast({
        title: "Running CNN analysis...",
        description: "Detecting potential forgery",
      });
      
      // Simulate processing time for realistic UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const score = await analyzeForgery(mfcc);
      setAuthenticity(score);
      
      toast({
        title: "Analysis complete",
        description: `Authenticity score: ${(score * 100).toFixed(1)}%`,
      });
    } catch (error) {
      toast({
        title: "Error processing audio",
        description: "Please try a different file",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Audio Forgery Detection</h1>
              <p className="text-muted-foreground">CNN-based MFCC Analysis System</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
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
                    setAuthenticity(0);
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
                    authenticity={authenticity} 
                    isProcessing={isProcessing}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Prototype System • CNN + MFCC Feature Extraction</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
