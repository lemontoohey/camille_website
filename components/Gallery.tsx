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
 * - Hover intent
 * - Fluid hover states (scale-105 without breaking layout)
 * - Custom Vermillion cursor trigger
 * - Mapped dynamically from JSON
 */
const ArtworkCard = ({ artwork, index }: { artwork: Artwork; index: number }) => {
  const setHoveringArtwork = useUiStore((state) => state.setHoveringArtwork);

  // Handle Custom Hover Interactions for Custom Cursor
  const handleMouseEnter = () => setHoveringArtwork(true);
  const handleMouseLeave = () => setHoveringArtwork(false);

  // Determine an asymmetrical aspect ratio pattern strictly via CSS classes.
  // We'll rotate between portrait, landscape, and square based on index to create a staggered feel.
  const getAspectClass = (i: number) => {
    const sequence = [
      'aspect-[3/4] col-span-1 md:col-span-1', 
      'aspect-[4/3] col-span-1 md:col-span-2',
      'aspect-square col-span-1 md:col-span-1',
      'aspect-[3/5] col-span-1 md:col-span-1',
      'aspect-video col-span-1 md:col-span-2'
    ];
    return sequence[i % sequence.length];
  };

  return (
    <article 
      className={`artwork-card relative group flex flex-col gap-6 cursor-none w-full ${getAspectClass(index)}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 
        Container overflow-hidden maintains bounds while inner image scales. 
        Will-change transforms ensure smooth hover transitions without repaints.
      */}
      <div className="relative w-full h-full overflow-hidden bg-void/50 rounded-sm shadow-2xl shadow-black/40">
        <Image
          src={artwork.imagePath}
          alt={artwork.title}
          fill
          className="object-cover transition-transform duration-[700ms] lux-ease group-hover:scale-105 will-change-transform"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Vermillion "View Details" - gracefully fades in */}
        <div className="absolute inset-0 bg-void/30 opacity-0 group-hover:opacity-100 transition-opacity duration-[700ms] lux-ease flex items-center justify-center pointer-events-none">
          <span className="text-vermillion font-sans text-sm tracking-widest uppercase">
            View Details
          </span>
        </div>
      </div>

      {/* Metadata Section with elegant typography */}
      <div className="flex flex-col gap-2 px-1">
        <div className="flex flex-row justify-between items-baseline gap-4">
          <h2 className="text-parchment font-serif text-lg leading-tight">{artwork.title}</h2>
          <p className="text-parchment font-sans tracking-widest text-sm font-light shrink-0">{artwork.price}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-parchment/70 font-sans text-sm font-light tracking-wide">{artwork.medium}</p>
          <p className="text-parchment/70 font-sans text-sm font-light tracking-wide">{artwork.dimensions}</p>
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
    <section ref={containerRef} className="relative w-full max-w-7xl mx-auto px-6 sm:px-12 py-32 z-10">
      <header className="mb-32 flex flex-col gap-6 items-center text-center">
        <h1 className="font-serif text-5xl md:text-7xl text-parchment drop-shadow-md">Selected Works</h1>
        <p className="font-sans text-parchment/70 max-w-md font-light leading-relaxed">
          An exploration of color, depth, and the emotional resonance of the void.
        </p>
      </header>

      {/* Asymmetrical Masonry Grid - Generous gaps & dynamic span columns */}
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-32 auto-rows-auto items-end"
      >
        {(artworksData as Artwork[]).map((artwork, idx) => (
          <ArtworkCard key={artwork.id} artwork={artwork} index={idx} />
        ))}
      </div>
    </section>
  );
};
