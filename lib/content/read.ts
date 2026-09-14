import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import type { z } from 'zod'
import { contentRoot, slugFromFilename } from './paths'

/** A parsed file: its validated frontmatter, plus its slug and body. */
export type Entry<T> = T & { slug: string; body: string }

/**
 * Newest first, which is what every dated collection wants.
 *
 * Compares the ISO strings directly. `YYYY-MM-DD` sorts lexicographically in
 * exactly calendar order, so this needs no Date objects and therefore has no
 * timezone to get wrong.
 */
export function byNewestFirst<T extends { date: string }>(a: T, b: T): number {
  return a.date < b.date ? 1 : a.date > b.date ? -1 : 0
}

/**
 * Ascending `order`, falling back to filename.
 *
 * For collections whose sequence is a human decision, not a date: the
 * experience list and the projects list. Entries with no `order` sort after
 * those that have one, in filename order, so a half-ordered folder still
 * renders in a stable sequence instead of shuffling between builds.
 */
export function byOrder<T extends { order?: number }>(
  a: Entry<T>,
  b: Entry<T>
): number {
  const left = a.order ?? Number.MAX_SAFE_INTEGER
  const right = b.order ?? Number.MAX_SAFE_INTEGER
  if (left !== right) return left - right
  return a.slug.localeCompare(b.slug)
}

/**
 * Turns a Zod failure into a message that names the file and the field.
 *
 * The person who sees this is the author, mid-commit, and the only useful
 * thing to tell them is which file and which line of frontmatter. A raw Zod
 * dump names neither.
 */
function invalid(where: string, error: z.ZodError): Error {
  const detail = error.issues
    .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n')
  return new Error(`Invalid frontmatter in ${where}\n${detail}`)
}

/**
 * Reads and validates one markdown file at `relativePath` under `content/`.
 *
 * Used for the page-copy files, the ones named after a route. Unlike a
 * collection these are required: a missing `pages/home.md` is a broken build,
 * not an empty list, and it should say so rather than render a blank page.
 */
export async function readDoc<T>(
  relativePath: string,
  schema: z.ZodType<T>
): Promise<Entry<T>> {
  const absolute = path.join(contentRoot(), relativePath)

  let raw: string
  try {
    raw = await readFile(absolute, 'utf8')
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`Missing content file: ${relativePath}`)
    }
    throw error
  }

  const { data, content } = matter(raw)
  const parsed = schema.safeParse(data)
  if (!parsed.success) throw invalid(relativePath, parsed.error)

  return {
    ...parsed.data,
    slug: slugFromFilename(path.basename(relativePath)),
    body: content.trim(),
  }
}

/**
 * Reads every markdown file in one directory under `content/`, validates each
 * one's frontmatter, and returns them in the order `compare` puts them.
 *
 * A directory that does not exist is an empty collection, not an error. That
 * is the on/off switch for a whole section of the site: delete the folder and
 * the section disappears cleanly, because the file IS the switch.
 */
export async function readCollection<T>(
  dir: string,
  schema: z.ZodType<T>,
  compare: (a: Entry<T>, b: Entry<T>) => number
): Promise<Array<Entry<T>>> {
  const absolute = path.join(contentRoot(), dir)

  let filenames: string[]
  try {
    filenames = await readdir(absolute)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return []
    }
    throw error
  }

  const entries = await Promise.all(
    filenames
      .filter((name) => /\.mdx?$/.test(name) && !name.startsWith('.'))
      .map(async (name) => {
        const raw = await readFile(path.join(absolute, name), 'utf8')
        const { data, content } = matter(raw)
        const parsed = schema.safeParse(data)
        if (!parsed.success) throw invalid(`${dir}/${name}`, parsed.error)

        return {
          ...parsed.data,
          slug: slugFromFilename(name),
          body: content.trim(),
        }
      })
  )

  return entries.sort(compare)
}
