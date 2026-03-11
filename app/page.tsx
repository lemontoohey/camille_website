import { Gallery } from '../components/Gallery';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="w-full relative min-h-screen pt-32 pb-48">
      {/* Global Navigation Links */}
      <nav className="fixed top-12 right-6 md:right-12 z-50 flex flex-col gap-6 items-end pointer-events-auto">
        <Link 
          href="/about" 
          className="text-parchment/50 hover:text-vermillion font-sans text-[10px] tracking-[0.4em] uppercase transition-colors duration-500"
        >
          [ The Artist ]
        </Link>
        <a 
          href="mailto:studio@camillewiseman.art" 
          className="text-parchment/50 hover:text-vermillion font-sans text-[10px] tracking-[0.4em] uppercase transition-colors duration-500"
        >
          [ Studio ]
        </a>
      </nav>

      <Gallery />

      <footer className="w-full flex justify-center pb-24">
        <div className="w-px h-24 bg-parchment/10" />
      </footer>
    </div>
  );
}
