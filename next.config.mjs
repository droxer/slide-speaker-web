import createNextIntlPlugin from 'next-intl/plugin';
import nextPWA from 'next-pwa';
import runtimeCaching from 'next-pwa/cache.js';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const withPWA = nextPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching,
  buildExcludes: [/middleware-manifest\.json$/],
});

const nextConfig = {
  reactStrictMode: true,
  // Inline critical CSS
  experimental: {
    optimizeCss: true,
  },
  // Configure headers for bfcache compatibility
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Vary',
            value: 'Accept-Language, Cookie',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(withPWA(nextConfig));
