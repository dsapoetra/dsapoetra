import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { cache } from 'react'
import matter from 'gray-matter'
import { z } from 'zod'
import { slugFromFilename } from './slug'
import { poemSchema, storySchema, reviewSchema } from './schema'

/**
 * Resolved per call, not at module load, so tests can point the loaders at a
 * temporary directory via CONTENT_ROOT. Reading it at module scope would bake
 * in whatever was set when the module was first imported, which under ESM is
 * effectively once per process.
 *
 * Keep the fallback as a ternary rather than `??`: Turbopack folds this branch
 * away at build time and then sees that every read stays under `content/`.
 * With `??` it cannot, and it traces the whole project — sources and public/ —
 * into the server output.
 */
export function contentRoot(): string {
  const root = process.env.CONTENT_ROOT
  return root ? root : path.join(process.cwd(), 'content')
}

export type Poem = {
  slug: string
  title: string
  date: string
  body: string
}

export type Story = {
  slug: string
  title: string
  date: string
  excerpt: string
  body: string
}

/** A parsed file: its validated frontmatter, plus the slug and body. */
export type Entry<T> = T & { slug: string; body: string }

/**
 * Newest first, which is what every dated collection wants. Passed explicitly
 * rather than baked into `readCollection` so collections without a date — the
 * shop, whose order is a shelf decision — can order themselves.
 */
export function byNewestFirst<T extends { date: string }>(a: T, b: T): number {
  return a.date < b.date ? 1 : a.date > b.date ? -1 : 0
}

/**
 * Reads every `.mdx` file in one directory under `content/`, validates its
 * frontmatter, and returns the entries in the order `compare` puts them.
 *
 * Exported so collections outside `lib/content/` (the shop) get the same
 * frontmatter validation and the same error message pointing at the offending
 * file, instead of a second, subtly different loader.
 */
export async function readCollection<T>(
  dir: string,
  schema: z.ZodType<T>,
  compare: (a: Entry<T>, b: Entry<T>) => number
): Promise<Array<Entry<T>>> {
  const absolute = path.join(contentRoot(), dir)

  let filenames: string[]
  try {
    filenames = await readdir(absolute)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return []
    }
    throw error
  }

  const entries = await Promise.all(
    filenames
      .filter((name) => name.endsWith('.mdx'))
      .map(async (name) => {
        const raw = await readFile(path.join(absolute, name), 'utf8')
        const { data, content } = matter(raw)
        const parsed = schema.safeParse(data)

        if (!parsed.success) {
          const detail = parsed.error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('; ')
          throw new Error(`Frontmatter tidak valid di ${dir}/${name} — ${detail}`)
        }

        return {
          ...parsed.data,
          slug: slugFromFilename(name),
          body: content.trim(),
        }
      })
  )

  return entries.sort(compare)
}

export const loadPoems = cache(async function loadPoems(): Promise<Poem[]> {
  return readCollection('puisi', poemSchema, byNewestFirst)
})

export async function loadPoem(slug: string): Promise<Poem | null> {
  const poems = await loadPoems()
  return poems.find((poem) => poem.slug === slug) ?? null
}

export const loadStories = cache(async function loadStories(): Promise<Story[]> {
  return readCollection('cerita', storySchema, byNewestFirst)
})

export async function loadStory(slug: string): Promise<Story | null> {
  const stories = await loadStories()
  return stories.find((story) => story.slug === slug) ?? null
}

export type Review = {
  slug: string
  title: string
  book: { title: string; author: string }
  date: string
  cover: string
  excerpt: string
  videoUrl?: string
  canonicalUrl?: string
  tags?: string[]
  body: string
}

export const loadReviews = cache(async function loadReviews(): Promise<Review[]> {
  return readCollection('ulasan', reviewSchema, byNewestFirst)
})

export async function loadReview(slug: string): Promise<Review | null> {
  const reviews = await loadReviews()
  return reviews.find((review) => review.slug === slug) ?? null
}
