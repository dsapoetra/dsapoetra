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
  poemSchema,
  projectSchema,
  readingNoteSchema,
  siteSchema,
  storySchema,
  workPageSchema,
  writingPageSchema,
  type About,
  type CaseStudy,
  type Experience,
  type Home,
  type Note,
  type Now,
  type Poem,
  type Project,
  type ReadingNote,
  type Site,
  type Story,
  type WorkPage,
  type WritingPage,
} from './schema'

export type { Entry }
export type {
  About, CaseStudy, Experience, Home, Note, Now,
  Poem, Project, ReadingNote, Site, Story, WorkPage, WritingPage,
} from './schema'

/*
 * Every loader is wrapped in React's `cache`, so a page that needs the poem
 * list twice (once to render it, once to work out the previous and next links)
 * reads the directory once per request. It is per-request memoisation, not a
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

export const loadWorkPage = cache(
  async (): Promise<Entry<WorkPage>> => readDoc('pages/work.md', workPageSchema)
)

export const loadWritingPage = cache(
  async (): Promise<Entry<WritingPage>> =>
    readDoc('pages/writing.md', writingPageSchema)
)

export const loadAbout = cache(
  async (): Promise<Entry<About>> => readDoc('pages/about.md', aboutSchema)
)

export const loadNow = cache(
  async (): Promise<Entry<Now>> => readDoc('pages/now.md', nowSchema)
)

// ---------------------------------------------------------------------------
// Work wing
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
 * the number on the Work landing card identical to the one on the article.
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

// ---------------------------------------------------------------------------
// Writing wing
// ---------------------------------------------------------------------------

export const loadPoems = cache(
  async (): Promise<Array<Entry<Poem>>> =>
    readCollection('poems', poemSchema, byNewestFirst)
)

export async function loadPoem(slug: string): Promise<Entry<Poem> | null> {
  const all = await loadPoems()
  return all.find((entry) => entry.slug === slug) ?? null
}

export const loadStories = cache(
  async (): Promise<Array<Timed<Story>>> =>
    (await readCollection('stories', storySchema, byNewestFirst)).map(timed)
)

export async function loadStory(slug: string): Promise<Timed<Story> | null> {
  const all = await loadStories()
  return all.find((entry) => entry.slug === slug) ?? null
}

export const loadReadingNotes = cache(
  async (): Promise<Array<Entry<ReadingNote>>> =>
    readCollection('reading', readingNoteSchema, byNewestFirst)
)

export async function loadReadingNote(
  slug: string
): Promise<Entry<ReadingNote> | null> {
  const all = await loadReadingNotes()
  return all.find((entry) => entry.slug === slug) ?? null
}

/**
 * The piece the Writing landing opens with, rendered in full.
 *
 * It is the newest POEM rather than the newest thing of any kind, and that is
 * deliberate: a poem is short enough to print whole above the lists, and a
 * fourteen-minute story is not. Publishing a story never silently pushes a
 * wall of text onto the landing page.
 */
export async function loadFeaturedPoem(): Promise<Entry<Poem> | null> {
  const poems = await loadPoems()
  return poems[0] ?? null
}

/**
 * The pieces either side of `slug` in reading order, for the story footer.
 *
 * The list is newest first, so the entry BEFORE the current one in the array
 * is the newer piece. `previous` here means previously published, which is the
 * next one along, and getting that backwards is the easy mistake.
 */
export function neighbours<T extends { slug: string; title: string }>(
  all: T[],
  slug: string
): { previous: T | null; next: T | null } {
  const index = all.findIndex((entry) => entry.slug === slug)
  if (index === -1) return { previous: null, next: null }
  return {
    previous: all[index + 1] ?? null,
    next: all[index - 1] ?? null,
  }
}
