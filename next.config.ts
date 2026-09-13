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
};

export default nextConfig;
