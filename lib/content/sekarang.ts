import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { cache } from 'react'
import matter from 'gray-matter'
import { z } from 'zod'
import { isoDate } from './schema'
import { contentRoot } from './load'

const sekarangSchema = z.object({ updated: isoDate })

export type Sekarang = { updated: string; body: string }

export const loadSekarang = cache(async (): Promise<Sekarang | null> => {
  const file = path.join(contentRoot(), 'sekarang.mdx')

  let raw: string
  try {
    raw = await readFile(file, 'utf8')
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null
    }
    throw error
  }

  const { data, content } = matter(raw)
  const parsed = sekarangSchema.safeParse(data)

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(`Frontmatter tidak valid di content/sekarang.mdx — ${detail}`)
  }

  return { updated: parsed.data.updated, body: content.trim() }
})

/** One `## heading` / first-paragraph pair from `sekarang.mdx`, condensed. */
export type SekarangLine = {
  /** Heading with a leading "Sedang " dropped, e.g. `Ditulis`. */
  label: string
  /** First paragraph under the heading, with the full stop trimmed. */
  value: string
  /**
   * The owner has not filled this line in yet. The homepage greys it rather
   * than hiding it — an admitted blank is honest; a silently missing row reads
   * as if the section were shorter than it is.
   */
  pending: boolean
}

/**
 * Condenses the `sekarang.mdx` body into the three-line summary the homepage
 * shows beside the latest writing.
 *
 * The full page still renders the MDX; this is a *view* of the same source, so
 * there is no second place to keep in sync. It reads only the shape the file
 * already uses — `## Heading` followed by a paragraph — and quietly skips
 * anything else, so extra prose on the page never breaks the homepage.
 */
export function summarizeSekarang(body: string): SekarangLine[] {
  const lines: SekarangLine[] = []

  // Split on level-2 headings; `sections[0]` is whatever precedes the first
  // one, which is not part of any section and is dropped.
  const sections = body.split(/^##[ \t]+/m).slice(1)

  for (const section of sections) {
    const newline = section.indexOf('\n')
    const heading = (newline === -1 ? section : section.slice(0, newline)).trim()
    const rest = newline === -1 ? '' : section.slice(newline + 1)

    // First non-empty block after the heading, collapsed onto one line.
    const paragraph = rest
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .find((block) => block !== '')

    if (!heading || !paragraph) continue

    const label = heading.replace(/^sedang\s+/i, '')
    const value = paragraph.replace(/\s+/g, ' ').replace(/\.$/, '')

    lines.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value,
      pending: /^belum diisi$/i.test(value),
    })
  }

  return lines
}
