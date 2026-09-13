import 'server-only'
import { readFile, access, constants } from 'node:fs/promises'
import path from 'node:path'

/**
 * Reads a product file out of `private/produk/`.
 *
 * That folder sits outside `public/`, so nothing in it is reachable by URL. The
 * only door is `/unduh/<token>`, which verifies a signature first.
 */

/** Resolved per call so tests can point it elsewhere, same as `contentRoot`. */
export function productFileRoot(): string {
  const root = process.env.PRODUCT_FILE_ROOT
  return root ? root : path.join(process.cwd(), 'private', 'produk')
}

const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.epub': 'application/epub+zip',
  '.mobi': 'application/x-mobipocket-ebook',
  '.zip': 'application/zip',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
}

export function contentTypeFor(filename: string): string {
  return CONTENT_TYPES[path.extname(filename).toLowerCase()] ?? 'application/octet-stream'
}

export type ProductFile = { bytes: Buffer; contentType: string; filename: string }

/**
 * Resolves a filename to a path inside the product folder, or null if it would
 * escape it.
 *
 * `path.resolve` collapses any `..`, so a traversal shows up here as a path
 * that is no longer the root joined to a bare basename.
 */
function safePath(filename: string): string | null {
  const root = productFileRoot()
  const resolved = path.resolve(root, filename)

  if (resolved !== path.join(root, path.basename(filename))) return null
  if (!resolved.startsWith(root + path.sep)) return null

  return resolved
}

/**
 * Whether a product's file is actually on disk.
 *
 * Checked before a download link is signed, so a product whose file has not
 * been added yet is described as "menyusul" in the receipt rather than given a
 * link that will fail when the buyer clicks it. Cheap — it stats, it does not
 * read.
 */
export async function productFileExists(filename: string): Promise<boolean> {
  const resolved = safePath(filename)
  if (!resolved) return false

  try {
    await access(resolved, constants.R_OK)
    return true
  } catch {
    return false
  }
}

/**
 * Loads a product file, or null when it is missing.
 *
 * The frontmatter schema already restricts `download` to a flat filename, but
 * this re-checks that the resolved path is still inside the root before
 * reading. Defence in depth: the check that matters is the one next to the
 * filesystem call, not the one three modules away — and it costs nothing.
 */
export async function readProductFile(
  filename: string
): Promise<ProductFile | null> {
  const resolved = safePath(filename)
  if (!resolved) return null

  try {
    const bytes = await readFile(resolved)
    return { bytes, contentType: contentTypeFor(filename), filename }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null
    }
    throw error
  }
}
