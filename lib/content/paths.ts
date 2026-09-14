import path from 'node:path'

/**
 * Resolved per call, not at module load, so tests can point the loaders at a
 * temporary directory via CONTENT_ROOT. Reading it at module scope would bake
 * in whatever was set when the module was first imported, which under ESM is
 * effectively once per process.
 *
 * Keep the fallback as a ternary rather than `??`: Turbopack folds this branch
 * away at build time and then sees that every read stays under `content/`.
 * With `??` it cannot, and it traces the whole project into the server output.
 */
export function contentRoot(): string {
  const root = process.env.CONTENT_ROOT
  return root ? root : path.join(process.cwd(), 'content')
}

/**
 * `poems/hujan-di-bintaro.md` -> `hujan-di-bintaro`.
 *
 * A leading sort prefix is stripped: `01-olx.md` -> `olx`. That lets a folder
 * whose order is a human decision rather than a date (experience, projects)
 * carry its order in the filename without the number leaking into the URL.
 */
export function slugFromFilename(filename: string): string {
  return filename
    .replace(/\.mdx?$/, '')
    .replace(/^\d+[-_]/, '')
}
