import type { MetadataRoute } from 'next'
import { loadCaseStudies, loadNotes, loadSite } from '@/lib/content'

/**
 * Built from the content directories, so a new markdown file is in the sitemap
 * the moment it is committed and there is no second list to keep in step.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, caseStudies, notes] = await Promise.all([
    loadSite(),
    loadCaseStudies(),
    loadNotes(),
  ])

  const base = site.url.replace(/\/$/, '')

  const pages = ['', '/creation', '/about', '/now'].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: 'monthly' as const,
  }))

  const dated = [
    ...caseStudies.map((entry) => ({ path: `/creation/${entry.slug}`, date: entry.date })),
    ...notes.map((entry) => ({ path: `/notes/${entry.slug}`, date: entry.date })),
  ].map((entry) => ({
    url: `${base}${entry.path}`,
    lastModified: entry.date,
    changeFrequency: 'yearly' as const,
  }))

  return [...pages, ...dated]
}
