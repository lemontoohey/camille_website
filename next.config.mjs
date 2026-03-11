/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Ensure the image optimization doesn't break static export.
  // We use unoptimized for GitHub Pages since it's a static host without a server.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
