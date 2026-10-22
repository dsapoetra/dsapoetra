import { cache } from 'react'
import { byNewestFirst, byOrder, readCollection, readDoc, type Entry } from './read'
import { readingTime } from './reading-time'
import {
  aboutSchema,
  caseStudySchema,
  experienceSchema,
  homeSchema,
  noteSchema,
  nowSchema,
  projectSchema,
  siteSchema,
  creationPageSchema,
  type About,
  type CaseStudy,
  type Experience,
  type Home,
  type Note,
  type Now,
  type Project,
  type Site,
  type CreationPage,
} from './schema'

export type { Entry }
export type {
  About, CaseStudy, Experience, Home, Note, Now,
  Project, Site, CreationPage,
} from './schema'

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

export const loadSite = cache(
  async (): Promise<Entry<Site>> => readDoc('site.md', siteSchema)
)

export const loadHome = cache(
  async (): Promise<Entry<Home>> => readDoc('pages/home.md', homeSchema)
)

export const loadCreationPage = cache(
  async (): Promise<Entry<CreationPage>> => readDoc('pages/creation.md', creationPageSchema)
)

export const loadAbout = cache(
  async (): Promise<Entry<About>> => readDoc('pages/about.md', aboutSchema)
)

export const loadNow = cache(
  async (): Promise<Entry<Now>> => readDoc('pages/now.md', nowSchema)
)

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

export const loadExperience = cache(
  async (): Promise<Array<Entry<Experience>>> =>
    readCollection('experience', experienceSchema, byOrder)
)

export const loadProjects = cache(
  async (): Promise<Array<Entry<Project>>> =>
    readCollection('projects', projectSchema, byOrder)
)

/**
 * A case study or note as the page renders it: the file, plus the reading-time
 * estimate resolved. Doing it here rather than in each template is what keeps
 * the number on the Creation card identical to the one on the article.
 */
export type Timed<T> = Entry<T> & { minutes: number }

function timed<T extends { readingTime?: number }>(entry: Entry<T>): Timed<T> {
  return { ...entry, minutes: entry.readingTime ?? readingTime(entry.body) }
}

export const loadCaseStudies = cache(
  async (): Promise<Array<Timed<CaseStudy>>> =>
    (await readCollection('case-studies', caseStudySchema, byNewestFirst)).map(timed)
)

export async function loadCaseStudy(slug: string): Promise<Timed<CaseStudy> | null> {
  const all = await loadCaseStudies()
  return all.find((entry) => entry.slug === slug) ?? null
}

export const loadNotes = cache(
  async (): Promise<Array<Timed<Note>>> =>
    (await readCollection('notes', noteSchema, byNewestFirst)).map(timed)
)

export async function loadNote(slug: string): Promise<Timed<Note> | null> {
  const all = await loadNotes()
  return all.find((entry) => entry.slug === slug) ?? null
}
