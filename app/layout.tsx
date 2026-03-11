import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '../components/Providers';
import { CanvasBackground } from '../components/CanvasBackground';
import { CinematicLoader } from '../components/CinematicLoader';

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
