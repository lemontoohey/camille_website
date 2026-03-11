'use client';

import { useRef, useCallback, useEffect } from 'react';

// Helper: Convert Hex to Hue (0-360)
const hexToHue = (hex: string) => {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  if (max !== min) {
    let d = max - min;
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return h * 360;
};

export const useHapticSound = () => {
  const ctxRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!ctxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new AudioContextClass();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        ctxRef.current.close();
      }
    };
  }, []);

  const playArtworkAtmosphere = useCallback((colors: string[]) => {
    if (typeof window === 'undefined') return;
    initAudio();
    if (!ctxRef.current) return;

    const ctx = ctxRef.current;
    const now = ctx.currentTime;
    
    // 1. Calculate Base Frequency from primary color hue (Range: ~25Hz - 45Hz sub bass)
    const hue = colors.length > 0 ? hexToHue(colors[0]) : 0;
    const baseFreq = 25 + (hue / 360) * 20;

    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    
    // Master envelope: Fade in, hold, fade out completely over ~10s
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(1.0, now + 1.0);
    masterGain.gain.setValueAtTime(1.0, now + 6.0);
    masterGain.gain.linearRampToValueAtTime(0, now + 10.0);

    // --- OSCILLATOR 1: SUB BASS (Rises out of silence) ---
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(baseFreq, now);
    
    // "Harmonic jump": at t=2.0, glides up to a higher harmonic (e.g., 3rd harmonic)
    subOsc.frequency.setValueAtTime(baseFreq, now + 2.0);
    subOsc.frequency.exponentialRampToValueAtTime(baseFreq * 3, now + 2.5);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0, now);
    // Slowly rise out of silence over 2 seconds
    subGain.gain.linearRampToValueAtTime(0.6, now + 2.0);

    // --- OSCILLATOR 2 & 3: L-R OSCILLATING TRIANGLE TEXTURE ---
    // Start panning at t=2.5 when the harmonic jump finishes
    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(0, now);

    const panLfo = ctx.createOscillator();
    panLfo.type = 'sine';
    panLfo.frequency.setValueAtTime(0, now);
    panLfo.frequency.setValueAtTime(0, now + 2.5);
    // Quickly ramp up to a fast 4Hz L-R oscillation
    panLfo.frequency.linearRampToValueAtTime(4, now + 3.0); 

    const panLfoGain = ctx.createGain();
    panLfoGain.gain.setValueAtTime(0, now);
    panLfoGain.gain.setValueAtTime(0, now + 2.5);
    // Full Left to Right sweep
    panLfoGain.gain.linearRampToValueAtTime(0.8, now + 3.0); 

    panLfo.connect(panLfoGain);
    panLfoGain.connect(panner.pan);

    const texGain = ctx.createGain();
    texGain.gain.setValueAtTime(0, now);
    texGain.gain.setValueAtTime(0, now + 2.5);
    // Fade in triangular textures quickly at t=2.5
    texGain.gain.linearRampToValueAtTime(0.15, now + 3.0); 

    const texOsc1 = ctx.createOscillator();
    texOsc1.type = 'triangle';
    texOsc1.frequency.setValueAtTime(baseFreq * 3 + 1.5, now + 2.5); // Slightly detuned

    const texOsc2 = ctx.createOscillator();
    texOsc2.type = 'triangle';
    texOsc2.frequency.setValueAtTime(baseFreq * 4 - 2.0, now + 2.5); // Add depth

    // Routing
    subOsc.connect(subGain);
    subGain.connect(panner);
    
    texOsc1.connect(texGain);
    texOsc2.connect(texGain);
    texGain.connect(panner);
    
    panner.connect(masterGain);

    // Start all
    subOsc.start(now);
    panLfo.start(now);
    texOsc1.start(now + 2.5);
    texOsc2.start(now + 2.5);

    // Stop all after 10.5s to ensure clean garbage collection
    const stopTime = now + 10.5;
    subOsc.stop(stopTime);
    panLfo.stop(stopTime);
    texOsc1.stop(stopTime);
    texOsc2.stop(stopTime);

    setTimeout(() => {
      masterGain.disconnect();
    }, 11000);

  }, [initAudio]);

  return { playArtworkAtmosphere };
};
