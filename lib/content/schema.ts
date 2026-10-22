import { z } from 'zod'

/**
 * A calendar day, `YYYY-MM-DD`, and it must be a real one.
 *
 * The regex alone would accept `2026-02-30`. The round-trip check catches it:
 * JavaScript rolls an impossible day forward to 2 March, so a date that does
 * not come back out the way it went in was never a date. This matters because
 * the whole site sorts on these strings, and a silently rolled date sorts into
 * the wrong place instead of failing the build.
 *
 * QUOTE YOUR DATES in frontmatter. Unquoted, YAML parses `2026-08-25` into its
 * own date type and gray-matter hands us a Date object, not a string.
 */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a quoted date like "2026-09-02"')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value)
  }, 'is not a real calendar day')

/**
 * Marks a piece written in Indonesian. Rendered as a `· ID` tag in lists and
 * set as `lang` on the article element, so a screen reader switches voice.
 * Absent means English; there is no `lang: en` to remember to write.
 */
/** An outbound link with its own label: `github →`, `demo →`, `visit →`. */
const link = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
})

/**
 * Where a page's order is a human decision rather than a date. Lower first.
 * Also expressible as a filename prefix (`01-olx.md`), which is usually
 * easier to see in a directory listing.
 */
const order = z.number().int().optional()

// ---------------------------------------------------------------------------
// Site identity and page copy
// ---------------------------------------------------------------------------

export const siteSchema = z.object({
  /** Full name, in the desktop header. */
  name: z.string().min(1),
  /** Abbreviated name, in the mobile header where the full one wraps. */
  shortName: z.string().min(1),
  /** Absolute, no trailing slash. Used for metadata and the sitemap. */
  url: z.string().url(),
  description: z.string().min(1),
  /** Footer, left side. */
  location: z.string().min(1),
  /** Footer, right side, in order. */
  links: z.array(link).default([]),
  /** Medium RSS feed. Its newest posts show on the homepage; absent hides the section. */
  medium: z.string().url().optional(),
})

export const homeSchema = z.object({
  title: z.string().min(1),
  /**
   * The hero's two halves: the working life on the Demon side in sans, the
   * writing life on the Angel side in serif. Separate fields because each
   * lands in a different half of the hero.
   */
  lead: z.string().min(1),
  leadSerif: z.string().min(1),
  /** The short line under the name, on the hero's seam. */
  tagline: z.string().optional(),
  cards: z
    .array(
      z.object({
        label: z.string().min(1),
        href: z.string().min(1),
        blurb: z.string().min(1),
      })
    )
    .min(1),
})

export const workPageSchema = z.object({
  title: z.string().min(1),
  intro: z.string().min(1),
})

export const aboutSchema = z.object({
  title: z.string().min(1),
  /** Path under `public/`. Absent renders the dashed placeholder from 1k. */
  photo: z.string().optional(),
  photoAlt: z.string().optional(),
})

export const nowSchema = z.object({
  title: z.string().min(1),
  updated: isoDate,
  /** The one large sentence. */
  lead: z.string().min(1),
  /** The small grey line under it. */
  footnote: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Work wing
// ---------------------------------------------------------------------------

export const experienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  /** Printed as written, e.g. `2022 to now`. Not parsed. */
  period: z.string().min(1),
  /** Sorts the list. Newest first; `to now` roles want the highest number. */
  order,
  /** One grey line above the body: what the company does. */
  summary: z.string().optional(),
  /** One grey line below the body: what you owned. */
  scope: z.string().optional(),
})

export const projectSchema = z.object({
  name: z.string().min(1),
  summary: z.string().min(1),
  /** Lowercase, mono, in a hairline box. `["go", "htmx", "sqlite"]`. */
  tags: z.array(z.string()).default([]),
  link: link.optional(),
  order,
})

export const caseStudySchema = z.object({
  title: z.string().min(1),
  date: isoDate,
  summary: z.string().min(1),
  /** Overrides the computed estimate. Only when the count lies. */
  readingTime: z.number().int().positive().optional(),
  /**
   * The three-cell block under the title. Keys become the small uppercase
   * labels, so they read as written: `System`, `Scale`, `My role`. Free-form
   * rather than fixed fields because a hiring case study and a migration case
   * study do not want the same three headings.
   */
  context: z.record(z.string(), z.string()).default({}),
  /** The bordered closing section. Optional; absent means no section. */
  reflection: z.string().optional(),
})

export const noteSchema = z.object({
  title: z.string().min(1),
  date: isoDate,
  /** Right-hand column on the Work list: `system design`, `payments`. */
  category: z.string().min(1),
  summary: z.string().optional(),
  readingTime: z.number().int().positive().optional(),
})

export type Site = z.infer<typeof siteSchema>
export type Home = z.infer<typeof homeSchema>
export type WorkPage = z.infer<typeof workPageSchema>
export type About = z.infer<typeof aboutSchema>
export type Now = z.infer<typeof nowSchema>
export type Experience = z.infer<typeof experienceSchema>
export type Project = z.infer<typeof projectSchema>
export type CaseStudy = z.infer<typeof caseStudySchema>
export type Note = z.infer<typeof noteSchema>
