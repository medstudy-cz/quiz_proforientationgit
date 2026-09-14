const path = require('path');
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./app/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Saves a lot of memory on constrained CI/Docker runners
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Studio/schemas may be absent in Docker image; quiz app is typechecked in CI/dev
    ignoreBuildErrors: process.env.DOCKER_BUILD === '1',
  },
  webpack(config) {
    config.resolve.alias['@'] = path.resolve(__dirname);

    // Limit webpack parallelism to reduce peak RAM
    config.parallelism = 1;

    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    config.module.rules.push({
      test: /\.(png|jpg|jpeg|gif|webp)$/i,
      type: 'asset/resource',
    });

    return config;
  },
};

module.exports = withNextIntl(nextConfig);
