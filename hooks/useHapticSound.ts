'use client';

import { useRef, useCallback, useEffect } from 'react';

export const useHapticSound = () => {
  const ctxRef = useRef<AudioContext | null>(null);
  const synthRef = useRef<{
    masterGain: GainNode;
    panner: StereoPannerNode;
  } | null>(null);
  const lastTriggerTime = useRef<number>(0);

  const initAudio = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!ctxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      ctxRef.current = ctx;

      // Create persistent nodes
      const masterGain = ctx.createGain();
      const panner = ctx.createStereoPanner();
      
      masterGain.connect(panner);
      panner.connect(ctx.destination);
      masterGain.gain.value = 0; // Keep silent by default

      // Persistent Sub-Bass
      const subOsc = ctx.createOscillator();
      subOsc.type = 'sawtooth';
      subOsc.frequency.value = 40;
      const subGain = ctx.createGain();
      subGain.gain.value = 0.3;
      subOsc.connect(subGain);
      subGain.connect(masterGain);

      // Persistent Harmonic
      const harmonicOsc = ctx.createOscillator();
      harmonicOsc.type = 'sine';
      harmonicOsc.frequency.value = 120;
      const harmonicGain = ctx.createGain();
      harmonicGain.gain.value = 0.15;
      harmonicOsc.connect(harmonicGain);
      harmonicGain.connect(masterGain);

      // Persistent Texture
      const textureOsc = ctx.createOscillator();
      textureOsc.type = 'triangle';
      textureOsc.frequency.value = 42; // slightly detuned
      const textureGain = ctx.createGain();
      textureGain.gain.value = 0.04;
      textureOsc.connect(textureGain);
      textureGain.connect(masterGain);

      subOsc.start();
      harmonicOsc.start();
      textureOsc.start();

      synthRef.current = { masterGain, panner };
    }
    
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
  }, []);

  // Cleanup on unmount to prevent leaks
  useEffect(() => {
    return () => {
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        ctxRef.current.close();
      }
    };
  }, []);

  const triggerSound = useCallback((velocity: number) => {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    // Throttle: 500ms, Threshold: 15
    if (now - lastTriggerTime.current < 500 || Math.abs(velocity) < 15) return;
    
    initAudio();
    if (!ctxRef.current || !synthRef.current) return;

    const ctx = ctxRef.current;
    const { masterGain, panner } = synthRef.current;
    
    lastTriggerTime.current = now;

    // 1. Spatial Sweep
    const startPan = velocity > 0 ? -0.8 : 0.8;
    panner.pan.cancelScheduledValues(ctx.currentTime);
    panner.pan.setValueAtTime(startPan, ctx.currentTime);
    panner.pan.linearRampToValueAtTime(-startPan, ctx.currentTime + 1.0);

    // 2. ADSR Envelope (Linear ramps for organic feel)
    // Cancel any ongoing envelopes
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    
    // Very fast attack, subtle decay, long release
    masterGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1); 
    masterGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.3); 
    masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2); 
  }, [initAudio]);

  return { triggerSound };
};
