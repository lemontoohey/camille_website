'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const quotes = gsap.utils.toArray<HTMLElement>('.artist-quote');
    quotes.forEach((quote) => {
      gsap.fromTo(quote,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: quote as gsap.DOMTarget,
            start: 'top 80%',
            once: true
          }
        }
      );
    });

    gsap.fromTo('.portrait-img',
      { scale: 1.05, opacity: 0 },
      { scale: 1, opacity: 1, duration: 2.5, ease: 'power2.out' }
    );
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="min-h-screen bg-void pt-48 pb-64 px-6 md:px-12 flex flex-col items-center overflow-hidden">

      {/* Institutional Portrait */}
      <div className="relative w-full max-w-md aspect-[3/4] mb-48" style={{ boxShadow: '0 40px 80px -20px rgba(10,5,25,1)' }}>
        <div className="relative w-full h-full overflow-hidden grayscale contrast-[1.1] bg-void">
          <Image
            src="/placeholders/camille-portrait.jpg"
            alt="Camille Wiseman"
            fill
            className="portrait-img object-cover"
            priority
          />
        </div>
      </div>

      {/* Elegant Typographic Narrative */}
      <div className="flex flex-col gap-40 w-full max-w-3xl">
        <blockquote className="artist-quote flex flex-col gap-6 text-center">
          <p className="text-parchment font-serif text-2xl sm:text-3xl md:text-4xl leading-relaxed font-light">
            &quot;My work is not about what is seen, but about the space that allows seeing to occur.&quot;
          </p>
          <span className="text-vermillion/70 font-sans text-[9px] tracking-[0.4em] uppercase">01 / Intent</span>
        </blockquote>

        <blockquote className="artist-quote flex flex-col gap-6 text-center">
          <p className="text-parchment font-serif text-2xl sm:text-3xl md:text-4xl leading-relaxed font-light">
            &quot;I paint in the dark. It forces the hand to listen to the texture of the oil rather than the trick of the light.&quot;
          </p>
          <span className="text-vermillion/70 font-sans text-[9px] tracking-[0.4em] uppercase">02 / Process</span>
        </blockquote>
      </div>

      {/* Understated Footer Bio */}
      <div className="mt-48 flex flex-col items-center gap-12 text-center max-w-xl">
        <div className="w-px h-24 bg-parchment/10" />
        <p className="font-sans text-parchment/40 text-xs leading-loose tracking-widest uppercase">
          Camille Wiseman is a multidisciplinary artist based in the Pacific Northwest.
          Her work explores the liminality of pigment and void.
        </p>
        <Link href="/" className="mt-8 text-parchment/60 hover:text-parchment font-sans text-[10px] tracking-[0.5em] uppercase transition-colors duration-700 py-3 flex items-center justify-center">
          [ Return to Exhibition ]
        </Link>
      </div>
    </div>
  );
}
