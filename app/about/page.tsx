'use client';

import { useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // 1. Living Portrait Parallax
    const rectangles = gsap.utils.toArray('.mask-rect');
    
    rectangles.forEach((rect: any, i) => {
      gsap.to(rect, {
        scrollTrigger: {
          trigger: portraitRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
        y: (i + 1) * 40, // Different parallax speeds
        ease: 'none'
      });
    });

    // 2. Pull Quotes Stagger
    const quotes = gsap.utils.toArray('.artist-quote');
    
    quotes.forEach((quote: any) => {
      gsap.fromTo(quote, 
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1.5,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: quote,
            start: 'top 85%',
            once: true
          }
        }
      );
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="min-h-screen bg-void pt-48 pb-64 px-6 md:px-12 flex flex-col items-center">
      {/* The Living Portrait Section */}
      <div ref={portraitRef} className="relative w-full max-w-lg aspect-[3/4] mb-48">
        {/* Parallax Vertical Rectangles (Obscuring/Framing) */}
        <div className="mask-rect absolute -left-8 top-0 w-16 h-full bg-void z-20" />
        <div className="mask-rect absolute left-1/4 -top-12 w-2 h-[120%] bg-parchment/5 z-20" />
        <div className="mask-rect absolute right-8 bottom-0 w-24 h-64 bg-void z-20" />
        <div className="mask-rect absolute -right-4 top-1/2 w-1 h-32 bg-vermillion/20 z-20" />

        <div className="relative w-full h-full overflow-hidden grayscale contrast-[1.1] shadow-2xl shadow-black">
          <Image
            src="/placeholders/camille-portrait.jpg"
            alt="Camille Wiseman"
            fill
            className="object-cover scale-110"
            priority
          />
        </div>
      </div>

      {/* Artist Statement & Pull Quotes */}
      <div className="flex flex-col gap-48 w-full max-w-4xl">
        <blockquote className="artist-quote flex flex-col gap-8 items-start">
          <span className="text-vermillion font-sans text-[10px] tracking-[0.4em] uppercase">01 / Intent</span>
          <p className="text-parchment font-serif text-3xl md:text-5xl leading-tight">
            "My work is not about what is seen, but about the space that allows seeing to occur."
          </p>
        </blockquote>

        <blockquote className="artist-quote flex flex-col gap-8 items-end text-right">
          <span className="text-vermillion font-sans text-[10px] tracking-[0.4em] uppercase">02 / Process</span>
          <p className="text-parchment font-serif text-3xl md:text-5xl leading-tight max-w-2xl">
            "I paint in the dark. It forces the hand to listen to the texture of the oil rather than the trick of the light."
          </p>
        </blockquote>

        <blockquote className="artist-quote flex flex-col gap-8 items-start">
          <span className="text-vermillion font-sans text-[10px] tracking-[0.4em] uppercase">03 / The Void</span>
          <p className="text-parchment font-serif text-3xl md:text-5xl leading-tight max-w-2xl">
            "The void is not empty. It is a dense, vibrating mass of potential color waiting for the viewer's eye to adjust."
          </p>
        </blockquote>
      </div>

      <div className="mt-64 flex flex-col items-center gap-12 text-center max-w-2xl">
        <div className="w-px h-32 bg-parchment/10" />
        <p className="font-sans text-parchment/40 text-sm leading-relaxed tracking-wide">
          Camille Wiseman is a multidisciplinary artist based in the Pacific Northwest. 
          Her work has been exhibited at the Guggenheim, MoMA, and private collections globally.
        </p>
        <Link href="/" className="text-parchment hover:text-vermillion font-sans text-xs tracking-[0.5em] uppercase transition-colors duration-500">
          Return to Collection
        </Link>
      </div>
    </div>
  );
}
