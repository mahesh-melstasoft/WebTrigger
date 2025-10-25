import type { NextConfig } from 'next'
import withPWA from 'next-pwa'

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        // Cache images, static assets for 30 days
        source: '/:all*(jpg|jpeg|gif|png|svg|webp|avif)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, immutable' },
        ],
      },
      {
        // Cache JS/CSS bundles
        source: '/:all*(js|css)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Cache fonts
        source: '/:all*(woff|woff2|ttf|eot)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
}

// Create the PWA plugin with options, then apply it to the Next config.
// This avoids passing nextConfig into the plugin options object (which can
// produce an array-like export and trigger "Unrecognized key(s)" warnings).
// Cast the plugin to `any` to avoid type incompatibilities between next-pwa's
// bundled next types and the project's installed next types.
const withPwaPlugin: any = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

export default withPwaPlugin(nextConfig) as unknown as NextConfig
