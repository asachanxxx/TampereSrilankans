const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'standalone' is required for the production Docker image (deploy/Dockerfile.production).
  // It bundles only the files needed to run, resulting in a much smaller container.
  output: 'standalone',

  // Backend files (../backend/**) are compiled through Next.js webpack but have their own
  // tsconfig with strict:false. Suppress type-check errors that arise from the mismatch —
  // types are validated separately by the backend tsconfig.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // Force browsers and proxies to revalidate public/images/* on every request.
  // Because these files have no content-hash in their URL, replacing a file with
  // the same name (e.g. 1.jpg) would otherwise be invisible to cached clients.
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache',
          },
        ],
      },
    ];
  },

  webpack: (config) => {
    // Monorepo: backend files live outside event-ui/, so webpack's default
    // node_modules resolution (walking up from the backend folder) never
    // reaches event-ui/node_modules. Adding it explicitly here means ALL
    // files — including those under ../backend/ — can resolve packages like
    // @supabase/ssr that are installed only in event-ui/node_modules.
    config.resolve.modules = [
      'node_modules',
      path.resolve(__dirname, 'node_modules'),
    ];
    config.resolve.alias = {
      ...config.resolve.alias,
      '@backend': path.resolve(__dirname, '../backend'),
    };
    return config;
  },
};

module.exports = nextConfig;
