import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { cache } from 'react'
import matter from 'gray-matter'
import { z } from 'zod'
import { contentRoot } from './load'

/**
 * A sheet's own words — `content/tulisan.mdx` and its siblings.
 *
 * Every top-level page is a drawing sheet, and a sheet has a headline, a line
 * of prose under it, and a title block. None of that is writing in the sense
 * the collections are, but all of it is *text*, and text belongs in a file the
 * owner can edit without opening a `.tsx`. This loader is what makes that true:
 * the page supplies structure, the Markdown file supplies every word.
 *
 * A missing file is not an error. The page falls back to its own defaults, so
 * a sheet still renders on a fresh checkout with an empty `content/`.
 *
 * See `docs/ADDING-CONTENT.md` and `content/README.md`.
 */
const titleBlockFieldSchema = z.object({
  label: z.string('label wajib diisi').min(1, 'label wajib diisi'),
  value: z.string('value wajib diisi').min(1, 'value wajib diisi'),
})

const sheetSchema = z.object({
  title: z.string('title wajib diisi').min(1, 'title wajib diisi'),
  /**
   * The tail of the headline, set in the drafting blue. Optional: a headline
   * with no second colour is a headline, not a broken one.
   */
  titleAccent: z.string().optional(),
  /** Overrides the page's own `<title>`. Falls back to `title` when absent. */
  metaTitle: z.string().optional(),
  description: z.string().optional(),
  /**
   * Title-block fields, in the order they should be ruled across the foot of
   * the sheet. Free-form by design — the Writing sheet measures a reading
   * cadence, another sheet measures something else. The sheet number is NOT
   * listed here; it comes from the register in `lib/site.ts`.
   */
  titleBlock: z.array(titleBlockFieldSchema).optional(),
})

export type Sheet = {
  title: string
  titleAccent?: string
  metaTitle?: string
  description?: string
  titleBlock: Array<{ label: string; value: string }>
  /** Everything under the frontmatter: the paragraph beneath the headline. */
  intro: string
}

export const loadSheet = cache(async function loadSheet(
  name: string
): Promise<Sheet | null> {
  const file = path.join(contentRoot(), `${name}.mdx`)

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
  const parsed = sheetSchema.safeParse(data)

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(`Frontmatter tidak valid di content/${name}.mdx — ${detail}`)
  }

  return {
    ...parsed.data,
    titleBlock: parsed.data.titleBlock ?? [],
    // Collapsed onto one paragraph: the intro sits on a fixed measure under a
    // large headline, and a file that happens to contain a blank line should
    // not silently change the shape of the sheet's header band.
    intro: content.replace(/\s+/g, ' ').trim(),
  }
})
