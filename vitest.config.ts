import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      /*
       * `server-only` throws the moment it is imported outside a React Server
       * Component. Next.js resolves it through the `react-server` condition,
       * which maps it to the package's own empty module; plain Node does not,
       * so tests of any server module that imports it — the whole DOKU layer —
       * would fail to load. Point the marker at that same empty module.
       *
       * This changes nothing in the app. Next.js still resolves `server-only`
       * normally, so importing one of these modules from a client component is
       * still a build error, which is the entire point of the guard.
       */
      'server-only': fileURLToPath(
        new URL('./node_modules/server-only/empty.js', import.meta.url)
      ),
    },
  },
})
