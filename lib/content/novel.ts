import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { cache } from 'react'
import matter from 'gray-matter'
import { z } from 'zod'
import { isoDate } from './schema'
import { contentRoot } from './load'

/**
 * `content/novel.mdx` — the progress strip on the homepage.
 *
 * A singleton like `sekarang.mdx`, not a collection: there is one novel. A
 * missing file simply means the strip does not render, which is how the block
 * is switched off — deleting the file is the "hide this" gesture.
 */
const novelSchema = z.object({
  /** Short state, e.g. `draf awal`. */
  status: z.string('status wajib diisi').min(1, 'status wajib diisi'),
  chaptersDone: z
    .number('chaptersDone harus berupa angka')
    .int('chaptersDone harus bilangan bulat')
    .min(0, 'chaptersDone tidak boleh negatif'),
  chaptersTotal: z
    .number('chaptersTotal harus berupa angka')
    .int('chaptersTotal harus bilangan bulat')
    .min(0, 'chaptersTotal tidak boleh negatif'),
  updated: isoDate,
})

export type Novel = {
  status: string
  /** Already clamped to `chaptersTotal` — see `loadNovel`. */
  chaptersDone: number
  chaptersTotal: number
  updated: string
  /** Optional one-line note under the squares. Empty when the file has no body. */
  note: string
}

export const loadNovel = cache(async (): Promise<Novel | null> => {
  const file = path.join(contentRoot(), 'novel.mdx')

  let raw: string
  try {
    raw = await readFile(file, 'utf8')
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null
    }
    throw error
  }

  const { data, content } = matter(raw)
  const parsed = novelSchema.safeParse(data)

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(`Frontmatter tidak valid di content/novel.mdx — ${detail}`)
  }

  const { status, chaptersDone, chaptersTotal, updated } = parsed.data

  return {
    status,
    // Clamped here, once, so no consumer can render 25 of 24 chapters — and so
    // a typo in the file shows up as a full bar rather than as broken layout.
    chaptersDone: Math.min(chaptersDone, chaptersTotal),
    chaptersTotal,
    updated,
    note: content.replace(/\s+/g, ' ').trim(),
  }
})
