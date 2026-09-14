import type { MetadataRoute } from 'next'
import { loadSite } from '@/lib/content'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await loadSite()
  const base = site.url.replace(/\/$/, '')

  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${base}/sitemap.xml`,
  }
}
