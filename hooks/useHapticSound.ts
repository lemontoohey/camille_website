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
  const activeGainRef = useRef<GainNode | null>(null);

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

  const stopArtworkAtmosphere = useCallback(() => {
    if (!ctxRef.current || !activeGainRef.current) return;
    const ctx = ctxRef.current;
    const gainNode = activeGainRef.current;
    const now = ctx.currentTime;

    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1);

    setTimeout(() => {
      gainNode.disconnect();
      activeGainRef.current = null;
    }, 1100);
  }, []);

  useEffect(() => {
    return () => {
      stopArtworkAtmosphere();
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        ctxRef.current.close();
      }
    };
  }, [stopArtworkAtmosphere]);

  const playArtworkAtmosphere = useCallback((colors: string[]) => {
    if (typeof window === 'undefined') return;
    initAudio();
    if (!ctxRef.current) return;

    stopArtworkAtmosphere();

    const ctx = ctxRef.current;
    const now = ctx.currentTime;

    const hue = colors.length > 0 ? hexToHue(colors[0]) : 0;
    const baseFreq = 25 + (hue / 360) * 20;

    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    activeGainRef.current = masterGain;

    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(1.0, now + 1.0);
    masterGain.gain.setValueAtTime(1.0, now + 6.0);
    masterGain.gain.linearRampToValueAtTime(0, now + 10.0);

    // --- SUB BASS ---
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(baseFreq, now);
    subOsc.frequency.setValueAtTime(baseFreq, now + 2.0);
    subOsc.frequency.exponentialRampToValueAtTime(baseFreq * 3, now + 2.5);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.6, now + 2.0);

    // --- HARMONIC SINE: 65Hz, barely audible texture ---
    const harmonicOsc = ctx.createOscillator();
    harmonicOsc.type = 'sine';
    harmonicOsc.frequency.setValueAtTime(65, now);
    const harmonicGain = ctx.createGain();
    harmonicGain.gain.setValueAtTime(0, now);
    harmonicGain.gain.linearRampToValueAtTime(0.04, now + 2.5);

    // --- STEREO PANNER: -0.2 to 0.2 range ---
    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(0, now);

    const panLfo = ctx.createOscillator();
    panLfo.type = 'sine';
    panLfo.frequency.setValueAtTime(0, now);
    panLfo.frequency.setValueAtTime(0, now + 2.5);
    panLfo.frequency.linearRampToValueAtTime(4, now + 3.0);

    const panLfoGain = ctx.createGain();
    panLfoGain.gain.setValueAtTime(0, now);
    panLfoGain.gain.setValueAtTime(0, now + 2.5);
    panLfoGain.gain.linearRampToValueAtTime(0.2, now + 3.0);

    panLfo.connect(panLfoGain);
    panLfoGain.connect(panner.pan);

    // --- TRIANGLE TEXTURE ---
    const texGain = ctx.createGain();
    texGain.gain.setValueAtTime(0, now);
    texGain.gain.setValueAtTime(0, now + 2.5);
    texGain.gain.linearRampToValueAtTime(0.12, now + 3.0);

    const texOsc1 = ctx.createOscillator();
    texOsc1.type = 'triangle';
    texOsc1.frequency.setValueAtTime(baseFreq * 2.5, now + 2.5);

    const texOsc2 = ctx.createOscillator();
    texOsc2.type = 'triangle';
    texOsc2.frequency.setValueAtTime(baseFreq * 3.2, now + 2.5);

    subOsc.connect(subGain);
    subGain.connect(panner);
    harmonicOsc.connect(harmonicGain);
    harmonicGain.connect(panner);
    texOsc1.connect(texGain);
    texOsc2.connect(texGain);
    texGain.connect(panner);
    panner.connect(masterGain);

    const stopTime = now + 10.5;
    subOsc.start(now);
    harmonicOsc.start(now);
    panLfo.start(now);
    texOsc1.start(now + 2.5);
    texOsc2.start(now + 2.5);

    subOsc.stop(stopTime);
    harmonicOsc.stop(stopTime);
    panLfo.stop(stopTime);
    texOsc1.stop(stopTime);
    texOsc2.stop(stopTime);

    setTimeout(() => {
      if (activeGainRef.current === masterGain) {
        masterGain.disconnect();
        activeGainRef.current = null;
      }
    }, 11000);
  }, [initAudio, stopArtworkAtmosphere]);

  return { playArtworkAtmosphere, stopArtworkAtmosphere };
};
