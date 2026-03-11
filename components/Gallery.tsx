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
        <div className="relative w-full aspect-[4/5] overflow-hidden bg-void shadow-[0_0_30px_rgba(150,40,20,0.15)] group-hover:shadow-[0_0_45px_rgba(150,40,20,0.35)] transition-shadow duration-700 border border-parchment/5">
          {/* 1. The Actual Image (Starts slightly scaled up) */}
          <Image
            src={artwork.imagePath || '/placeholders/artwork-1.jpg'}
            alt={artwork.title}
            fill
            className="artwork-image object-cover scale-110 will-change-transform"
            sizes="(max-width: 768px) 100vw, 70vw"
            priority={index < 2}
          />

          {/* 2. Benzimidazolone Underpainting (The Hot Glow) */}
          <div className="benzi-overlay absolute inset-0 bg-benzi mix-blend-color opacity-100 will-change-opacity" />
          <div className="benzi-solid absolute inset-0 bg-benzi opacity-60 will-change-opacity" />

          {/* 3. Chromatic Curtains (Multiply to create Chromatic Black) */}
          {/* Magenta slides RIGHT */}
          <div className="curtain-magenta absolute inset-0 bg-magenta mix-blend-multiply opacity-95 origin-left will-change-transform z-10" />
          {/* Green slides DOWN */}
          <div className="curtain-pg7 absolute inset-0 bg-pg7 mix-blend-multiply opacity-95 origin-top will-change-transform z-10" />
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
      // 1. Pause WebGL Background when scrolling past gallery
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top bottom',
        end: 'bottom top',
        onEnter: () => setCanvasPaused(false),
        onLeave: () => setCanvasPaused(true),
        onEnterBack: () => setCanvasPaused(false),
        onLeaveBack: () => setCanvasPaused(true),
      });

      // 2. Animate each Chromatic Card
      const cards = gsap.utils.toArray<HTMLElement>('.artwork-card');

      cards.forEach((card) => {
        const curtainM = card.querySelector('.curtain-magenta');
        const curtainG = card.querySelector('.curtain-pg7');
        const benziSolid = card.querySelector('.benzi-solid');
        const benziOverlay = card.querySelector('.benzi-overlay');
        const img = card.querySelector('.artwork-image');
        const meta = card.querySelector('.meta-block');

        // The Scrubbing Timeline (Tied to user scroll)
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            end: 'center 45%',
            scrub: 1.5,
          },
        });

        // Part 1: Pull the curtains away (Magenta Right, Green Down)
        tl.to(curtainM, { xPercent: 100, ease: 'none' }, 0).to(curtainG, { yPercent: 100, ease: 'none' }, 0);

        // Part 2: Fade the solid Benzi block quickly to reveal the image + blend overlay
        tl.to(benziSolid, { opacity: 0, ease: 'power1.inOut' }, 0.2);

        // Part 3: Slowly fade out the Benzi color-blend and scale image down to rest
        tl.to(benziOverlay, { opacity: 0, ease: 'power2.inOut' }, 0.4).to(img, { scale: 1, ease: 'power2.out' }, 0.2);

        // Part 4: Float up the text metadata
        tl.to(meta, { opacity: 1, y: 0, ease: 'power2.out' }, 0.5);
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
