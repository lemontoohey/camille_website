'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useUiStore } from '@/store/useUiStore';
import { useHapticSound } from '@/hooks/useHapticSound';

interface Artwork {
  id: string;
  title: string;
  price: string;
  colors: string[];
  dimensions: string;
  medium: string;
  image: string;
  images?: string[];
}

export function ArtworkDetail({ artwork }: { artwork: Artwork }) {
  const router = useRouter();
  const setIsTransitioning = useUiStore((state) => state.setIsTransitioning);
  const { playArtworkAtmosphere, stopArtworkAtmosphere } = useHapticSound();

  useEffect(() => {
    playArtworkAtmosphere(artwork.colors);
    return () => stopArtworkAtmosphere();
  }, [artwork.colors, playArtworkAtmosphere, stopArtworkAtmosphere]);

  const handleBack = () => {
    stopArtworkAtmosphere();
    setIsTransitioning(true);
    router.back();
  };

  const [hasHover, setHasHover] = useState(false);
  useEffect(() => {
    setHasHover(window.matchMedia('(hover: hover)').matches);
  }, []);

  // ── Image list with production basePath prefix ───────────────────────────
  const rawImages = artwork.images && artwork.images.length > 1 ? artwork.images : [artwork.image];
  const allImages = rawImages.map((p) =>
    process.env.NODE_ENV === 'production' && !p.startsWith('http') ? `/camille_website${p}` : p
  );
  const [activeIndex, setActiveIndex] = useState(0);

  // ── Swipe / mouse-drag navigation ────────────────────────────────────────
  const dragStartX = useRef<number | null>(null);
  const MIN_SWIPE = 40;
  const handleDragStart = (clientX: number) => { dragStartX.current = clientX; };
  const handleDragEnd = (clientX: number) => {
    if (dragStartX.current === null || allImages.length < 2) return;
    const delta = clientX - dragStartX.current;
    if (Math.abs(delta) > MIN_SWIPE) {
      setActiveIndex((i) =>
        delta < 0
          ? (i + 1) % allImages.length
          : (i - 1 + allImages.length) % allImages.length
      );
    }
    dragStartX.current = null;
  };

  // ── Varnish sheen (interactive glare) ────────────────────────────────────
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const glareX = useSpring(useTransform(mouseX, [0, 1], ['-100%', '200%']), { damping: 25, stiffness: 150 });
  const glareY = useSpring(useTransform(mouseY, [0, 1], ['-100%', '200%']), { damping: 25, stiffness: 150 });

  // ── 3D tilt on hover (matches Gallery card behaviour) ────────────────────
  const containerRotateX = useSpring(0, { damping: 25, stiffness: 150 });
  const containerRotateY = useSpring(0, { damping: 25, stiffness: 150 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
    if (hasHover) {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      containerRotateX.set(((e.clientY - cy) / (rect.height / 2)) * -3);
      containerRotateY.set(((e.clientX - cx) / (rect.width / 2)) * 3);
    }
  };
  const handleMouseLeave = () => {
    containerRotateX.set(0);
    containerRotateY.set(0);
  };

  // ── Typography stagger (unchanged) ───────────────────────────────────────
  const textContainerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.6 } },
  };
  const textItemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.98, filter: 'blur(8px)' as const },
    show: {
      opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' as const,
      transition: { duration: 1.4, ease: [0.22, 0.61, 0.36, 1] as const },
    },
  };

  return (
    // bg-void removed so the CanvasBackground particles show through (Task 4)
    <div className="min-h-screen w-full px-6 md:px-12 flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-24 overflow-x-hidden pt-[max(6rem,env(safe-area-inset-top))] pb-[max(6rem,env(safe-area-inset-bottom))] md:pt-24 md:pb-24">

      <button
        onClick={handleBack}
        className="fixed top-8 left-6 md:top-12 md:left-12 z-50 text-parchment/50 hover:text-vermillion font-sans text-[10px] tracking-[0.3em] uppercase transition-colors duration-500"
      >
        [ Back to Collection ]
      </button>

      {/* LEFT COLUMN — artwork frame */}
      {/* perspective wrapper enables the 3D tilt (Task 6) */}
      <div className="relative flex items-center justify-center [perspective:2000px]">

        {/* Ambient wall cast — artwork-colour tinted (Task 5) */}
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none mix-blend-screen blur-[40px] md:blur-[60px] will-change-[transform,opacity]"
          style={{ background: `radial-gradient(circle at 50% 50%, ${artwork.colors[0]}30 0%, transparent 60%)` }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Secondary dioxazine-violet wall cast matching gallery purple glow (Task 5) */}
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none mix-blend-screen blur-[80px] md:blur-[100px] will-change-[transform,opacity]"
          style={{ background: 'radial-gradient(circle at 50% 50%, rgba(90,30,120,0.18) 0%, transparent 65%)' }}
          animate={{ scale: [1.05, 1, 1.05], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative w-full flex flex-col gap-4 mt-8 md:mt-0 z-10">
          <motion.div
            layoutId={`artwork-container-${artwork.id}`}
            onMouseMove={hasHover ? handleMouseMove : undefined}
            onMouseLeave={hasHover ? handleMouseLeave : undefined}
            onMouseDown={(e) => handleDragStart(e.clientX)}
            onMouseUp={(e) => handleDragEnd(e.clientX)}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
            onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX)}
            className="relative w-full aspect-[4/5] md:aspect-auto md:h-[80vh] bg-void/50 overflow-hidden [transform-style:preserve-3d] cursor-grab active:cursor-grabbing select-none"
            style={{
              // Matches gallery card outer shadow exactly (Task 5)
              boxShadow: '0 40px 80px -20px rgba(35,15,60,0.8), 0 0 30px 2px rgba(90,30,120,0.2)',
              rotateX: containerRotateX,
              rotateY: containerRotateY,
            }}
          >
            {/* Inset violet-edge-burn vignette matching gallery cards (Task 5) */}
            <div
              className="absolute inset-0 pointer-events-none z-[6]"
              style={{ boxShadow: 'inset 0 0 60px 10px rgba(107, 0, 56, 0.15)' }}
              aria-hidden
            />
            {/* Microscopic noise overlay */}
            <div className="absolute inset-0 z-[5] pointer-events-none opacity-[0.015] bg-noise mix-blend-overlay" aria-hidden />

            <motion.div
              layoutId={`artwork-image-${artwork.id}`}
              className="absolute inset-0 w-full h-full"
            >
              {/* Artwork image — blur-to-sharp on each image mount, keyed so each new image unveils */}
              <motion.div
                key={`imgblur-${activeIndex}`}
                className="absolute inset-0"
                initial={{ filter: 'blur(8px)' }}
                animate={{ filter: 'blur(0px)' }}
                transition={{ duration: 2.0, delay: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
              >
                <Image
                  src={allImages[activeIndex]}
                  alt={artwork.title}
                  fill
                  className="object-cover transition-transform duration-[1200ms] hover:scale-[1.03]"
                  priority
                />
              </motion.div>

              {/* ── Benzi reveal overlays (Task 6) ──────────────────────────
                  Re-keyed on activeIndex so each new image unveils itself,
                  exactly mirroring the scroll-triggered reveal in Gallery.tsx */}
              <motion.div
                key={`bc-${activeIndex}`}
                className="absolute inset-0 bg-[#592512] mix-blend-color z-[3] pointer-events-none will-change-opacity"
                initial={{ opacity: 0.82 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 2.2, delay: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
              />
              <motion.div
                key={`bs-${activeIndex}`}
                className="absolute inset-0 bg-[#3a1707] z-[3] pointer-events-none will-change-opacity"
                initial={{ opacity: 0.82 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 2.2, delay: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
              />
              <motion.div
                key={`bg-${activeIndex}`}
                className="absolute inset-0 bg-[#8b3d2a] mix-blend-color z-[3] pointer-events-none will-change-opacity"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 2.5, delay: 0.15, ease: [0.22, 0.61, 0.36, 1] }}
              />

              {/* Magenta light flash */}
              <motion.div
                key={`mf-${activeIndex}`}
                className="absolute inset-0 bg-magenta mix-blend-screen blur-[60px] pointer-events-none z-[4] will-change-[transform,opacity]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: [0, 0.07, 0], scale: [0.9, 1.1, 1.15] }}
                transition={{ duration: 1.5, delay: 0.35, ease: 'easeOut' }}
              />
              {/* Brown light flash */}
              <motion.div
                key={`bl-${activeIndex}`}
                className="absolute inset-0 bg-[#c85a42] mix-blend-screen blur-[80px] pointer-events-none z-[4] will-change-[transform,opacity]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: [0, 0.28, 0], scale: [0.9, 1.02, 1.03] }}
                transition={{ duration: 2.2, delay: 0.15, ease: 'easeOut' }}
              />

              {/* Varnish sheen — interactive on hover, static centre on touch */}
              <motion.div
                className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay opacity-30 will-change-transform"
                style={{
                  background: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, transparent 50%)',
                  x: glareX,
                  y: glareY,
                  scale: 2,
                }}
              />
            </motion.div>
          </motion.div>

          {/* ── Image navigation — arrows + dots (Tasks 1 & 2) ──────────────
              Dots: dioxazine → light-violet 75% → parchment 75% = #dfd0db  */}
          {allImages.length > 1 && (
            <div className="flex items-center justify-center gap-8 mt-1">
              <button
                onClick={() => setActiveIndex((i) => (i - 1 + allImages.length) % allImages.length)}
                className="text-parchment/40 hover:text-vermillion font-sans text-[9px] tracking-[0.4em] uppercase transition-colors duration-500 min-h-[44px] flex items-center px-2"
                aria-label="Previous image"
              >
                [ ← ]
              </button>
              <div className="flex gap-3 items-center">
                {allImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                      idx === activeIndex
                        ? 'bg-[#dfd0db] scale-125'
                        : 'bg-[#dfd0db]/30 hover:bg-[#dfd0db]/55'
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setActiveIndex((i) => (i + 1) % allImages.length)}
                className="text-parchment/40 hover:text-vermillion font-sans text-[9px] tracking-[0.4em] uppercase transition-colors duration-500 min-h-[44px] flex items-center px-2"
                aria-label="Next image"
              >
                [ → ]
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN — metadata */}
      <motion.div
        variants={textContainerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-8 md:gap-12 py-4 md:py-12 z-10"
      >
        <motion.div variants={textItemVariants} className="flex flex-col gap-4 border-b border-parchment/10 pb-8">
          <h1 className="text-parchment font-serif text-3xl sm:text-4xl md:text-6xl tracking-wide">{artwork.title}</h1>
          <p className="text-vermillion font-sans text-xl tracking-widest">{artwork.price}</p>
        </motion.div>

        <motion.div variants={textItemVariants} className="grid grid-cols-2 gap-8 font-sans text-[10px] tracking-[0.2em] uppercase text-parchment/40">
          <div className="flex flex-col gap-2">
            <span className="text-parchment/20">Medium</span>
            <span>{artwork.medium}</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-parchment/20">Dimensions</span>
            <span>{artwork.dimensions}</span>
          </div>
        </motion.div>

        <motion.div variants={textItemVariants} className="flex flex-col gap-6 text-parchment/70 font-sans font-light leading-relaxed max-w-md italic">
          <p>
            &quot;Every piece in this collection began somewhere else. Aki gave it a second life.&quot;
          </p>
          <p className="text-parchment/30 not-italic">— Aki Funada</p>
        </motion.div>

        <motion.button
          variants={textItemVariants}
          className="self-start mt-8 px-8 py-4 min-h-[48px] border border-vermillion text-vermillion font-sans text-xs tracking-[0.4em] uppercase hover:bg-vermillion hover:text-void transition-all duration-700 relative overflow-hidden group"
        >
          <span className="absolute inset-0 bg-vermillion translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.22,1,0.36,1] -z-10" />
          Enquire About This Piece
        </motion.button>
      </motion.div>
    </div>
  );
}
