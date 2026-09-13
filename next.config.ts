import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Product files are read at runtime by path, not imported, so nothing in the
   * build graph points at them and tracing would leave them behind — the route
   * would 503 in production while working perfectly in development.
   *
   * Naming them here puts them in the deployed bundle. They stay unreachable by
   * URL: `private/` is not `public/`, and the only door is `/unduh/<token>`.
   */
  outputFileTracingIncludes: {
    '/unduh/[token]': ['./private/produk/**/*'],
    '/api/doku/notification': ['./private/produk/**/*'],
  },

  /*
   * DEVELOPMENT ONLY: never let the browser reuse a dev chunk.
   *
   * In dev, Turbopack names a chunk after its module path, not its contents —
   * `[root-of-the-server]__1o3xu9j._.css` stays that URL forever while the CSS
   * inside it changes on every edit. Chrome then serves a stale body back from
   * disk, and the symptom is vicious: the page renders with SOME of your
   * styles, so it looks like a layout bug in the code rather than a cache. It
   * cost an afternoon once; `no-store` costs nothing on localhost.
   *
   * Production is untouched — there, chunk names are content-hashed, which is
   * exactly what makes them safe to cache forever.
   */
  async headers() {
    if (process.env.NODE_ENV !== 'development') return []

    return [
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
    ]
  },
};

export default nextConfig;
