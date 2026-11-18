import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Keep three / drei / motion out of the initial bundle as much as possible.
    optimizePackageImports: ['@react-three/drei', 'motion', 'd3-scale', 'd3-shape', 'd3-array', 'd3-hierarchy'],
  },
  async headers() {
    return [
      {
        source: '/Het_CV.pdf',
        headers: [{ key: 'Content-Disposition', value: 'attachment; filename="Het_CV.pdf"' }],
      },
    ];
  },
};

export default nextConfig;
