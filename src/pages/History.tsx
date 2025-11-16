import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Analysis {
  id: string;
  file_name: string;
  authenticity_score: number;
  duration: number;
  sample_rate: number;
  created_at: string;
}

const History = () => {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchAnalyses();
  }, [user, navigate]);

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from("audio_analyses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading history",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (score >= 0.5) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusLabel = (score: number) => {
    if (score >= 0.8) return "Authentic";
    if (score >= 0.5) return "Suspicious";
    return "Likely Forged";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Activity className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Analysis History</h1>
              <p className="text-muted-foreground">View your past audio analyses</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-muted-foreground">Loading...</div>
        ) : analyses.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No analyses yet</p>
            <Button onClick={() => navigate("/")}>Start Analyzing</Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analyses.map((analysis) => (
              <Card key={analysis.id} className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate" title={analysis.file_name}>
                      {analysis.file_name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(analysis.created_at).toLocaleDateString()} at{" "}
                      {new Date(analysis.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  {getStatusIcon(Number(analysis.authenticity_score))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium">
                      {getStatusLabel(Number(analysis.authenticity_score))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Authenticity:</span>
                    <span className="font-medium">
                      {(Number(analysis.authenticity_score) * 100).toFixed(1)}%
                    </span>
                  </div>
                  {analysis.duration && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{analysis.duration.toFixed(2)}s</span>
                    </div>
                  )}
                  {analysis.sample_rate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sample Rate:</span>
                      <span>{analysis.sample_rate}Hz</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
