import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import dynamic from 'next/dynamic';
import { Providers } from '@/components/Providers';

// Dynamically import heavy/browser-only aesthetic components so they don't block initial SSR HTML
const CanvasBackground = dynamic(() => import('@/components/CanvasBackground').then(mod => mod.CanvasBackground), { ssr: false });
const CinematicLoader = dynamic(() => import('@/components/CinematicLoader').then(mod => mod.CinematicLoader), { ssr: false });
const GlintCursor = dynamic(() => import('@/components/GlintCursor').then(mod => mod.GlintCursor), { ssr: false });
const PageTransition = dynamic(() => import('@/components/PageTransition').then(mod => mod.PageTransition), { ssr: false });

// Typography Tokens
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500'],
});

export const metadata: Metadata = {
  title: 'Camille Wiseman | Fine Art Gallery',
  description: 'An immersive, cinematic headless e-commerce experience for fine artist Camille Wiseman.',
  themeColor: '#06000c',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-void text-parchment font-sans antialiased overflow-x-hidden selection:bg-vermillion selection:text-void">
        
        {/* Cinematic Initial Load Experience */}
        <CinematicLoader />

        {/* Global WebGL Shader Layer - Fixed behind main content */}
        <CanvasBackground />

        {/* Sensory Interaction Layers */}
        <GlintCursor />
        <PageTransition />

        {/* Client-side Providers wrapper (Lenis Smooth Scroll, Zustand Init, GSAP Registry) */}
        <Providers>
          {/* Main content layer, rendered over WebGL background */}
          <main className="relative z-10 w-full min-h-screen">
            {children}
          </main>
        </Providers>

      </body>
    </html>
  );
}

