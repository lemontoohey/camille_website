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

// Map Hue (0-360) to an audible frequency (150Hz to 600Hz)
const hueToFreq = (hue: number) => {
  return 150 + (hue / 360) * 450;
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

  const playColorChord = useCallback((colors: string[]) => {
    if (typeof window === 'undefined') return;
    initAudio();
    if (!ctxRef.current) return;

    const ctx = ctxRef.current;
    
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = 0;

    // Cinematic Envelope for the chord
    masterGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1); 
    masterGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.6); 
    masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3.0); 

    colors.forEach((hex, i) => {
      const hue = hexToHue(hex);
      const freq = hueToFreq(hue);

      const osc = ctx.createOscillator();
      // Mix waveforms for richer texture: base color gets sine, others get triangle/saw
      osc.type = i === 0 ? 'sine' : (i === 1 ? 'triangle' : 'sawtooth');
      
      // Add slight detuning based on index for chorus effect
      osc.frequency.value = freq + (i * 1.5);

      const panner = ctx.createStereoPanner();
      // Spread the colors across the stereo field (-0.8 to 0.8)
      panner.pan.value = colors.length > 1 ? (i / (colors.length - 1)) * 1.6 - 0.8 : 0;

      // Per-oscillator gain to balance harsh waveforms
      const oscGain = ctx.createGain();
      oscGain.gain.value = i === 0 ? 0.6 : 0.2; // Sine is louder, saw/triangle softer

      osc.connect(oscGain);
      oscGain.connect(panner);
      panner.connect(masterGain);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 3.5);
    });

    setTimeout(() => {
      masterGain.disconnect();
    }, 4000);
  }, [initAudio]);

  return { playColorChord };
};
