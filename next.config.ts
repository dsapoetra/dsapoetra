import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /*
   * DEVELOPMENT ONLY: never let the browser reuse a dev chunk.
   *
   * In dev, Turbopack names a chunk after its module path, not its contents, so
   * a stylesheet URL stays stable while the CSS inside it changes on every
   * edit. Chrome then serves a stale body from disk and the page renders with
   * only SOME of your styles, which reads as a layout bug rather than a cache.
   * Production is untouched: there, chunk names are content-hashed.
   */
  /*
   * Work was renamed Creation, and Writing moved to Medium (shown on the
   * homepage). Permanent redirects keep every link anyone shared working.
   */
  async redirects() {
    return [
      { source: '/work', destination: '/creation', permanent: true },
      { source: '/work/:slug', destination: '/creation/:slug', permanent: true },
      { source: '/writing', destination: '/', permanent: true },
    ]
  },

  async headers() {
    if (process.env.NODE_ENV !== 'development') return []

    return [
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
    ]
  },
}

export default nextConfig
