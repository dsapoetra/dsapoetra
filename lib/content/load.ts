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
 */
export function contentRoot(): string {
  return process.env.CONTENT_ROOT ?? path.join(process.cwd(), 'content')
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

async function readCollection<T extends { date: string }>(
  dir: string,
  schema: z.ZodType<T>
): Promise<Array<T & { slug: string; body: string }>> {
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

  return entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export const loadPoems = cache(async function loadPoems(): Promise<Poem[]> {
  return readCollection('puisi', poemSchema)
})

export async function loadPoem(slug: string): Promise<Poem | null> {
  const poems = await loadPoems()
  return poems.find((poem) => poem.slug === slug) ?? null
}

export const loadStories = cache(async function loadStories(): Promise<Story[]> {
  return readCollection('cerita', storySchema)
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
  return readCollection('ulasan', reviewSchema)
})

export async function loadReview(slug: string): Promise<Review | null> {
  const reviews = await loadReviews()
  return reviews.find((review) => review.slug === slug) ?? null
}
