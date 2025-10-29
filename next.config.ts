// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  // 1. React strict mode (dev‐only checks for unsafe lifecycles, legacy APIs…)
  reactStrictMode: true,

  // 2. Keep your styled-components SWC compiler setting
  compiler: {
    styledComponents: true,
  },

  // 3. ESLint: do NOT ignore errors during build
  eslint: {
    // Next.js will fail the build if any lint error occurs
    ignoreDuringBuilds: false,
  },

  // 4. TypeScript: do NOT ignore type errors during build
  typescript: {
    // Next.js will fail the build if any TS error exists
    ignoreBuildErrors: false,
  }
};

export default nextConfig;
