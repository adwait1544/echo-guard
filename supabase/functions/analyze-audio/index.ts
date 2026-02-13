import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mfccFeatures, duration, sampleRate } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Compute statistical summaries of MFCC features for the AI to analyze
    const numFrames = mfccFeatures.length;
    const numCoeffs = mfccFeatures[0]?.length || 0;

    // Per-coefficient statistics
    const coeffStats = [];
    for (let c = 0; c < numCoeffs; c++) {
      const vals = mfccFeatures.map((f: number[]) => f[c]);
      const mean = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
      const variance = vals.reduce((a: number, b: number) => a + (b - mean) ** 2, 0) / vals.length;
      const std = Math.sqrt(variance);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      coeffStats.push({ coeff: c, mean: +mean.toFixed(4), std: +std.toFixed(4), min: +min.toFixed(4), max: +max.toFixed(4) });
    }

    // Frame-to-frame deltas (temporal consistency)
    const frameDiffs = [];
    for (let i = 1; i < numFrames; i++) {
      let diff = 0;
      for (let j = 0; j < numCoeffs; j++) {
        diff += Math.abs(mfccFeatures[i][j] - mfccFeatures[i - 1][j]);
      }
      frameDiffs.push(+diff.toFixed(4));
    }
    const avgDelta = frameDiffs.reduce((a, b) => a + b, 0) / frameDiffs.length;
    const maxDelta = Math.max(...frameDiffs);
    const deltaVariance = frameDiffs.reduce((a, b) => a + (b - avgDelta) ** 2, 0) / frameDiffs.length;

    // Detect sudden jumps (potential splice points)
    const deltaThreshold = avgDelta + 2 * Math.sqrt(deltaVariance);
    const suspiciousFrames = frameDiffs
      .map((d, i) => ({ frame: i, delta: d }))
      .filter((f) => f.delta > deltaThreshold);

    const analysisData = {
      duration: +duration.toFixed(2),
      sampleRate,
      numFrames,
      numCoeffs,
      coefficientStats: coeffStats,
      temporalAnalysis: {
        avgFrameDelta: +avgDelta.toFixed(4),
        maxFrameDelta: +maxDelta.toFixed(4),
        deltaVariance: +deltaVariance.toFixed(4),
        suspiciousFrameCount: suspiciousFrames.length,
        suspiciousFrames: suspiciousFrames.slice(0, 10),
      },
    };

    const systemPrompt = `You are an expert audio forensics analyst specializing in detecting forged, spliced, or AI-generated audio. 
You analyze MFCC (Mel-Frequency Cepstral Coefficient) statistical features extracted from audio files.

Your task: Given the MFCC statistics below, determine if the audio is likely authentic or forged.

Key indicators of forgery:
- Unusual sudden jumps in frame-to-frame MFCC deltas (splice points)
- Abnormally low variance in MFCC coefficients (synthetic/generated audio tends to be "too smooth")
- Inconsistent spectral patterns across time
- Anomalous coefficient distributions (extreme skew, bimodal patterns)

You MUST respond using the provided tool to return structured results.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze the following MFCC feature statistics for signs of audio forgery:\n\n${JSON.stringify(analysisData, null, 2)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_forgery_analysis",
              description: "Report the results of audio forgery analysis",
              parameters: {
                type: "object",
                properties: {
                  authenticity_score: {
                    type: "number",
                    description: "Score from 0 to 1 where 0 means definitely forged and 1 means definitely authentic",
                  },
                  confidence: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                    description: "Confidence level of the analysis",
                  },
                  verdict: {
                    type: "string",
                    enum: ["authentic", "uncertain", "forged"],
                    description: "Overall verdict",
                  },
                  reasoning: {
                    type: "string",
                    description: "Brief explanation of the analysis findings (2-3 sentences)",
                  },
                  detected_anomalies: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of specific anomalies detected, if any",
                  },
                },
                required: ["authenticity_score", "confidence", "verdict", "reasoning", "detected_anomalies"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_forgery_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI analysis failed");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("AI did not return structured analysis");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-audio error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
