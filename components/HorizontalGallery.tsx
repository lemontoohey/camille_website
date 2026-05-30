'use client';

import { useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { GalleryArrows } from './GalleryArrows';
import ClothWave from './ClothWave';

interface HorizontalGalleryProps {
  panels: ReactNode[];
  panelImages?: string[];
  onVelocity?: (velocity: number) => void;
  onPanelChange?: (index: number) => void;
}

export function HorizontalGallery({
  panels,
  panelImages = [],
  onVelocity,
  onPanelChange,
}: HorizontalGalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const currentOffsetRef = useRef(0);
  const targetOffsetRef = useRef(0);
  const rafRef = useRef<number>(0);
  const touchStartXRef = useRef<number | null>(null);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const clothWaveRef = useRef<{ trigger: (dir: 'left' | 'right') => void }>(null);
  const totalPanels = panels.length;

  const getMaxOffset = useCallback((): number => {
    if (typeof window === 'undefined') return 0;
    return Math.max(0, (totalPanels - 1) * window.innerWidth);
  }, [totalPanels]);

  const goToPanel = useCallback(
    (index: number) => {
      if (typeof window === 'undefined') return;
      const clamped = Math.max(0, Math.min(index, totalPanels - 1));
      const direction = clamped > currentIndex ? 'right' : 'left';
      setIsTransitioning(true);
      clothWaveRef.current?.trigger(direction);
      setTimeout(() => setIsTransitioning(false), 400);
      targetOffsetRef.current = clamped * window.innerWidth;
    },
    [totalPanels, currentIndex]
  );

  // Notify parent when panel index changes
  useEffect(() => {
    if (onPanelChange) onPanelChange(currentIndex);
  }, [currentIndex, onPanelChange]);

  // rAF lerp loop
  useEffect(() => {
    const tick = () => {
      const prev = currentOffsetRef.current;
      currentOffsetRef.current +=
        (targetOffsetRef.current - currentOffsetRef.current) * 0.08;

      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${-currentOffsetRef.current}px)`;
      }

      const velocity = currentOffsetRef.current - prev;
      if (onVelocity) onVelocity(velocity);

      const ww = typeof window !== 'undefined' ? Math.max(1, window.innerWidth) : 1;
      const idx = Math.round(currentOffsetRef.current / ww);
      setCurrentIndex((p) => (p !== idx ? idx : p));

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [onVelocity]);

  // Wheel event — passive: false so we can preventDefault
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetOffsetRef.current = Math.max(
        0,
        Math.min(targetOffsetRef.current + e.deltaY + e.deltaX, getMaxOffset())
      );
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [getMaxOffset]);

  // Touch handlers — accumulate delta from touchmove
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartXRef.current = e.touches[0].clientX;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartXRef.current === null) return;
      const delta = touchStartXRef.current - e.touches[0].clientX;
      touchStartXRef.current = e.touches[0].clientX;
      targetOffsetRef.current = Math.max(
        0,
        Math.min(targetOffsetRef.current + delta, getMaxOffset())
      );
    };
    const handleTouchEnd = () => {
      touchStartXRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [getMaxOffset]);

  // Keyboard navigation — snap to nearest panel boundary
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ww = typeof window !== 'undefined' ? Math.max(1, window.innerWidth) : 1;
      const currentTargetPanel = Math.round(targetOffsetRef.current / ww);
      if (e.key === 'ArrowRight') goToPanel(currentTargetPanel + 1);
      else if (e.key === 'ArrowLeft') goToPanel(currentTargetPanel - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPanel]);

  // Body scroll lock while mounted
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Debounced resize handler — recalculate maxOffset and re-clamp
  useEffect(() => {
    const handleResize = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        const newMax = getMaxOffset();
        targetOffsetRef.current = Math.min(targetOffsetRef.current, newMax);
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, [getMaxOffset]);

  // Adjacent image preload via <link rel="preload">
  useEffect(() => {
    if (!panelImages.length) return;
    const toPreload = [
      panelImages[currentIndex - 1],
      panelImages[currentIndex + 1],
    ].filter((s): s is string => Boolean(s));

    toPreload.forEach((src) => {
      if (document.querySelector(`link[rel="preload"][href="${src}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }, [currentIndex, panelImages]);

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <ClothWave ref={clothWaveRef} />
      <div
        ref={trackRef}
        data-wave-active={isTransitioning}
        style={{
          display: 'flex',
          width: 'fit-content',
          height: '100vh',
          willChange: 'transform',
          filter: isTransitioning ? 'url(#cloth-wave-filter)' : 'none',
        }}
      >
        {panels.map((panel, i) => (
          <div
            key={i}
            style={{
              flex: '0 0 100vw',
              height: '100vh',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {panel}
          </div>
        ))}
      </div>

      <GalleryArrows
        currentPanel={currentIndex}
        totalPanels={totalPanels}
        onPrev={() => goToPanel(currentIndex - 1)}
        onNext={() => goToPanel(currentIndex + 1)}
        onGoTo={goToPanel}
      />
    </div>
  );
}
