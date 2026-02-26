const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'standalone' is required for the production Docker image (deploy/Dockerfile.production).
  // It bundles only the files needed to run, resulting in a much smaller container.
  output: 'standalone',
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@backend': path.resolve(__dirname, '../backend'),
    };
    return config;
  },
};

module.exports = nextConfig;
