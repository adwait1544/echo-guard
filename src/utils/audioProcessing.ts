// Extract MFCC features from audio buffer
export const extractMFCC = (audioBuffer: AudioBuffer, numCoefficients = 13): number[][] => {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  
  const frameSize = 2048;
  const hopSize = 512;
  const numFrames = Math.floor((channelData.length - frameSize) / hopSize);
  
  const mfccFeatures: number[][] = [];
  
  for (let i = 0; i < Math.min(numFrames, 100); i++) {
    const frameStart = i * hopSize;
    const frame = channelData.slice(frameStart, frameStart + frameSize);
    
    const windowedFrame = applyHammingWindow(frame);
    const spectrum = computeSpectrum(windowedFrame);
    const melSpectrum = applyMelFilterbank(spectrum, sampleRate);
    const mfcc = computeDCT(melSpectrum, numCoefficients);
    
    mfccFeatures.push(mfcc);
  }
  
  return mfccFeatures;
};

const applyHammingWindow = (frame: Float32Array): Float32Array => {
  const windowed = new Float32Array(frame.length);
  for (let i = 0; i < frame.length; i++) {
    windowed[i] = frame[i] * (0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (frame.length - 1)));
  }
  return windowed;
};

const computeSpectrum = (frame: Float32Array): number[] => {
  const spectrum: number[] = [];
  const n = frame.length;
  
  for (let k = 0; k < n / 2; k++) {
    let real = 0;
    let imag = 0;
    
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * k * i) / n;
      real += frame[i] * Math.cos(angle);
      imag -= frame[i] * Math.sin(angle);
    }
    
    spectrum.push(Math.sqrt(real * real + imag * imag));
  }
  
  return spectrum;
};

const applyMelFilterbank = (spectrum: number[], sampleRate: number, numFilters = 26): number[] => {
  const melSpectrum: number[] = [];
  const maxMel = 2595 * Math.log10(1 + (sampleRate / 2) / 700);
  
  for (let i = 0; i < numFilters; i++) {
    const melStart = (i * maxMel) / numFilters;
    const melEnd = ((i + 1) * maxMel) / numFilters;
    
    let sum = 0;
    for (let j = 0; j < spectrum.length; j++) {
      const freq = (j * sampleRate) / (spectrum.length * 2);
      const mel = 2595 * Math.log10(1 + freq / 700);
      
      if (mel >= melStart && mel <= melEnd) {
        sum += spectrum[j];
      }
    }
    
    melSpectrum.push(Math.log(sum + 1e-10));
  }
  
  return melSpectrum;
};

const computeDCT = (melSpectrum: number[], numCoefficients: number): number[] => {
  const dct: number[] = [];
  const n = melSpectrum.length;
  
  for (let k = 0; k < numCoefficients; k++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += melSpectrum[i] * Math.cos((Math.PI * k * (i + 0.5)) / n);
    }
    dct.push(sum);
  }
  
  return dct;
};

export interface ForgeryAnalysisResult {
  authenticity_score: number;
  confidence: string;
  verdict: string;
  reasoning: string;
  detected_anomalies: string[];
}

// Analyze forgery via AI-powered backend
export const analyzeForgery = async (
  mfccFeatures: number[][],
  duration: number,
  sampleRate: number
): Promise<ForgeryAnalysisResult> => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-audio`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ mfccFeatures, duration, sampleRate }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Analysis failed" }));
    throw new Error(err.error || "Analysis failed");
  }

  return response.json();
};
