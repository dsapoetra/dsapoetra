import type { MetadataRoute } from 'next'
import { loadSite } from '@/lib/content'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await loadSite()

  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${site.url}/sitemap.xml`,
  }
}
