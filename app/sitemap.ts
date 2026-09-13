import type { MetadataRoute } from 'next'
import { loadReviews, loadPoems, loadStories } from '@/lib/content/load'
import { loadRak } from '@/lib/content/rak'
import { site } from '@/lib/site'
import { hasShop } from '@/lib/products/load'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [reviews, poems, stories, shop, rak] = await Promise.all([
    loadReviews(),
    loadPoems(),
    loadStories(),
    hasShop(),
    loadRak(),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: site.url, changeFrequency: 'weekly', priority: 1 },
    // Listed only while there is something to sell — /toko 404s otherwise, and
    // the basket is deliberately noindex, so it never belongs here.
    ...(shop
      ? [
          {
            url: `${site.url}/toko`,
            changeFrequency: 'monthly' as const,
            priority: 0.8,
          },
        ]
      : []),
    { url: `${site.url}/tulisan`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${site.url}/ulasan`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${site.url}/puisi`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${site.url}/cerita`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${site.url}/sekarang`, changeFrequency: 'monthly', priority: 0.4 },
  ]

  /*
   * Every book on the shelf is a real page, so every book is listed — a book
   * with no notes yet is still the place that book lives on this site. The ones
   * that *have* been written about keep their date and rank above the rest;
   * the RSS feed, which is a feed of writing, still carries only those.
   */
  const reviewed = new Map(reviews.map((r) => [r.slug, r]))
  const shelf: MetadataRoute.Sitemap = (rak?.books ?? [])
    .filter((book) => !reviewed.has(book.slug))
    .map((book) => ({
      url: `${site.url}/ulasan/${book.slug}`,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    }))

  const entries: MetadataRoute.Sitemap = [
    ...reviews.map((r) => ({
      url: `${site.url}/ulasan/${r.slug}`,
      lastModified: r.date,
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    })),
    ...shelf,
    ...poems.map((p) => ({
      url: `${site.url}/puisi/${p.slug}`,
      lastModified: p.date,
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    })),
    ...stories.map((s) => ({
      url: `${site.url}/cerita/${s.slug}`,
      lastModified: s.date,
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    })),
  ]

  return [...staticRoutes, ...entries]
}
