'use client';

import { memo, useRef } from 'react';
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

interface Artwork {
  id: string;
  title: string;
  price: string;
  imagePath: string;
  dimensions: string;
  medium: string;
}

/* Soft edge mask: fades bottom 25% so layers blend during stagger (no hard lines) */
const REVEAL_EDGE_MASK = 'linear-gradient(to bottom, black 75%, transparent 100%)';

const PureArtworkCard = memo(({ artwork, index }: { artwork: Artwork; index: number }) => {
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
          className="card-container relative w-full aspect-[4/5] bg-void"
          style={{
            boxShadow: '0 40px 80px -20px rgba(10,5,25,1), 0 0 20px 2px rgba(150,40,20,0.15)',
          }}
        >
          <div className="image-wrapper absolute inset-0 overflow-hidden will-change-transform">
            <Image
              src={imageSrc}
              alt={artwork.title}
              fill
              className="artwork-image object-cover scale-110 will-change-transform"
              sizes="(max-width: 768px) 100vw, 70vw"
              priority={index < 2}
            />

            {/* 1. Base Glow (The Warm Pink/Brown Hum) */}
            <div
              className="reveal-glow absolute inset-0 z-10 pointer-events-none will-change-opacity blur-2xl"
              style={{
                background: '#c85a42',
                mixBlendMode: 'screen',
                opacity: 0,
              }}
            />

            {/* 2. Earth Brown Underlayer — soft edge for depth */}
            <div
              className="reveal-earth absolute inset-0 z-20 pointer-events-none will-change-transform origin-top"
              style={{
                background: '#3e1f0e',
                opacity: 0.9,
                WebkitMaskImage: REVEAL_EDGE_MASK,
                maskImage: REVEAL_EDGE_MASK,
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
              }}
            />

            {/* 3. Synthetic Magenta Midlayer — soft edge for depth */}
            <div
              className="reveal-magenta absolute inset-0 z-30 pointer-events-none will-change-transform origin-top bg-magenta"
              style={{
                mixBlendMode: 'multiply',
                opacity: 0.6,
                WebkitMaskImage: REVEAL_EDGE_MASK,
                maskImage: REVEAL_EDGE_MASK,
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
              }}
            />

            {/* 4. Top Benzi Overlay — soft edge for depth */}
            <div
              className="reveal-benzi absolute inset-0 z-40 pointer-events-none will-change-transform origin-top bg-benzi"
              style={{
                opacity: 1,
                WebkitMaskImage: REVEAL_EDGE_MASK,
                maskImage: REVEAL_EDGE_MASK,
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
              }}
            />
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
});

PureArtworkCard.displayName = 'PureArtworkCard';

export const Gallery = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const setCanvasPaused = useUiStore((state) => state.setCanvasPaused);
  const scrollVelocity = useUiStore((state) => state.scrollVelocity);
  const isScrolling = Math.abs(scrollVelocity) > 2;

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
        const glow = card.querySelector('.reveal-glow');
        const earth = card.querySelector('.reveal-earth');
        const magenta = card.querySelector('.reveal-magenta');
        const benzi = card.querySelector('.reveal-benzi');
        const img = card.querySelector<HTMLElement>('.artwork-image');
        const meta = card.querySelector('.meta-block');

        // Robust null checks so NextJS hot-reloading doesn't choke GSAP
        if (!glow || !earth || !magenta || !benzi || !img || !meta) return;

        gsap.set([earth, magenta, benzi], { yPercent: 0 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            end: 'center 45%',
            scrub: 1.2,
          },
        });

        // 1. The Hum: Glow swells up then fades out as the image reveals
        tl.to(glow, { opacity: 0.8, ease: 'power1.inOut', duration: 0.3 }, 0).to(
          glow,
          { opacity: 0, ease: 'power2.out', duration: 0.7 },
          0.3
        );

        // 2. The Peel: Staggered wipe upwards — edges blended via mask-image, overlap for depth
        tl.to(benzi, { yPercent: -101, ease: 'power3.inOut', duration: 1.2 }, 0)
          .to(magenta, { yPercent: -101, ease: 'power3.inOut', duration: 1.2 }, 0.1)
          .to(earth, { yPercent: -101, ease: 'power3.inOut', duration: 1.2 }, 0.2);

        // 3. The Settle: Image drops back from scale 1.1 down to 1
        tl.to(img, { scale: 1, ease: 'power2.out', duration: 1.2 }, 0.2);

        // 4. Metadata Fade Up
        tl.to(meta, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.8 }, 0.4);

        if (container && img) {
          card.addEventListener('mouseenter', () => {
            gsap.to(container, {
              boxShadow: '0 40px 80px -20px rgba(10,5,25,1), 0 0 50px 8px rgba(150,40,20,0.5)',
              duration: 0.8,
              ease: 'power2.out',
            });
            gsap.to(img, { scale: 1.03, duration: 1.2, ease: 'power2.out' });
          });

          card.addEventListener('mouseleave', () => {
            gsap.to(container, {
              boxShadow: '0 40px 80px -20px rgba(10,5,25,1), 0 0 20px 2px rgba(150,40,20,0.15)',
              duration: 0.8,
              ease: 'power2.out',
            });
            gsap.to(img, { scale: 1, duration: 1.2, ease: 'power2.out' });
          });
        }
      });
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} className="relative w-full max-w-7xl mx-auto px-6 sm:px-12 py-32 z-10 flex flex-col items-center">
      <header
        className={`fixed top-1/3 left-4 md:left-8 z-50 transition-opacity duration-700 hidden md:block ${isScrolling ? 'opacity-0' : 'opacity-100 pointer-events-none'}`}
      >
        <h1 className="font-sans text-[10px] text-parchment tracking-[0.5em] uppercase opacity-40 [writing-mode:vertical-rl] rotate-180">
          Selected Works
        </h1>
      </header>

      <header
        className={`md:hidden w-full text-left mb-16 px-2 transition-opacity duration-700 ${isScrolling ? 'opacity-0' : 'opacity-100'}`}
      >
        <h1 className="font-sans text-[10px] text-parchment tracking-[0.5em] uppercase opacity-40">
          Selected Works
        </h1>
      </header>

      <div className="flex flex-col gap-y-48 md:gap-y-96 items-start w-full pb-48 mt-12">
        {(artworksData as Artwork[]).map((artwork, idx) => (
          <PureArtworkCard key={artwork.id} artwork={artwork} index={idx} />
        ))}
      </div>
    </section>
  );
};
