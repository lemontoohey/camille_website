'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export const GlintCursor = () => {
  const glintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!glintRef.current) return;

    const xTo = gsap.quickTo(glintRef.current, 'x', { duration: 0.8, ease: 'power3' });
    const yTo = gsap.quickTo(glintRef.current, 'y', { duration: 0.8, ease: 'power3' });

    const handleMouseMove = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Set initial position out of view
    gsap.set(glintRef.current, { xPercent: -50, yPercent: -50 });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={glintRef}
      className="fixed top-0 left-0 w-[60vmax] h-[60vmax] pointer-events-none z-[5] rounded-full"
      style={{
        background: 'radial-gradient(circle at center, rgba(253, 245, 230, 0.045), transparent 35%)',
      }}
    />
  );
};
