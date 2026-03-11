/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  // If you are NOT using a custom domain and are using username.github.io/camille_website, 
  // you need this basePath so CSS and Images load correctly in production.
  basePath: isProd ? '/camille_website' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
