'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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

  const allImages = artwork.images && artwork.images.length > 1 ? artwork.images : [artwork.image];
  const [activeIndex, setActiveIndex] = useState(0);

  // --- DEPTH TRICK 2: INTERACTIVE VARNISH SHEEN (hover devices only; touch = static center) ---
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const glareX = useSpring(useTransform(mouseX, [0, 1], ['-100%', '200%']), { damping: 25, stiffness: 150 });
  const glareY = useSpring(useTransform(mouseY, [0, 1], ['-100%', '200%']), { damping: 25, stiffness: 150 });

  // --- DEPTH TRICK 3: LENS-FOCUS TYPOGRAPHY STAGGER ---
  const textContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.6 }
    }
  };

  const textItemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.98, filter: 'blur(8px)' as const },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)' as const,
      transition: { duration: 1.4, ease: [0.22, 0.61, 0.36, 1] as const }
    }
  };

  return (
    <div className="min-h-screen w-full bg-void px-6 md:px-12 flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-24 overflow-x-hidden pt-[max(6rem,env(safe-area-inset-top))] pb-[max(6rem,env(safe-area-inset-bottom))] md:pt-24 md:pb-24">
      <button
        onClick={handleBack}
        className="fixed top-8 left-6 md:top-12 md:left-12 z-50 text-parchment/50 hover:text-vermillion font-sans text-[10px] tracking-[0.3em] uppercase transition-colors duration-500"
      >
        [ Back to Collection ]
      </button>

      {/* LEFT COLUMN - ARTWORK CONTAINER */}
      <div className="relative flex items-center justify-center">

        {/* --- DEPTH TRICK 1: AMBIENT WALL CAST (reduced blur on mobile for GPU perf) --- */}
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none mix-blend-screen blur-[40px] md:blur-[60px] will-change-[transform,opacity]"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${artwork.colors[0]}30 0%, transparent 60%)`,
          }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative w-full flex flex-col gap-4 mt-8 md:mt-0 z-10">
          <motion.div
            layoutId={`artwork-container-${artwork.id}`}
            onMouseMove={hasHover ? handleMouseMove : undefined}
            className="relative w-full aspect-[4/5] md:aspect-auto md:h-[80vh] bg-void/50 overflow-hidden"
            style={{ boxShadow: '0 40px 80px -20px rgba(35,15,60,0.8), 0 0 30px 2px rgba(90,30,120,0.2)' }}
          >
            {/* Microscopic noise overlay to dither Dioxazine shadow banding */}
            <div className="absolute inset-0 z-[5] pointer-events-none opacity-[0.015] bg-noise mix-blend-overlay" aria-hidden />
            <motion.div
              layoutId={`artwork-image-${artwork.id}`}
              className="absolute inset-0 w-full h-full transition-transform duration-[1200ms] hover:scale-[1.02] lux-ease"
            >
              <Image
                src={allImages[activeIndex]}
                alt={artwork.title}
                fill
                className="object-cover"
                priority
              />

              {/* THE VARNISH SHEEN OVERLAY (interactive on hover; static center on touch) */}
              <motion.div
                className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay opacity-30 will-change-transform"
                style={{
                  background: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, transparent 50%)',
                  x: glareX,
                  y: glareY,
                  scale: 2
                }}
              />
            </motion.div>
          </motion.div>

          {/* Multi-image navigation dots — only rendered when artwork has multiple images */}
          {allImages.length > 1 && (
            <div className="flex justify-center gap-3">
              {allImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${idx === activeIndex ? 'bg-parchment/70 scale-125' : 'bg-parchment/20 hover:bg-parchment/40'}`}
                  aria-label={`View image ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN - METADATA */}
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
