import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { cache } from 'react'
import matter from 'gray-matter'
import { z } from 'zod'
import { contentRoot, loadReviews, type Review } from './load'
import { slugify } from './slug'

/**
 * The shelf — `content/rak.md`.
 *
 * One file holds every book the owner has read, is reading, or means to read,
 * grouped into "phases". It follows the same rule as the rest of `content/`:
 * the file IS the feature. Delete it and `/ulasan` falls back to the plain list
 * of written reviews; put it back and the shelf returns.
 *
 * A book is NOT a review. A review is an `.mdx` file with a date and a cover
 * and prose; a book is one line naming a title, an author and how far in the
 * owner got. Most books never get a review, and that is the normal case — the
 * shelf is the reading log, the review is the occasional essay about one entry
 * on it. The two are joined by slug, computed from the title, so attaching a
 * review to a book is done by *naming a file*, not by editing `rak.md`.
 *
 * See `docs/ADDING-CONTENT.md` for the authoring side of all of this.
 */

const FILE = 'rak.md'

const rakSchema = z.object({
  title: z.string('title wajib diisi').min(1, 'title wajib diisi'),
  /** The paragraph under the headline. A shelf with no blurb is still a shelf. */
  intro: z.string().optional(),
})

export type BookStatus = 'finished' | 'reading' | 'paused' | 'queued'

/**
 * How one book is drawn lying on the pile.
 *
 * Computed HERE, on the server, and never in the component. The variation is
 * what makes a stack read as a stack rather than a bar chart, but it has to be
 * the *same* variation on every render: derived from the book's position in the
 * file, so the server HTML and the client hydration agree and a book does not
 * jump when the page becomes interactive. `Math.random()` would be a hydration
 * mismatch; a date-seeded value would be a stale-cache mismatch.
 */
export type Spine = {
  /** Width of the spine in px — roughly how long the title is. */
  len: number
  /** Height in px — how thick the book is. */
  thick: number
  /** Tilt in degrees. Small; a pile is untidy, not collapsed. */
  rot: number
  /** Horizontal offset in px, so the stack does not read as a flush column. */
  shift: number
  /** Which of the three paper colours the spine is printed on. */
  tone: 'ink' | 'accent' | 'paper'
  /** Title size in px. */
  fs: number
  /** Title weight. */
  weight: 500 | 700
  /** Whether the title is set in caps. */
  caps: boolean
}

export type ShelfBook = {
  slug: string
  title: string
  author: string
  /** Surname alone, `et al.` when there is more than one author. */
  authorShort: string
  /** The phase heading this book sits under, verbatim. */
  phase: string
  /** Position among all books, in file order. Drives prev/next and the spine. */
  index: number
  lang: 'en' | 'id'
  status: BookStatus
  /** How far in, for `reading` / `paused`. Absent otherwise. */
  pct?: number
  spine: Spine
  /** `content/ulasan/<slug>.mdx`, when the owner has written one. */
  review: Review | null
}

export type Phase = {
  label: string
  books: ShelfBook[]
}

export type Rak = {
  title: string
  intro: string
  phases: Phase[]
  /** Every book, flattened, in file order. */
  books: ShelfBook[]
}

/**
 * Honorifics and academic suffixes, stripped before the surname is taken.
 *
 * Without this, `dr. Jiemi Ardian, Sp.KJ` yields the surname `KJ` and — because
 * of the comma in front of the degree — an `et al.` for a book with exactly one
 * author. A title is worth this much care: the spine has room for one word.
 */
const HONORIFIC = /^(dr\.|ed\.)\s+/i
const DEGREE = /,\s*(Sp\.[A-Za-z.]*|Ph\.?\s?D\.?|M\.[A-Za-z.]*|S\.[A-Za-z.]*)\.?$/i

