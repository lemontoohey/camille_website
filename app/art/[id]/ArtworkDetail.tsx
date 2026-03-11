'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUiStore } from '@/store/useUiStore';
import { useHapticSound } from '@/hooks/useHapticSound';

interface Artwork {
  id: string;
  title: string;
  price: string;
  colors: string[];
  dimensions: string;
  medium: string;
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

  return (
    <div className="min-h-screen w-full bg-void pt-24 pb-24 px-6 md:px-12 flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-24 overflow-x-hidden">
      <button 
        onClick={handleBack}
        className="fixed top-8 left-6 md:top-12 md:left-12 z-50 text-parchment/50 hover:text-vermillion font-sans text-[10px] tracking-[0.3em] uppercase transition-colors duration-500"
      >
        [ Back to Collection ]
      </button>

      <motion.div 
        layoutId={`artwork-container-${artwork.id}`}
        className="relative w-full aspect-[4/5] md:aspect-auto md:h-[80vh] border border-parchment/10 bg-void/50 shadow-2xl shadow-black overflow-hidden mt-8 md:mt-0"
      >
        <motion.div 
          layoutId={`artwork-image-${artwork.id}`} 
          className="absolute inset-0 w-full h-full transition-transform duration-[1200ms] hover:scale-[1.02] lux-ease"
        >
          {artwork.colors.map((color, idx) => (
            <div
              key={idx}
              className="absolute shadow-[0_0_40px_rgba(0,0,0,0.8)] mix-blend-screen"
              style={{
                backgroundColor: color,
                inset: `${idx * 15}%`,
                opacity: 0.9,
                mixBlendMode: idx > 0 ? 'overlay' : 'normal'
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 1.2, ease: [0.22, 0.61, 0.36, 1] }}
        className="flex flex-col gap-8 md:gap-12 py-4 md:py-12"
      >
        <div className="flex flex-col gap-4 border-b border-parchment/10 pb-8">
          <h1 className="text-parchment font-serif text-3xl sm:text-4xl md:text-6xl tracking-wide">{artwork.title}</h1>
          <p className="text-vermillion font-sans text-xl tracking-widest">{artwork.price}</p>
        </div>

        <div className="grid grid-cols-2 gap-8 font-sans text-[10px] tracking-[0.2em] uppercase text-parchment/40">
          <div className="flex flex-col gap-2">
            <span className="text-parchment/20">Medium</span>
            <span>{artwork.medium}</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-parchment/20">Dimensions</span>
            <span>{artwork.dimensions}</span>
          </div>
        </div>

        <div className="flex flex-col gap-6 text-parchment/70 font-sans font-light leading-relaxed max-w-md italic">
          <p>
            &quot;This piece explores the liminal space between masstone and transparency. 
            The intentional application of Dioxazine Violet creates a structural void 
            where light doesn&apos;t just bounce, but seems to be absorbed into the fiber.&quot;
          </p>
          <p className="text-parchment/30 not-italic">— Camille Wiseman, Artist Notes</p>
        </div>

        <button className="self-start mt-8 px-8 py-4 min-h-[48px] border border-vermillion text-vermillion font-sans text-xs tracking-[0.4em] uppercase hover:bg-vermillion hover:text-void transition-all duration-700">
          Inquire for Acquisition
        </button>
      </motion.div>
    </div>
  );
}
