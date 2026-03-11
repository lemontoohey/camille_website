'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useUiStore } from '../store/useUiStore';
import artworksData from '../src/data/artworks.json';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Ensure the ID type matches the JSON
interface Artwork {
  id: string;
  title: string;
  price: string;
  colors: string[];
  dimensions: string;
  medium: string;
}

/**
 * Single Artwork Card
 * - Fluid hover states
 * - Mapped dynamically from JSON
 * - Uncropped Museum aesthetic
 * - Shared layout ID for seamless expansion
 */
const ArtworkCard = ({ artwork, index }: { artwork: Artwork; index: number }) => {
  const setIsTransitioning = useUiStore((state) => state.setIsTransitioning);

  // Asymmetrical horizontal alignments
  const getAlignmentClass = (i: number) => {
    const alignments = ['self-start', 'self-center', 'self-end', 'self-center'];
    return alignments[i % alignments.length];
  };

  // Variable maximum widths for true unconstrained scaling
  const getWidthClass = (i: number) => {
    const widths = ['max-w-xl', 'max-w-3xl', 'max-w-2xl', 'max-w-4xl'];
    return widths[i % widths.length];
  };

  const handleLinkClick = () => {
    setIsTransitioning(true);
  };

  return (
    <article 
      className={`artwork-card relative group flex flex-col gap-10 w-full ${getAlignmentClass(index)} ${getWidthClass(index)}`}
    >
      {/* 
        Container overflow-hidden maintains bounds while inner image scales.
        Using framer-motion for the reveal instead of heavy GSAP clip-paths.
      */}
      <Link href={`/art/${artwork.id}`} onClick={handleLinkClick} className="block w-full">
        <motion.div 
          layoutId={`artwork-container-${artwork.id}`}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: (index % 3) * 0.1 }}
          className="relative w-full aspect-[4/5] overflow-hidden bg-void/50 rounded-[1px] shadow-2xl shadow-black/80 border border-parchment/10 cursor-pointer"
        >
          <motion.div 
            layoutId={`artwork-image-${artwork.id}`} 
            className="absolute inset-0 w-full h-full transition-transform duration-[1200ms] lux-ease group-hover:scale-[1.03] will-change-transform"
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
          
          {/* Vermillion "View Details" - gracefully fades in */}
          <div className="absolute inset-0 bg-void/40 opacity-0 group-hover:opacity-100 transition-opacity duration-[700ms] lux-ease flex items-center justify-center pointer-events-none">
            <span className="text-vermillion font-sans text-xs tracking-[0.2em] uppercase">
              View Details
            </span>
          </div>
        </motion.div>
      </Link>

      {/* Metadata Section with strict museum hierarchy and Vermillion Thread CTA */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 1.2, delay: ((index % 3) * 0.1) + 0.4 }}
        className="flex flex-col gap-3 px-2 mt-4 cursor-pointer group/meta"
      >
        <div className="flex flex-row justify-between items-baseline gap-8">
          <h2 className="text-parchment font-serif text-lg leading-tight tracking-wide group-hover/meta:text-vermillion transition-colors duration-500">
            {artwork.title}
          </h2>
          
          {/* Vermillion Thread: Price strike-through to "Acquire" */}
          <div className="relative overflow-hidden">
            <div className="relative">
              <span className="block text-parchment font-sans tracking-[0.1em] text-sm font-light transition-all duration-500 group-hover/meta:opacity-0 group-hover/meta:-translate-y-full">
                {artwork.price}
              </span>
              <span className="absolute inset-0 block text-vermillion font-sans tracking-[0.1em] text-sm font-light translate-y-full opacity-0 transition-all duration-500 group-hover/meta:translate-y-0 group-hover/meta:opacity-100">
                Acquire
              </span>
            </div>
            {/* The actual "thread" line */}
            <div className="absolute left-0 top-1/2 w-full h-[1px] bg-vermillion scale-x-0 origin-left transition-transform duration-500 ease-in-out group-hover/meta:scale-x-100" />
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <p className="text-parchment/50 font-sans text-xs font-light tracking-wider uppercase">{artwork.medium}</p>
          <p className="text-parchment/50 font-sans text-xs font-light tracking-wider">{artwork.dimensions}</p>
        </div>
      </motion.div>
    </article>
  );
};

/**
 * Gallery Masonry Grid
 */
export const Gallery = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const setCanvasPaused = useUiStore((state) => state.setCanvasPaused);

  useGSAP(() => {
    // GPU Rule 2: Pause the background shader entirely if we scroll far past the gallery
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => setCanvasPaused(false),
      onLeave: () => setCanvasPaused(true),
      onEnterBack: () => setCanvasPaused(false),
      onLeaveBack: () => setCanvasPaused(true),
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative w-full max-w-7xl mx-auto px-6 sm:px-12 py-32 z-10 flex flex-col items-center">
      {/* Museum Catalog Number Style Header */}
      <header className="fixed top-32 left-8 z-50 pointer-events-none hidden md:block mix-blend-difference">
        <h1 className="font-sans text-[10px] text-parchment tracking-[0.5em] uppercase opacity-50 transform -rotate-90 origin-top-left">
          Selected Works
        </h1>
      </header>

      {/* Mobile-only header variant */}
      <header className="md:hidden w-full text-left mb-24 px-4">
        <h1 className="font-sans text-[10px] text-parchment tracking-[0.5em] uppercase opacity-50">
          Selected Works
        </h1>
      </header>

      {/* Single column stacked masonry with massive vertical spacing for art-first pacing */}
      <div className="flex flex-col gap-y-96 items-start w-full pb-48">
        {(artworksData as Artwork[]).map((artwork, idx) => (
          <ArtworkCard key={artwork.id} artwork={artwork} index={idx} />
        ))}
      </div>
    </section>
  );
};
