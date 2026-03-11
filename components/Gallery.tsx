'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useUiStore } from '@/store/useUiStore';
import artworksData from '@/src/data/artworks.json';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Strict interface matching our JSON to prevent crashes
interface Artwork {
  id: string;
  title: string;
  price: string;
  imagePath: string;
  dimensions: string;
  medium: string;
}

const ChromaticArtworkCard = ({ artwork, index }: { artwork: Artwork; index: number }) => {
  const cardRef = useRef<HTMLElement>(null);
  const setIsTransitioning = useUiStore((state) => state.setIsTransitioning);

  const getWidthClass = (i: number) => {
    const widths = ['md:max-w-xl', 'md:max-w-3xl', 'md:max-w-2xl', 'md:max-w-4xl'];
    return `w-full ${widths[i % widths.length]}`;
  };

  const getAlignmentClass = (i: number) => {
    const alignments = ['self-start', 'self-center', 'self-end', 'self-center'];
    return alignments[i % alignments.length];
  };

  // Robust path handling
  const imageSrc = artwork.imagePath
    ? process.env.NODE_ENV === 'production' && !artwork.imagePath.startsWith('http')
      ? `/camille_website${artwork.imagePath}`
      : artwork.imagePath
    : process.env.NODE_ENV === 'production'
      ? '/camille_website/placeholders/artwork-1.jpg'
      : '/placeholders/artwork-1.jpg';

  return (
    <article
      ref={cardRef}
      className={`artwork-card relative group flex flex-col gap-8 w-full ${getAlignmentClass(index)} ${getWidthClass(index)}`}
    >
      <Link
        href={`/art/${artwork.id}`}
        onClick={() => setIsTransitioning(true)}
        className="block w-full cursor-pointer"
      >
        <div
          className="card-container relative w-full aspect-[4/5] bg-void border border-parchment/5"
          style={{ boxShadow: '0 0 0px rgba(150,40,20,0)' }}
        >
          {/* 1. THE REVEALED AREA (Starts at 0x0 size via clip-path) */}
          <div
            className="image-wrapper absolute inset-0 overflow-hidden will-change-transform"
            style={{ clipPath: 'inset(0% 100% 100% 0%)' }}
          >
            <Image
              src={imageSrc}
              alt={artwork.title}
              fill
              className="artwork-image object-cover scale-110 will-change-transform"
              sizes="(max-width: 768px) 100vw, 70vw"
              priority={index < 2}
            />
            {/* The Hot Underpainting */}
            <div className="benzi-overlay absolute inset-0 bg-benzi mix-blend-color opacity-100 z-10 pointer-events-none will-change-opacity" />
            <div className="benzi-solid absolute inset-0 bg-benzi opacity-90 z-10 pointer-events-none will-change-opacity" />
          </div>

          {/* 2. THE SCANNERS */}
          {/* Vertical Scanner (Moves Left to Right) */}
          <div className="line-v absolute top-0 bottom-0 left-0 w-[2px] z-20 pointer-events-none translate-x-[-50%]">
            <div className="line-v-magenta absolute inset-0 bg-magenta will-change-transform" />
            {/* Green on top at 80% opacity mixes with Magenta underneath to create dark chromatic grey */}
            <div className="line-v-green absolute inset-0 bg-pg7 opacity-80" />
          </div>

          {/* Horizontal Scanner (Moves Top to Bottom) */}
          <div className="line-h absolute left-0 right-0 top-0 h-[2px] z-20 pointer-events-none translate-y-[-50%]">
            <div className="line-h-magenta absolute inset-0 bg-magenta will-change-transform" />
            <div className="line-h-green absolute inset-0 bg-pg7 opacity-80" />
          </div>
        </div>
      </Link>

      {/* METADATA */}
      <div className="meta-block flex flex-col gap-3 px-2 sm:px-0 opacity-0 translate-y-8 will-change-transform">
        <div className="flex flex-row justify-between items-baseline gap-8">
          <h2 className="text-parchment font-serif text-base md:text-xl leading-tight tracking-wide group-hover:text-benzi transition-colors duration-500">
            {artwork.title}
          </h2>

          <div className="relative overflow-hidden">
            <div className="relative">
              <span className="block text-parchment/70 font-sans tracking-[0.1em] text-sm font-light transition-all duration-500 group-hover:opacity-0 group-hover:-translate-y-full">
                {artwork.price}
              </span>
              <span className="absolute inset-0 block text-benzi font-sans tracking-[0.1em] text-sm font-light translate-y-full opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                Acquire
              </span>
            </div>
            <div className="absolute left-0 top-1/2 w-full h-[1px] bg-benzi scale-x-0 origin-left transition-transform duration-500 ease-in-out group-hover:scale-x-100" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-parchment/40 font-sans text-xs font-light tracking-wider uppercase">{artwork.medium}</p>
          <p className="text-parchment/40 font-sans text-xs font-light tracking-wider">{artwork.dimensions}</p>
        </div>
      </div>
    </article>
  );
};

