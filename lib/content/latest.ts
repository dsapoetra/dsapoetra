import { cache } from 'react'
import { loadReviews, loadPoems, loadStories } from './load'

export type StreamKind = 'ulasan' | 'puisi' | 'cerita'

export type StreamItem = {
  kind: StreamKind
  slug: string
  title: string
  date: string
  href: string
  blurb?: string
  /**
   * Cover image path. Only reviews carry one — a poem or a story has no
   * artwork — so every consumer must treat it as optional and lay out without
   * it rather than reserving a gap.
   */
  cover?: string
}

const LABELS: Record<StreamKind, string> = {
  ulasan: 'Ulasan',
  puisi: 'Puisi',
  cerita: 'Cerita',
}

export function labelFor(kind: StreamKind): string {
  return LABELS[kind]
}

export const loadLatest = cache(async function loadLatest(
  limit?: number
): Promise<StreamItem[]> {
  const [reviews, poems, stories] = await Promise.all([
    loadReviews(),
    loadPoems(),
    loadStories(),
  ])

  const items: StreamItem[] = [
    ...reviews.map((review) => ({
      kind: 'ulasan' as const,
      slug: review.slug,
      title: review.title,
      date: review.date,
      href: `/ulasan/${review.slug}`,
      blurb: review.excerpt,
      cover: review.cover,
    })),
    ...poems.map((poem) => ({
      kind: 'puisi' as const,
      slug: poem.slug,
      title: poem.title,
      date: poem.date,
      href: `/puisi/${poem.slug}`,
    })),
    ...stories.map((story) => ({
      kind: 'cerita' as const,
      slug: story.slug,
      title: story.title,
      date: story.date,
      href: `/cerita/${story.slug}`,
      blurb: story.excerpt,
    })),
  ]

  items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  return typeof limit === 'number' ? items.slice(0, limit) : items
})

export type YearGroup = { year: string; items: StreamItem[] }

/**
 * Buckets a stream by year, newest year first, preserving the stream's order
 * inside each bucket.
 *
 * Takes an already-sorted stream and does not re-sort it: `loadLatest` owns the
 * ordering, including its tie-break, and duplicating that rule here would give
 * the archive a subtly different order from the homepage.
 */
export function groupByYear(items: StreamItem[]): YearGroup[] {
  const groups: YearGroup[] = []

  for (const item of items) {
    const year = item.date.slice(0, 4)
    const last = groups[groups.length - 1]
    if (last && last.year === year) {
      last.items.push(item)
    } else {
      groups.push({ year, items: [item] })
    }
  }

  return groups
}
