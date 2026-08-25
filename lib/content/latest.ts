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
