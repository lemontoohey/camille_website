'use client';

import { useRef, useCallback } from 'react';

export const useHapticSound = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastTriggerTime = useRef<number>(0);

  const initAudio = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const triggerSound = useCallback((velocity: number) => {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    // Throttle: 500ms, Threshold: 15
    if (now - lastTriggerTime.current < 500 || Math.abs(velocity) < 15) return;
    
    initAudio();
    if (!audioCtxRef.current) return;

    const ctx = audioCtxRef.current;
    lastTriggerTime.current = now;

    // 1. Oscillator Chain Setup
    const masterGain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    
    masterGain.connect(panner);
    panner.connect(ctx.destination);

    // Sub-Bass: Sawtooth (30Hz - 50Hz)
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(30 + Math.random() * 20, ctx.currentTime);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.3, ctx.currentTime);
    subOsc.connect(subGain);
    subGain.connect(masterGain);

    // Harmonic: Sine (120Hz, 50% of sub gain)
    const harmonicOsc = ctx.createOscillator();
    harmonicOsc.type = 'sine';
    harmonicOsc.frequency.setValueAtTime(120, ctx.currentTime);
    const harmonicGain = ctx.createGain();
    harmonicGain.gain.setValueAtTime(0.15, ctx.currentTime);
    harmonicOsc.connect(harmonicGain);
    harmonicGain.connect(masterGain);

    // Texture: Triangle (detuned, 10-15% gain)
    const textureOsc = ctx.createOscillator();
    textureOsc.type = 'triangle';
    textureOsc.frequency.setValueAtTime((30 + Math.random() * 20) * 1.05, ctx.currentTime);
    const textureGain = ctx.createGain();
    textureGain.gain.setValueAtTime(0.04, ctx.currentTime);
    textureOsc.connect(textureGain);
    textureGain.connect(masterGain);

    // 2. Spatial Sweep
    const startPan = velocity > 0 ? -1 : 1;
    panner.pan.setValueAtTime(startPan, ctx.currentTime);
    panner.pan.linearRampToValueAtTime(-startPan, ctx.currentTime + 1.5);

    // 3. ADSR Envelope (Linear ramps for organic feel)
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.2); // Attack
    masterGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.5); // Decay
    masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5); // Release

    // Start all
    subOsc.start(ctx.currentTime);
    harmonicOsc.start(ctx.currentTime);
    textureOsc.start(ctx.currentTime);

    // Stop and cleanup
    subOsc.stop(ctx.currentTime + 1.5);
    harmonicOsc.stop(ctx.currentTime + 1.5);
    textureOsc.stop(ctx.currentTime + 1.5);
    
    setTimeout(() => {
      subOsc.disconnect();
      harmonicOsc.disconnect();
      textureOsc.disconnect();
      subGain.disconnect();
      harmonicGain.disconnect();
      textureGain.disconnect();
      masterGain.disconnect();
      panner.disconnect();
    }, 2000);
  }, [initAudio]);

  return { triggerSound };
};
