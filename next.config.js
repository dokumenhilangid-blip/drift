/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Termux / Android / low-inotify environments — switch Watchpack to polling
  // and exclude pnpm store + node_modules from watching.
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
          '/projects/sandbox/.pnpm-store/**',
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
