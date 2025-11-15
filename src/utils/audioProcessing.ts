// Extract MFCC features from audio buffer
export const extractMFCC = (audioBuffer: AudioBuffer, numCoefficients = 13): number[][] => {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  
  // Frame size and hop size for MFCC
  const frameSize = 2048;
  const hopSize = 512;
  const numFrames = Math.floor((channelData.length - frameSize) / hopSize);
  
  const mfccFeatures: number[][] = [];
  
  for (let i = 0; i < Math.min(numFrames, 100); i++) {
    const frameStart = i * hopSize;
    const frame = channelData.slice(frameStart, frameStart + frameSize);
    
    // Apply Hamming window
    const windowedFrame = applyHammingWindow(frame);
    
    // Compute FFT (simplified version)
    const spectrum = computeSpectrum(windowedFrame);
    
    // Apply Mel filterbank
    const melSpectrum = applyMelFilterbank(spectrum, sampleRate);
    
    // Compute DCT to get MFCC
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

// Simulate CNN-based forgery detection
export const analyzeForgery = (mfccFeatures: number[][]): number => {
  // This simulates a CNN model analysis
  // In a real implementation, this would use a trained model
  
  let totalVariance = 0;
  let patternScore = 0;
  
  // Analyze temporal consistency
  for (let i = 1; i < mfccFeatures.length; i++) {
    let frameDiff = 0;
    for (let j = 0; j < mfccFeatures[i].length; j++) {
      frameDiff += Math.abs(mfccFeatures[i][j] - mfccFeatures[i - 1][j]);
    }
    totalVariance += frameDiff;
  }
  
  // Analyze spectral patterns
  for (let i = 0; i < mfccFeatures.length; i++) {
    const mean = mfccFeatures[i].reduce((a, b) => a + b, 0) / mfccFeatures[i].length;
    const variance = mfccFeatures[i].reduce((a, b) => a + Math.pow(b - mean, 2), 0) / mfccFeatures[i].length;
    patternScore += variance;
  }
  
  // Normalize scores
  const normalizedVariance = Math.min(totalVariance / (mfccFeatures.length * 100), 1);
  const normalizedPattern = Math.min(patternScore / mfccFeatures.length, 1);
  
  // Combine scores (higher means more likely authentic)
  const authenticityScore = 0.7 * (1 - normalizedVariance) + 0.3 * normalizedPattern;
  
  // Add some randomness to simulate model uncertainty
  const noise = (Math.random() - 0.5) * 0.1;
  
  return Math.max(0, Math.min(1, authenticityScore + noise));
};