/** `Michael Bungay Stanier` → `Stanier`; `Skelton & Pais` → `Skelton et al.` */
export function shortAuthor(author: string): string {
  const cleaned = author.replace(HONORIFIC, '').replace(DEGREE, '').trim()
  const multiple = /(,| & | et al\.)/.test(cleaned)
  const first = cleaned.split(/,| & | et al\./)[0].trim()
  const surname = first.split(/\s+/).slice(-1)[0] ?? cleaned

  return multiple ? `${surname} et al.` : surname
}

/**
 * Knuth's multiplicative hash of the book's index, as an unsigned 32-bit word.
 *
 * Different slices of the same word drive the different spine properties, so
 * one book's tilt is uncorrelated with its thickness while both stay pinned to
 * its position in the file. Moving a book changes how it is drawn; that is
 * fine, and cheaper than carrying nine numbers per line in the Markdown.
 */
function hashOf(index: number): number {
  return (index * 2654435761) >>> 0
}

function spineFor(index: number, title: string, authorShort: string): Spine {
  const h = hashOf(index)
  const pick = (shift: number, low: number, high: number) =>
    low + (((h >>> shift) >>> 0) % (high - low + 1))

  const fs = pick(9, 12, 15)
  const caps = (h >>> 13) % 3 === 2
  const weight = (h >>> 11) % 2 === 0 ? 500 : 700

  // Enough width for the title at its own size, plus the author, plus padding.
  // The title never truncates — a spine you cannot read is not a book — so the
  // width follows the text rather than the text following the width.
  const needed =
    Math.ceil(title.length * fs * (caps ? 0.78 : 0.62)) +
    authorShort.length * 6.2 +
    60

  return {
    len: Math.min(400, Math.max(needed + ((h >>> 3) % 50), 240)),
    thick: pick(7, 36, 52),
    rot: [0, -1.3, 0.9, -0.5, 1.5, 0.4][h % 6],
    shift: [-16, 10, -4, 18, 0, -10, 6][(h >>> 2) % 7],
    tone: (['ink', 'ink', 'ink', 'accent', 'paper'] as const)[(h >>> 5) % 5],
    fs,
    weight: weight as 500 | 700,
    caps,
  }
}

/**
 * A book as the shelf *draws* it: everything except the review.
 *
 * The shelf shows 125 books and reads none of their prose, so this is what
 * crosses into the client component. Handing it whole `ShelfBook`s would ship
 * every review body in the page's serialized props to render a coloured bar.
 */
export type SpineBook = Omit<ShelfBook, 'review'>

/**
 * Drops the review, leaving what the shelf needs to draw the book.
 *
 * Written out field by field rather than as a rest spread so that adding
 * something heavy to `ShelfBook` later does not silently start shipping it to
 * the browser — the type checker asks about the new field here first.
 */
export function toSpineBook(book: ShelfBook): SpineBook {
  return {
    slug: book.slug,
    title: book.title,
    author: book.author,
    authorShort: book.authorShort,
    phase: book.phase,
    index: book.index,
    lang: book.lang,
    status: book.status,
    ...(book.pct === undefined ? {} : { pct: book.pct }),
    spine: book.spine,
  }
}

/**
 * Splits the body of `rak.md` into phases and books.
 *
 * Exported for the tests. The error messages name the line number in the file
 * as the author sees it — frontmatter included — because "line 74" is only
 * useful if it is the line their editor is showing them.
 */
