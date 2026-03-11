'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useUiStore } from '../store/useUiStore';

const SMALT_COLOR = '#406060';

export const PageTransition = () => {
  const flashRef = useRef<HTMLDivElement>(null);
  const isTransitioning = useUiStore((state) => state.isTransitioning);
  const setIsTransitioning = useUiStore((state) => state.setIsTransitioning);

  useEffect(() => {
    if (!flashRef.current) return;

    if (isTransitioning) {
      gsap.set(flashRef.current, { opacity: 0 });

      // 1. Flash to opacity 0.3 for 100ms
      gsap.to(flashRef.current, {
        opacity: 0.3,
        duration: 0.1,
        ease: 'none',
        onComplete: () => {
          // 2. Hold briefly, then dissolve back over 800ms
          gsap.to(flashRef.current, {
            opacity: 0,
            duration: 0.8,
            ease: 'power1.inOut',
            onComplete: () => setIsTransitioning(false),
          });
        },
      });
    }
  }, [isTransitioning, setIsTransitioning]);

  return (
    <div
      ref={flashRef}
      className="fixed inset-0 z-[300] pointer-events-none"
      style={{ backgroundColor: SMALT_COLOR }}
    />
  );
};