export const Gallery = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const setCanvasPaused = useUiStore((state) => state.setCanvasPaused);

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top bottom',
        end: 'bottom top',
        onEnter: () => setCanvasPaused(false),
        onLeave: () => setCanvasPaused(true),
        onEnterBack: () => setCanvasPaused(false),
        onLeaveBack: () => setCanvasPaused(true),
      });

      const cards = gsap.utils.toArray<HTMLElement>('.artwork-card');

      cards.forEach((card) => {
        const container = card.querySelector('.card-container');
        const imageWrapper = card.querySelector('.image-wrapper');
        const lineV = card.querySelector('.line-v');
        const lineH = card.querySelector('.line-h');
        const lineVMagenta = card.querySelector('.line-v-magenta');
        const lineHMagenta = card.querySelector('.line-h-magenta');
        const benziSolid = card.querySelector('.benzi-solid');
        const benziOverlay = card.querySelector('.benzi-overlay');
        const img = card.querySelector('.artwork-image');
        const meta = card.querySelector('.meta-block');

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            end: 'center 30%',
            scrub: 1.5,
          },
        });

        // Master timing runs from 0 to 100 for perfect synchronization

        // 1. The Scan & Reveal: Clip path opens exactly with the moving lines
        tl.to(imageWrapper, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', duration: 100 }, 0);
        tl.to(lineV, { left: '100%', ease: 'none', duration: 100 }, 0);
        tl.to(lineH, { top: '100%', ease: 'none', duration: 100 }, 0);

        // 2. The Chromatic Aberration: Magenta pops out midway, then fuses back
        tl.to(lineVMagenta, { x: -4, ease: 'sine.inOut', duration: 30 }, 20);
        tl.to(lineVMagenta, { x: 0, ease: 'sine.inOut', duration: 30 }, 50);

        tl.to(lineHMagenta, { y: -4, ease: 'sine.inOut', duration: 30 }, 20);
        tl.to(lineHMagenta, { y: 0, ease: 'sine.inOut', duration: 30 }, 50);

        // 3. The Alchemy: Brown dissolves to real image, transfers glow to outside
        tl.to([benziSolid, benziOverlay], { opacity: 0, ease: 'power2.inOut', duration: 40 }, 40);
        tl.to(container, { boxShadow: '0 0 45px 5px rgba(150,40,20,0.35)', ease: 'power2.inOut', duration: 40 }, 40);

        // 4. Image Settles & Metadata Appears
        tl.to(img, { scale: 1, ease: 'power2.out', duration: 40 }, 60);
        tl.to(meta, { opacity: 1, y: 0, ease: 'power2.out', duration: 30 }, 70);

        // 5. Lines fade out at the very end so they don't sit on the edge
        tl.to([lineV, lineH], { opacity: 0, ease: 'power1.out', duration: 5 }, 95);
      });
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} className="relative w-full max-w-7xl mx-auto px-6 sm:px-12 py-32 z-10 flex flex-col items-center">
      <header className="fixed top-1/3 left-4 md:left-8 z-50 pointer-events-none hidden md:block">
        <h1 className="font-sans text-[10px] text-parchment tracking-[0.5em] uppercase opacity-40 [writing-mode:vertical-rl] rotate-180">
          Selected Works
        </h1>
      </header>

      <header className="md:hidden w-full text-left mb-16 px-2">
        <h1 className="font-sans text-[10px] text-parchment tracking-[0.5em] uppercase opacity-40">
          Selected Works
        </h1>
      </header>

      <div className="flex flex-col gap-y-48 md:gap-y-96 items-start w-full pb-48 mt-12">
        {(artworksData as Artwork[]).map((artwork, idx) => (
          <ChromaticArtworkCard key={artwork.id} artwork={artwork} index={idx} />
        ))}
      </div>
    </section>
  );
};
