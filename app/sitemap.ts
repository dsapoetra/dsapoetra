import type { MetadataRoute } from 'next'
import {
  loadCaseStudies,
  loadNotes,
  loadPoems,
  loadReadingNotes,
  loadSite,
  loadStories,
} from '@/lib/content'

/**
 * Built from the content directories, so a new markdown file is in the sitemap
 * the moment it is committed and there is no second list to keep in step.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, caseStudies, notes, poems, stories, reading] = await Promise.all([
    loadSite(),
    loadCaseStudies(),
    loadNotes(),
    loadPoems(),
    loadStories(),
    loadReadingNotes(),
  ])

  const base = site.url.replace(/\/$/, '')

  const pages = ['', '/work', '/writing', '/about', '/now'].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: 'monthly' as const,
  }))

  const dated = [
    ...caseStudies.map((entry) => ({ path: `/work/${entry.slug}`, date: entry.date })),
    ...notes.map((entry) => ({ path: `/notes/${entry.slug}`, date: entry.date })),
    ...poems.map((entry) => ({ path: `/poems/${entry.slug}`, date: entry.date })),
    ...stories.map((entry) => ({ path: `/stories/${entry.slug}`, date: entry.date })),
    ...reading.map((entry) => ({ path: `/reading/${entry.slug}`, date: entry.date })),
  ].map((entry) => ({
    url: `${base}${entry.path}`,
    lastModified: entry.date,
    changeFrequency: 'yearly' as const,
  }))

  return [...pages, ...dated]
}
