/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 'standalone' produces .next/standalone/server.js — required for Cloud Run / Docker.
  output: 'standalone',
  outputFileTracingRoot: process.cwd(),
  // No image optimization needed; avoids sharp dependency at runtime.
  images: { unoptimized: true },
  // Strict TS checking in production build (Vercel default).
  typescript: { ignoreBuildErrors: false },
  // Dev-only: polling watcher for Termux / Android / low-inotify envs.
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/.pnpm-store/**',
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
