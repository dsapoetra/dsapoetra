import type { MetadataRoute } from 'next'
import { loadReviews, loadPoems, loadStories } from '@/lib/content/load'
import { site } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [reviews, poems, stories] = await Promise.all([
    loadReviews(),
    loadPoems(),
    loadStories(),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: site.url, changeFrequency: 'weekly', priority: 1 },
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
