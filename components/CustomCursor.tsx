'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useUiStore } from '../store/useUiStore';

export const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const isHoveringArtwork = useUiStore((state) => state.isHoveringArtwork);

  useEffect(() => {
    if (!cursorRef.current) return;
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(cursorRef);
      // Center cursor offset
      gsap.set(cursorRef.current, { xPercent: -50, yPercent: -50 });

      // Move with physics/lag
      const xTo = gsap.quickTo(cursorRef.current, 'x', { duration: 0.15, ease: 'power3' });
      const yTo = gsap.quickTo(cursorRef.current, 'y', { duration: 0.15, ease: 'power3' });

      window.addEventListener('mousemove', (e) => {
        xTo(e.clientX);
        yTo(e.clientY);
      });
    }, cursorRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!cursorRef.current) return;
    if (isHoveringArtwork) {
      // Expands into a delicate Vermillion ring
      gsap.to(cursorRef.current, {
        width: 64,
        height: 64,
        borderWidth: 1,
        backgroundColor: 'transparent',
        duration: 0.3,
        ease: 'power2.out',
      });
    } else {
      // Small Vermillion dot
      gsap.to(cursorRef.current, {
        width: 12,
        height: 12,
        borderWidth: 0,
        backgroundColor: '#E34234',
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }, [isHoveringArtwork]);

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 w-3 h-3 bg-vermillion border-vermillion rounded-full pointer-events-none z-[100]"
    />
  );
};
