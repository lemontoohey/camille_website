'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useUiStore } from '../store/useUiStore';

export const PageTransition = () => {
  const wipeRef = useRef<HTMLDivElement>(null);
  const isTransitioning = useUiStore((state) => state.isTransitioning);
  const setIsTransitioning = useUiStore((state) => state.setIsTransitioning);

  useEffect(() => {
    if (!wipeRef.current) return;

    if (isTransitioning) {
      const tl = gsap.timeline({
        onComplete: () => {
          // In a real scenario, this would be timed with the actual page load
          // For now we simulate the exit wipe after a delay
          setTimeout(() => {
            gsap.to(wipeRef.current, {
              scaleX: 0,
              duration: 0.8,
              ease: 'power4.inOut',
              transformOrigin: 'right center',
              onComplete: () => setIsTransitioning(false)
            });
          }, 400);
        }
      });

      tl.to(wipeRef.current, {
        scaleX: 1,
        duration: 0.8,
        ease: 'power4.inOut',
        transformOrigin: 'left center',
      });
    }
  }, [isTransitioning, setIsTransitioning]);

  return (
    <div
      ref={wipeRef}
      className="fixed inset-y-0 left-0 w-full bg-vermillion z-[300] scale-x-0 origin-left pointer-events-none"
    />
  );
};
