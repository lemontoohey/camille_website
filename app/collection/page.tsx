'use client';

import Link from 'next/link';
import { GridGallery } from '@/components/GridGallery';
import { useUiStore } from '@/store/useUiStore';

export default function CollectionPage() {
  const scrollVelocity = useUiStore((state) => state.scrollVelocity);
  const isScrolling = Math.abs(scrollVelocity) > 2;

  return (
    <div className="w-full relative">
      {/* Global Navigation Links */}
      <nav className={`fixed top-12 right-6 md:right-12 z-50 flex flex-col gap-6 items-end transition-opacity duration-700 ${isScrolling ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}>
        <Link
          href="/about"
          className="text-parchment/50 hover:text-vermillion font-sans text-[10px] tracking-[0.4em] uppercase transition-colors duration-500 py-3 min-h-[44px] flex items-center"
        >[ The Artist ]
        </Link>
        <a
          href="mailto:studio@akifunada.art"
          className="text-parchment/50 hover:text-vermillion font-sans text-[10px] tracking-[0.4em] uppercase transition-colors duration-500 py-3 min-h-[44px] flex items-center"
        >
          [ Studio ]
        </a>
      </nav>

      <GridGallery />
    </div>
  );
}
