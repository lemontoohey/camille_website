'use client';

import { useRef } from 'react';
import Image from 'next/image';
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
  imagePath: string;
  dimensions: string;
  medium: string;
}

/**
 * Single Artwork Card
 * - Fluid hover states
 * - Mapped dynamically from JSON
 * - Uncropped Museum aesthetic
 */
const ArtworkCard = ({ artwork, index }: { artwork: Artwork; index: number }) => {

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

  return (
    <article 
      className={`artwork-card relative group flex flex-col gap-10 w-full ${getAlignmentClass(index)} ${getWidthClass(index)}`}
    >
      {/* 
        Container overflow-hidden maintains bounds while inner image scales.
        Added the "Museum Glass" 1px border frame.
      */}
      <div className="relative w-full overflow-hidden bg-void/50 rounded-[1px] shadow-2xl shadow-black/80 border border-parchment/10">
        <Image
          src={artwork.imagePath}
          alt={artwork.title}
          width={1600}
          height={1600}
          className="w-full h-auto object-contain transition-transform duration-[1200ms] lux-ease group-hover:scale-[1.03] will-change-transform"
          sizes="(max-width: 768px) 100vw, 80vw"
        />
        
        {/* Vermillion "View Details" - gracefully fades in */}
        <div className="absolute inset-0 bg-void/40 opacity-0 group-hover:opacity-100 transition-opacity duration-[700ms] lux-ease flex items-center justify-center pointer-events-none">
          <span className="text-vermillion font-sans text-xs tracking-[0.2em] uppercase">
            View Details
          </span>
        </div>
      </div>

      {/* Metadata Section with strict museum hierarchy */}
      <div className="flex flex-col gap-3 px-2 mt-4">
        <div className="flex flex-row justify-between items-baseline gap-8">
          <h2 className="text-parchment font-serif text-lg leading-tight tracking-wide">{artwork.title}</h2>
          <p className="text-parchment font-sans tracking-[0.1em] text-sm font-light shrink-0">{artwork.price}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-parchment/50 font-sans text-xs font-light tracking-wider uppercase">{artwork.medium}</p>
          <p className="text-parchment/50 font-sans text-xs font-light tracking-wider">{artwork.dimensions}</p>
        </div>
      </div>
    </article>
  );
};

/**
 * Gallery Masonry Grid
 * Animates artworks in gracefully strictly via Transform and Opacity.
 */
export const Gallery = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const setCanvasPaused = useUiStore((state) => state.setCanvasPaused);

  // useGSAP is perfect for React: handles cleanup automatically
  useGSAP(() => {
    const cards = gsap.utils.toArray('.artwork-card');

    // Setup initial state strictly with GPU-accelerated properties
    gsap.set(cards, { y: 50, opacity: 0 });

    cards.forEach((card: any, i) => {
      ScrollTrigger.create({
        trigger: card,
        start: 'top 85%',
        animation: gsap.to(card, {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: 'power3.out',
          // Slight stagger based on row rendering
          delay: (i % 3) * 0.1, 
        }),
        // Ensure animation triggers once and isn't locked to scroll position scrub
        scrub: false,
        once: true,
      });
    });

    // GPU Rule 2: Pause the background shader entirely if we scroll far past the gallery
    // using IntersectionObserver. We can use ScrollTrigger for this too:
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
    <section ref={containerRef} className="relative w-full max-w-7xl mx-auto px-6 sm:px-12 py-20 z-10">
      <header className="mb-48 flex flex-col gap-8 items-center text-center mt-12">
        <h1 className="font-sans text-xs md:text-sm text-parchment tracking-[0.3em] uppercase opacity-70 drop-shadow-md">
          Selected Works
        </h1>
      </header>

      {/* Single column stacked masonry with massive vertical spacing for art-first pacing */}
      <div className="flex flex-col gap-y-64 items-start w-full pb-32">
        {(artworksData as Artwork[]).map((artwork, idx) => (
          <ArtworkCard key={artwork.id} artwork={artwork} index={idx} />
        ))}
      </div>
    </section>
  );
};
