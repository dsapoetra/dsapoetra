import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next'],
    // Content-loader tests (lib/content/*.test.ts) write and remove
    // transient uji- fixtures inside the real content/ directories.
    // Running test files in parallel workers lets one file's fixture
    // (e.g. load.test.ts's briefly-invalid frontmatter case) be caught
    // mid-flight by another file's collection read (latest.test.ts calls
    // loadPoems/loadStories/loadReviews on the same directories), which
    // fails the whole collection since readCollection throws on any
    // malformed file. Running files sequentially removes the race.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
})
