import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Luxury Digital Gallery Tokens
        void: '#0a0010',        // Deepest background - Masstone Dioxazine Violet (Guggenheim at Night)
        magenta: '#E40078',     // WebGL layer 1 - Primary Quinacridone Magenta
        pg7: '#005F56',         // WebGL layer 2 - Phthalo Green
        parchment: '#FDF5E6',   // All typography - Warm parchment
        vermillion: 'rgba(155, 27, 21, 0.85)', // Classical deep cadmium red that is a little bit transparent
      },
      fontFamily: {
        // High-contrast serif for H1/H2 titles
        serif: ['var(--font-playfair)', 'serif'],
        // Minimal geometric sans-serif for UI text, prices, and descriptions
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      // Fluid Artwork Hover transition values
      transitionTimingFunction: {
        'lux-ease': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      transitionDuration: {
        '800': '800ms',
      }
    },
  },
  plugins: [],
};
export default config;