export function parseRak(raw: string): { phases: Phase[]; books: ShelfBook[] } {
  // Line numbers have to survive the frontmatter, so the body is sliced off by
  // hand rather than taken from gray-matter, which reports no offset.
  const frontmatter = raw.match(/^---\r?\n[\s\S]*?\r?\n---[ \t]*\r?\n?/)
  const body = frontmatter ? raw.slice(frontmatter[0].length) : raw
  const offset = frontmatter ? frontmatter[0].split('\n').length - 1 : 0

  const phases: Phase[] = []
  const books: ShelfBook[] = []
  const seen = new Map<string, number>()
  let current: Phase | null = null
  let inComment = false

  const lines = body.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const number = offset + i + 1

    if (inComment) {
      if (line.includes('-->')) inComment = false
      continue
    }
    if (line.startsWith('<!--')) {
      if (!line.includes('-->')) inComment = true
      continue
    }

    if (line.startsWith('## ')) {
      current = { label: line.slice(3).trim(), books: [] }
      phases.push(current)
      continue
    }

    if (!line.startsWith('- ')) continue

    if (!current) {
      throw new Error(
        `content/${FILE} baris ${number} — buku ini belum punya fase; tambahkan heading "## " di atasnya`
      )
    }

    const [head, ...tags] = line
      .slice(2)
      .split('·')
      .map((part) => part.trim())

    // U+2014 with a space either side. Nothing else separates the two halves,
    // so a hyphen or an en dash is a mistake worth stopping the build for
    // rather than a title that quietly swallows its author.
    if (!head.includes(' — ')) {
      throw new Error(
        `content/${FILE} baris ${number} — tidak ada " — " antara judul dan penulis: "${line}"`
      )
    }

    const [title, author] = head.split(' — ').map((part) => part.trim())

    if (!title || !author) {
      throw new Error(
        `content/${FILE} baris ${number} — judul dan penulis wajib diisi: "${line}"`
      )
    }

    let status: BookStatus = 'queued'
    let pct: number | undefined
    let lang: 'en' | 'id' = 'en'

    for (const tag of tags) {
      const word = tag.toLowerCase()
      if (word === 'id') {
        lang = 'id'
      } else if (word === 'finished') {
        status = 'finished'
      } else if (word === 'queued') {
        status = 'queued'
      } else {
        const progress = word.match(/^(reading|paused)\s*(\d+)?%?$/)
        if (!progress) {
          throw new Error(
            `content/${FILE} baris ${number} — tanda "${tag}" tidak dikenal; pakai finished, reading N%, paused N%, atau id`
          )
        }
        status = progress[1] === 'reading' ? 'reading' : 'paused'
        pct = progress[2] ? Math.min(100, Number(progress[2])) : 0
      }
    }

    const slug = slugify(title)
    const duplicate = seen.get(slug)
    if (duplicate !== undefined) {
      throw new Error(
        `content/${FILE} baris ${number} — judul "${title}" menghasilkan slug "${slug}" yang sudah dipakai di baris ${duplicate}`
      )
    }
    seen.set(slug, number)

    const authorShort = shortAuthor(author)
    const index = books.length
    const book: SpineBook = {
      slug,
      title,
      author,
      authorShort,
      phase: current.label,
      index,
      lang,
      status,
      ...(pct === undefined ? {} : { pct }),
      spine: spineFor(index, title, authorShort),
    }

    const withReview = { ...book, review: null } as ShelfBook
    current.books.push(withReview)
    books.push(withReview)
  }

  return { phases, books }
}

/**
 * The whole shelf, with any written review already attached to its book.
 *
 * Returns `null` when `content/rak.md` is absent — the caller decides what an
 * absent shelf looks like, the same way `loadSheet` leaves the fallback
 * headline to the page.
 */
export const loadRak = cache(async function loadRak(): Promise<Rak | null> {
  const file = path.join(contentRoot(), FILE)

  let raw: string
  try {
    raw = await readFile(file, 'utf8')
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null
    }
    throw error
  }

  const { data } = matter(raw)
  const parsed = rakSchema.safeParse(data)

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(`Frontmatter tidak valid di content/${FILE} — ${detail}`)
  }

  const { phases, books } = parseRak(raw)
  const reviews = new Map((await loadReviews()).map((review) => [review.slug, review]))

  for (const book of books) {
    book.review = reviews.get(book.slug) ?? null
  }

  return {
    title: parsed.data.title,
    intro: parsed.data.intro ?? '',
    phases,
    books,
  }
})

export async function loadShelfBook(slug: string): Promise<ShelfBook | null> {
  const rak = await loadRak()
  return rak?.books.find((book) => book.slug === slug) ?? null
}
