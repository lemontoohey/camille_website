'use client';

import { ReactNode, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const Providers = ({ children }: { children: ReactNode }) => {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Register GSAP plugins inside useEffect to prevent SSR build errors
    gsap.registerPlugin(ScrollTrigger);

    // 1. Initialize Lenis for frictionless scroll (Optimized for performance)
    const lenis = new Lenis({
      lerp: 0.1,
      duration: 1.2,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      syncTouch: true,
    });
    lenisRef.current = lenis;

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on('scroll', (e: any) => {
      ScrollTrigger.update();
    });

    // Frame update loop - Cleaner GSAP ticker implementation
    const onFrame = (time: number, deltaTime: number) => {
      // time parameter is in ms from GSAP, lenis expects ms as well
      lenis.raf(time * 1000); 
    };

    gsap.ticker.add(onFrame);
    
    // Refresh ScrollTrigger after a tiny delay to ensure heights are calculated correctly
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(onFrame);
    };
  }, []);

  return <>{children}</>;
};
