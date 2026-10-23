import { cache } from 'react'
import { byNewestFirst, byOrder, readCollection, readDoc, type Entry } from './read'
import { readingTime } from './reading-time'
import {
  aboutSchema,
  caseStudySchema,
  creationPageSchema,
  experienceSchema,
  homeSchema,
  noteSchema,
  nowSchema,
  projectSchema,
  siteSchema,
} from './schema'

export type { Entry }
export type { Site } from './schema'

/*
 * Every loader is wrapped in React's `cache`, so a page that needs a list
 * twice (say once for metadata, once to render) reads the directory once per
 * request. It is per-request memoisation, not a
 * cross-request cache, which is what keeps `next dev` picking up an edit to a
 * markdown file on the very next reload.
 */

// ---------------------------------------------------------------------------
// Site identity and page copy
// ---------------------------------------------------------------------------

export const loadSite = cache(() => readDoc('site.md', siteSchema))
export const loadHome = cache(() => readDoc('pages/home.md', homeSchema))
export const loadCreationPage = cache(() => readDoc('pages/creation.md', creationPageSchema))
export const loadAbout = cache(() => readDoc('pages/about.md', aboutSchema))
export const loadNow = cache(() => readDoc('pages/now.md', nowSchema))

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

export const loadExperience = cache(() => readCollection('experience', experienceSchema, byOrder))
export const loadProjects = cache(() => readCollection('projects', projectSchema, byOrder))

/**
 * A case study or note as the page renders it: the file, plus the reading-time
 * estimate resolved. Doing it here rather than in each template is what keeps
 * the number on the Creation card identical to the one on the article.
 */
function timed<T extends { readingTime?: number }>(entry: Entry<T>) {
  return { ...entry, minutes: entry.readingTime ?? readingTime(entry.body) }
}

export const loadCaseStudies = cache(async () =>
  (await readCollection('case-studies', caseStudySchema, byNewestFirst)).map(timed)
)

export const loadNotes = cache(async () =>
  (await readCollection('notes', noteSchema, byNewestFirst)).map(timed)
)

export async function loadCaseStudy(slug: string) {
  return (await loadCaseStudies()).find((entry) => entry.slug === slug)
}

export async function loadNote(slug: string) {
  return (await loadNotes()).find((entry) => entry.slug === slug)
}
