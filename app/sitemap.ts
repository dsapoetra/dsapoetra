import type { MetadataRoute } from 'next'
import { loadReviews, loadPoems, loadStories } from '@/lib/content/load'
import { site } from '@/lib/site'
import { hasShop } from '@/lib/products/load'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [reviews, poems, stories, shop] = await Promise.all([
    loadReviews(),
    loadPoems(),
    loadStories(),
    hasShop(),
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

  const entries: MetadataRoute.Sitemap = [
    ...reviews.map((r) => ({
      url: `${site.url}/ulasan/${r.slug}`,
      lastModified: r.date,
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    })),
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
