'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, Transition } from 'framer-motion';
import Image from 'next/image';
import artworksData from '@/src/data/artworks.json';
import { useUiStore } from '@/store/useUiStore';

interface Artwork {
  id: string;
  title: string;
  price: string;
  imagePath?: string;
  colors?: string[];
  dimensions: string;
  medium: string;
}

const ApertureArtworkCard = ({ artwork, index }: { artwork: Artwork; index: number }) => {
  const router = useRouter();
  const setIsTransitioning = useUiStore((state) => state.setIsTransitioning);
  const [isAcquiring, setIsAcquiring] = useState(false);

  // Transition settings for the slow, heavy aperture reveal
  const revealTransition: Transition = { duration: 1.5, ease: [0.22, 1, 0.36, 1] as const };
  // Transition settings for the fast, mechanical "snap" on click
  const snapTransition: Transition = { duration: 0.4, ease: 'circInOut' as const };

  const getWidthClass = (i: number) => {
    const widths = ['md:max-w-xl', 'md:max-w-3xl', 'md:max-w-2xl', 'md:max-w-4xl'];
    return `w-full ${widths[i % widths.length]}`;
  };

  const getAlignmentClass = (i: number) => {
    const alignments = ['self-start', 'self-center', 'self-end', 'self-center'];
    return alignments[i % alignments.length];
  };

  const handleAcquireClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAcquiring(true);
    setIsTransitioning(true);

    setTimeout(() => {
      router.push(`/art/${artwork.id}`);
    }, 600);
  };

  const imageSrc = artwork.imagePath || '/placeholders/artwork-1.jpg';

  return (
    <article className={`relative group flex flex-col gap-10 w-full ${getAlignmentClass(index)} ${getWidthClass(index)}`}>
      <div className="relative w-full aspect-[4/5] cursor-pointer" onClick={handleAcquireClick}>
        <motion.div
          className="absolute inset-0 w-full h-full overflow-hidden"
          variants={{
            hidden: {
              clipPath: 'inset(50% 50% 50% 50%)',
              boxShadow: '0 0 0px rgba(150, 40, 20, 0)',
              scale: 1,
            },
            visible: {
              clipPath: 'inset(0% 0% 0% 0%)',
              boxShadow: '0 0 35px 2px rgba(150, 40, 20, 0.45)',
              scale: 1,
            },
            clicked: {
              clipPath: 'inset(49.5% 49.5% 49.5% 49.5%)',
              boxShadow: '0 0 80px 10px rgba(150, 40, 20, 0.9)',
              scale: 0.95,
            },
          }}
          initial="hidden"
          whileInView={isAcquiring ? 'clicked' : 'visible'}
          viewport={{ once: true, margin: '-15%' }}
          transition={isAcquiring ? snapTransition : revealTransition}
        >
          <Image
            src={imageSrc}
            alt={artwork.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 70vw"
            priority={index < 2}
          />
          <div className="absolute inset-0 bg-diox-rich mix-blend-overlay opacity-20 pointer-events-none" />
        </motion.div>

        <motion.div
          className="absolute h-[1px] bg-magenta w-full left-0 z-10"
          variants={{
            hidden: { top: '50%', opacity: 0 },
            visible: { top: '-20px', opacity: 1 },
            clicked: { top: '50%', opacity: 1 },
          }}
          initial="hidden"
          whileInView={isAcquiring ? 'clicked' : 'visible'}
          viewport={{ once: true, margin: '-15%' }}
          transition={isAcquiring ? snapTransition : revealTransition}
        />
        <motion.div
          className="absolute h-[1px] bg-magenta w-full left-0 z-10"
          variants={{
            hidden: { bottom: '50%', opacity: 0 },
            visible: { bottom: '-20px', opacity: 1 },
            clicked: { bottom: '50%', opacity: 1 },
          }}
          initial="hidden"
          whileInView={isAcquiring ? 'clicked' : 'visible'}
          viewport={{ once: true, margin: '-15%' }}
          transition={isAcquiring ? snapTransition : revealTransition}
        />
        <motion.div
          className="absolute w-[1px] bg-pg7 h-full top-0 z-10"
          variants={{
            hidden: { left: '50%', opacity: 0 },
            visible: { left: '-20px', opacity: 1 },
            clicked: { left: '50%', opacity: 1 },
          }}
          initial="hidden"
          whileInView={isAcquiring ? 'clicked' : 'visible'}
          viewport={{ once: true, margin: '-15%' }}
          transition={isAcquiring ? snapTransition : revealTransition}
        />
        <motion.div
          className="absolute w-[1px] bg-pg7 h-full top-0 z-10"
          variants={{
            hidden: { right: '50%', opacity: 0 },
            visible: { right: '-20px', opacity: 1 },
            clicked: { right: '50%', opacity: 1 },
          }}
          initial="hidden"
          whileInView={isAcquiring ? 'clicked' : 'visible'}
          viewport={{ once: true, margin: '-15%' }}
          transition={isAcquiring ? snapTransition : revealTransition}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 1.2, delay: 0.4 }}
        className="flex flex-col gap-3 mt-4 cursor-pointer group/meta"
        onClick={handleAcquireClick}
      >
        <div className="flex flex-row justify-between items-baseline gap-8">
          <h2 className="text-parchment font-serif text-base md:text-lg leading-tight tracking-wide group-hover/meta:text-benzi transition-colors duration-500">
            {artwork.title}
          </h2>
          <div className="relative overflow-hidden">
            <div className="relative">
              <span className="block text-parchment font-sans tracking-[0.1em] text-sm font-light transition-all duration-500 group-hover/meta:opacity-0 group-hover/meta:-translate-y-full">
                {artwork.price}
              </span>
              <span className="absolute inset-0 block text-benzi font-sans tracking-[0.1em] text-sm font-light translate-y-full opacity-0 transition-all duration-500 group-hover/meta:translate-y-0 group-hover/meta:opacity-100">
                Acquire
              </span>
            </div>
            <div className="absolute left-0 top-1/2 w-full h-[1px] bg-benzi scale-x-0 origin-left transition-transform duration-500 ease-in-out group-hover/meta:scale-x-100" />
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

export const Gallery = () => {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-16 md:py-32 z-10 flex flex-col items-center">
      <div className="fixed inset-0 bg-diox-rich z-[-1] pointer-events-none" aria-hidden />

      <header className="fixed top-1/3 left-4 md:left-8 z-50 pointer-events-none hidden md:block">
        <h1 className="font-sans text-[10px] text-parchment tracking-[0.5em] uppercase opacity-50 [writing-mode:vertical-rl] rotate-180">
          Available Acquisitions
        </h1>
      </header>

      <header className="md:hidden w-full text-left mb-16 px-2">
        <h1 className="font-sans text-[10px] text-parchment tracking-[0.5em] uppercase opacity-50">
          Available Acquisitions
        </h1>
      </header>

      <div className="flex flex-col gap-y-48 md:gap-y-80 items-start w-full pb-48 mt-24 md:mt-0">
        {(artworksData as Artwork[]).map((artwork, idx) => (
          <ApertureArtworkCard key={artwork.id} artwork={artwork} index={idx} />
        ))}
      </div>
    </section>
  );
};
