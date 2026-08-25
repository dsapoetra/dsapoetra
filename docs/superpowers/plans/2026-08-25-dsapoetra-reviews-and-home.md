# dsapoetra — Plan 2: Reviews & Home

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the book-review section, the `/sekarang` page, and a real homepage that replaces the create-next-app scaffold — so the site is complete and deployable.

**Architecture:** Extends the Plan 1 content pipeline with a third collection (`ulasan`) using the same loader, the same `isoDate` normalization, and the same `cache` wrapping. The homepage merges all three collections into one dated stream, because at launch each section holds only a couple of items and three sparse pages read as abandoned. No new dependencies, no external services, every route static.

**Tech Stack:** Next.js 16.3.2 (App Router), React 19.2.8, TypeScript strict, Tailwind CSS v4, MDX via `next-mdx-remote-client`, Zod, Vitest. All already installed by Plan 1.

**Spec:** `docs/superpowers/specs/2026-08-25-dsapoetra-design.md` (amended 2026-08-25 — read the amendments; several reverse earlier decisions)

**Prior art you must read before starting:** `docs/superpowers/plans/CARRY-FORWARD.md`. It records defects found the hard way in Plan 1 that this plan must not repeat.

## Global Constraints

- **Next.js 16.3.2.** Route `params` is a **Promise** and must be awaited: `const { slug } = await params`. Never destructure synchronously.
- **Every route statically generated** via `generateStaticParams`. No client-side data fetching on first paint.
- **Server Components only.** No task in this plan needs `'use client'`.
- **Copy is Bahasa Indonesia.** Route segments are Indonesian: `/ulasan`, `/sekarang`.
- **`<html lang="id">`** — already set, do not change.
- **Tailwind v4** — theme via `@theme` in CSS. Never create a `tailwind.config.js`.
- **Design tokens from Plan 1, reuse and do not reinvent:** colours `bg-paper` / `text-ink` / `text-muted` / `border-rule` / `text-accent`; fonts `font-serif` / `font-sans` / `font-mono` (mono for metadata only); measures `max-w-prose-measure` (66ch) / `max-w-verse-measure` (38ch).
- **Reuse `isoDate`** from `lib/content/schema.ts` for any new date field. YAML coerces unquoted dates to `Date` objects; a plain `z.string()` fails against every hand-authored file.
- **Wrap every new collection loader in React's `cache`**, matching `loadPoems`/`loadStories`.
- **Videos are linked, never embedded** (spec §8).
- **`videoUrl` is optional and most reviews will not have one.** A review page with no video must read as complete, not as a page missing its header.
- **Do not abstract the shared shape** of the index or detail pages yet. Plan 1 deliberately left the n=2 duplication alone; this plan makes it n=3, which is when it becomes worth revisiting — but that is a separate, later decision, not this plan's work.
- Package manager is **npm**.

---

### Task 1: Review content type

**Files:**
- Modify: `lib/content/schema.ts`
- Modify: `lib/content/load.ts`
- Test: `lib/content/load.test.ts`

**Interfaces:**
- Consumes: `isoDate`, `readCollection`, `slugFromFilename` (all existing).
- Produces:
  - `reviewSchema` (Zod)
  - `type Review = { slug, title, book: { title, author }, date, cover, excerpt, videoUrl?, canonicalUrl?, tags?, body }`
  - `loadReviews(): Promise<Review[]>` — newest first, `cache`-wrapped
  - `loadReview(slug: string): Promise<Review | null>`

- [ ] **Step 1: Export `isoDate`**

In `lib/content/schema.ts`, `isoDate` is currently a module-private const. Add `export` to it so the review schema uses the same normalization rather than a second copy:

```ts
export const isoDate = z.preprocess(
```

Leave its implementation exactly as it is. Do not write a second date validator.

- [ ] **Step 2: Add the review schema**

Append to `lib/content/schema.ts`:

```ts
export const reviewSchema = z.object({
  title: z.string().min(1, 'title wajib diisi'),
  book: z.object({
    title: z.string().min(1, 'book.title wajib diisi'),
    author: z.string().min(1, 'book.author wajib diisi'),
  }),
  date: isoDate,
  cover: z.string().min(1, 'cover wajib diisi'),
  excerpt: z.string().min(1, 'excerpt wajib diisi'),
  videoUrl: z.string().url('videoUrl harus berupa URL lengkap').optional(),
  canonicalUrl: z.string().url('canonicalUrl harus berupa URL lengkap').optional(),
  tags: z.array(z.string()).optional(),
})

export type ReviewFrontmatter = z.infer<typeof reviewSchema>
```

- [ ] **Step 3: Write the failing tests**

Append to `lib/content/load.test.ts`. Add the new fixture names to the existing `fixtures` cleanup array so `afterAll` removes them.

```ts
describe('loadReviews', () => {
  it('parses the nested book object', async () => {
    const reviews = await loadReviews()
    const review = reviews.find((r) => r.slug === '__uji-ulasan')
    expect(review?.book.title).toBe('Judul Buku Uji')
    expect(review?.book.author).toBe('Penulis Uji')
  })

  it('leaves videoUrl undefined when absent', async () => {
    const review = await loadReview('__uji-ulasan')
    expect(review?.videoUrl).toBeUndefined()
  })

  it('carries videoUrl through when present', async () => {
    const review = await loadReview('__uji-ulasan-video')
    expect(review?.videoUrl).toBe('https://www.instagram.com/reel/ABC123/')
  })

  it('rejects a videoUrl that is not a full URL', async () => {
    await writeFile(
      path.join(reviewDir, '__uji-ulasan-rusak.mdx'),
      '---\ntitle: Rusak\nbook:\n  title: B\n  author: A\ndate: 2026-05-01\ncover: /sampul/x.jpg\nexcerpt: E\nvideoUrl: bukan-url\n---\n\nisi\n'
    )
    await expect(loadReviews()).rejects.toThrow('__uji-ulasan-rusak.mdx')
    await rm(path.join(reviewDir, '__uji-ulasan-rusak.mdx'), { force: true })
  })

  it('returns null for an unknown slug', async () => {
    expect(await loadReview('tidak-ada')).toBeNull()
  })
})
```

Add to the existing `beforeAll`, and define `reviewDir` alongside the other dir constants:

```ts
const reviewDir = path.join(process.cwd(), 'content/ulasan')
```

```ts
  await mkdir(reviewDir, { recursive: true })

  await writeFile(
    path.join(reviewDir, '__uji-ulasan.mdx'),
    '---\ntitle: Ulasan Uji\nbook:\n  title: Judul Buku Uji\n  author: Penulis Uji\ndate: 2026-05-02\ncover: /sampul/uji.jpg\nexcerpt: Ringkasan ulasan.\n---\n\nIsi ulasan.\n'
  )
  await writeFile(
    path.join(reviewDir, '__uji-ulasan-video.mdx'),
    '---\ntitle: Ulasan Bervideo\nbook:\n  title: Buku Kedua\n  author: Penulis Kedua\ndate: 2026-05-03\ncover: /sampul/uji2.jpg\nexcerpt: Ada videonya.\nvideoUrl: https://www.instagram.com/reel/ABC123/\n---\n\nIsi ulasan kedua.\n'
  )
```

Import the new loaders at the top of the test file alongside the existing ones.

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `loadReviews` / `loadReview` are not exported from `@/lib/content/load`.

- [ ] **Step 5: Add the loader**

In `lib/content/load.ts`, import `reviewSchema` alongside the existing schema imports, then add:

```ts
export type Review = {
  slug: string
  title: string
  book: { title: string; author: string }
  date: string
  cover: string
  excerpt: string
  videoUrl?: string
  canonicalUrl?: string
  tags?: string[]
  body: string
}

export const loadReviews = cache(async function loadReviews(): Promise<Review[]> {
  return readCollection('ulasan', reviewSchema)
})

export async function loadReview(slug: string): Promise<Review | null> {
  const reviews = await loadReviews()
  return reviews.find((review) => review.slug === slug) ?? null
}
```

Do not modify `readCollection`, the comparator, the ENOENT handling, or the existing loaders.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — all suites green, 21 tests.

- [ ] **Step 7: Create the content directory**

```bash
mkdir -p content/ulasan && touch content/ulasan/.gitkeep
```

- [ ] **Step 8: Verify types and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both clean.

- [ ] **Step 9: Commit**

```bash
git add lib/content/schema.ts lib/content/load.ts lib/content/load.test.ts content/ulasan
git commit -m "feat: add review content type with optional video url"
```

---

### Task 2: `/ulasan` index

A list anchored by book covers. Not a grid, not paginated — there are two reviews.

**Files:**
- Create: `app/ulasan/page.tsx`
- Create: `content/ulasan/contoh-ulasan.mdx`
- Create: `public/sampul/.gitkeep`

**Interfaces:**
- Consumes: `loadReviews`, `type Review` from Task 1.
- Produces: route `/ulasan`.

- [ ] **Step 1: Create the cover directory and a sample review**

```bash
mkdir -p public/sampul && touch public/sampul/.gitkeep
```

Create `content/ulasan/contoh-ulasan.mdx`:

```mdx
---
title: Membaca Ulang Sesuatu yang Sudah Lama
book:
  title: Judul Buku Contoh
  author: Nama Penulis
date: 2026-08-20
cover: /sampul/contoh.jpg
excerpt: Catatan singkat tentang buku ini dan kenapa ia bertahan di kepala.
---

Paragraf pembuka ulasan. Cukup panjang untuk melihat bagaimana lebar kolom
bekerja pada halaman ulasan.

Paragraf kedua, supaya jarak antarparagraf terlihat.
```

> Placeholder content, clearly named. Delete it once real reviews exist. Note it has **no `videoUrl`** — that is the common case and this sample deliberately exercises it.

- [ ] **Step 2: Handle the missing cover image**

The sample references `/sampul/contoh.jpg`, which does not exist. `next/image` on a missing local file fails the build, which would block this task on artwork that is not yours to invent.

Use a plain `<img>` here rather than `next/image`, with explicit `width`/`height` attributes to reserve layout space:

```tsx
<img
  src={review.cover}
  alt={`Sampul ${review.book.title}`}
  width={80}
  height={120}
  className="h-[120px] w-[80px] shrink-0 rounded-sm border border-rule object-cover"
/>
```

A missing image renders as a broken-image box in dev without failing the build, and the layout still holds because the dimensions are fixed. Swap to `next/image` in the polish plan once real covers exist.

The `alt` names the book. Never `"cover image"`.

- [ ] **Step 3: Create the index page**

Create `app/ulasan/page.tsx`:

```tsx
import Link from 'next/link'
import type { Metadata } from 'next'
import { loadReviews } from '@/lib/content/load'

export const metadata: Metadata = {
  title: 'Ulasan — dsapoetra',
  description: 'Catatan tentang buku-buku yang saya baca.',
}

export default async function UlasanIndex() {
  const reviews = await loadReviews()

  return (
    <div className="mx-auto max-w-prose-measure px-6 py-16">
      <h1 className="font-mono text-xs uppercase tracking-widest text-muted">Ulasan</h1>

      {reviews.length === 0 ? (
        <p className="mt-8 text-muted">Belum ada ulasan di sini.</p>
      ) : (
        <ul className="mt-8 space-y-10">
          {reviews.map((review) => (
            <li key={review.slug}>
              <Link href={`/ulasan/${review.slug}`} className="group flex gap-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={review.cover}
                  alt={`Sampul ${review.book.title}`}
                  width={80}
                  height={120}
                  className="h-[120px] w-[80px] shrink-0 rounded-sm border border-rule object-cover"
                />
                <div>
                  <h2 className="text-xl leading-snug transition-colors group-hover:text-accent group-focus-visible:text-accent">
                    {review.title}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {review.book.title} · {review.book.author}
                  </p>
                  <p className="mt-2 leading-7 text-muted">{review.excerpt}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

> `group-focus-visible:` is present deliberately — Plan 1 shipped an index page missing it and it came back as a review finding. Both index pages must give keyboard users the same affordance as mouse users.

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: succeeds, output lists `/ulasan`.

- [ ] **Step 5: Commit**

```bash
git add app/ulasan/page.tsx content/ulasan/contoh-ulasan.mdx public/sampul
git commit -m "feat: add ulasan index anchored by book covers"
```

---

### Task 3: `/ulasan/[slug]` — review page with optional video card

**Files:**
- Create: `app/ulasan/[slug]/page.tsx`
- Create: `components/video-card.tsx`

**Interfaces:**
- Consumes: `loadReviews`, `loadReview`, `type Review` (Task 1); `MdxContent` (Plan 1); `readingTimeMinutes` (Plan 1).
- Produces: route `/ulasan/[slug]`; `<VideoCard url={string} bookTitle={string} />` default export.

- [ ] **Step 1: Create the video card**

Create `components/video-card.tsx`. This is an `<a>`, not a `<button>` — it navigates away, and dressing a navigation up as an inline player is a dark pattern.

```tsx
function platformName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (host.includes('instagram')) return 'Instagram'
    if (host.includes('youtube') || host.includes('youtu.be')) return 'YouTube'
    if (host.includes('tiktok')) return 'TikTok'
    return host
  } catch {
    return 'video'
  }
}

export default function VideoCard({
  url,
  bookTitle,
}: {
  url: string
  bookTitle: string
}) {
  const platform = platformName(url)

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group mb-12 flex items-center gap-4 rounded-sm border border-rule px-5 py-4 transition-colors hover:border-accent focus-visible:border-accent"
    >
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rule text-accent"
      >
        ▶
      </span>
      <span className="font-sans text-sm leading-6">
        <span className="block text-ink transition-colors group-hover:text-accent">
          Tonton ulasan {bookTitle} di {platform}
        </span>
        <span className="block font-mono text-xs text-muted">
          Membuka {platform} di tab baru
        </span>
      </span>
    </a>
  )
}
```

> The second line is not decoration. It tells the reader the link leaves the site, which the spec requires and which a screen-reader user gets no other warning about.

- [ ] **Step 2: Create the review page**

Create `app/ulasan/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { loadReviews, loadReview } from '@/lib/content/load'
import { readingTimeMinutes } from '@/lib/content/reading-time'
import MdxContent from '@/components/mdx-content'
import VideoCard from '@/components/video-card'

export async function generateStaticParams() {
  const reviews = await loadReviews()
  return reviews.map((review) => ({ slug: review.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const review = await loadReview(slug)
  if (!review) return {}

  return {
    title: `${review.title} — dsapoetra`,
    description: review.excerpt,
    alternates: review.canonicalUrl ? { canonical: review.canonicalUrl } : undefined,
  }
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const review = await loadReview(slug)

  if (!review) notFound()

  return (
    <article className="mx-auto max-w-prose-measure px-6 py-20">
      <h1 className="text-3xl leading-tight">{review.title}</h1>

      <p className="mt-3 font-mono text-xs text-muted">
        {review.book.title} · {review.book.author}
      </p>
      <p className="mt-1 mb-12 font-mono text-xs text-muted">
        <time dateTime={review.date}>{review.date}</time>
        {' · '}
        {readingTimeMinutes(review.body)} menit baca
      </p>

      {review.videoUrl ? (
        <VideoCard url={review.videoUrl} bookTitle={review.book.title} />
      ) : null}

      <MdxContent source={review.body} />
    </article>
  )
}
```

> When `videoUrl` is absent, nothing is rendered — no empty slot, no placeholder, no "video coming soon". The page simply is a written review, which is what most of them are.

- [ ] **Step 3: Verify both shapes render**

Run: `npm run build`

Expected: succeeds, `/ulasan/contoh-ulasan` prerendered.

Then inspect `.next/server/app/ulasan/contoh-ulasan.html` and confirm:
- The MDX body rendered as real `<p class="mb-5 leading-8 text-ink">` elements.
- There is **no** video card and no empty container where one would go.

Then temporarily add `videoUrl: https://www.instagram.com/reel/ABC123/` to `content/ulasan/contoh-ulasan.mdx`, rebuild, and confirm the card appears with the "Membuka Instagram di tab baru" text and `target="_blank" rel="noopener noreferrer"`. **Remove the line again** and rebuild before committing.

Quote both observations in your report. A green build proves neither.

- [ ] **Step 4: Commit**

```bash
git add app/ulasan components/video-card.tsx
git commit -m "feat: add review page with optional video link card"
```

---

### Task 4: Site constants and `/sekarang`

**Files:**
- Create: `lib/site.ts`
- Create: `lib/content/sekarang.ts`
- Create: `content/sekarang.mdx`
- Create: `app/sekarang/page.tsx`
- Test: `lib/content/sekarang.test.ts`

**Interfaces:**
- Produces: `site` constant object; `loadSekarang(): Promise<{ updated: string; body: string } | null>`; route `/sekarang`.

- [ ] **Step 1: Create the site constants**

Create `lib/site.ts`. This is the one place identity and bio facts live, so they are edited in a single file rather than hunted across templates.

```ts
export const site = {
  /** Site identity. Matches the domain. */
  name: 'dsapoetra',

  /**
   * Personal name, if the bio should carry one alongside the handle.
   * Leave empty to show the handle alone — nothing fake is rendered when empty.
   */
  personalName: '',

  city: 'Jakarta',
  yearsWriting: 4,
  url: 'https://dsapoetra.com',

  /**
   * ONE concrete, unglamorous, true detail about the writing life.
   * This is what stops the bio reading like a résumé.
   *
   * It is deliberately EMPTY and must be supplied by the owner — it cannot be
   * invented without making the whole bio ring false. While empty, the bio
   * renders without it rather than showing a placeholder.
   */
  detail: '',
} as const
```

- [ ] **Step 2: Write the failing test for the sekarang loader**

Create `lib/content/sekarang.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { loadSekarang } from '@/lib/content/sekarang'

describe('loadSekarang', () => {
  it('returns the updated date and body', async () => {
    const sekarang = await loadSekarang()
    expect(sekarang).not.toBeNull()
    expect(sekarang?.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(sekarang?.body.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/content/sekarang`.

- [ ] **Step 4: Create the content file**

Create `content/sekarang.mdx`:

```mdx
---
updated: 2026-08-25
---

## Sedang ditulis

Novel, masih draf awal.

## Sedang dibaca

Belum diisi.

## Sedang dikerjakan

Situs ini.
```

> Placeholder text the owner replaces. The page is hand-maintained by design.

- [ ] **Step 5: Write the loader**

Create `lib/content/sekarang.ts`. A single file, not a collection, so it does not go through `readCollection`:

```ts
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { cache } from 'react'
import matter from 'gray-matter'
import { z } from 'zod'
import { isoDate } from './schema'

const sekarangSchema = z.object({ updated: isoDate })

export type Sekarang = { updated: string; body: string }

export const loadSekarang = cache(async (): Promise<Sekarang | null> => {
  const file = path.join(process.cwd(), 'content/sekarang.mdx')

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
```

> Same ENOENT-only tolerance as the collection loader, for the same reason: a missing file is acceptable, a broken one must not ship silently.

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Create the page**

Create `app/sekarang/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { loadSekarang } from '@/lib/content/sekarang'
import MdxContent from '@/components/mdx-content'

export const metadata: Metadata = {
  title: 'Sekarang — dsapoetra',
  description: 'Apa yang sedang saya tulis, baca, dan kerjakan.',
}

export default async function SekarangPage() {
  const sekarang = await loadSekarang()

  return (
    <div className="mx-auto max-w-prose-measure px-6 py-16">
      <h1 className="font-mono text-xs uppercase tracking-widest text-muted">Sekarang</h1>

      {sekarang === null ? (
        <p className="mt-8 text-muted">Belum diisi.</p>
      ) : (
        <>
          <p className="mt-2 mb-10 font-mono text-xs text-muted">
            Diperbarui <time dateTime={sekarang.updated}>{sekarang.updated}</time>
          </p>
          <MdxContent source={sekarang.body} />
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 8: Verify and commit**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all clean, `/sekarang` prerendered.

```bash
git add lib/site.ts lib/content/sekarang.ts lib/content/sekarang.test.ts content/sekarang.mdx app/sekarang
git commit -m "feat: add site constants and sekarang page"
```

---

### Task 5: Combined stream and homepage

Replaces the create-next-app scaffold. This is the task that makes the site deployable.

**Files:**
- Create: `lib/content/latest.ts`
- Test: `lib/content/latest.test.ts`
- Modify: `app/page.tsx` (full replacement)

**Interfaces:**
- Consumes: `loadReviews`, `loadPoems`, `loadStories`; `site` from Task 4.
- Produces: `type StreamItem`; `loadLatest(limit?: number): Promise<StreamItem[]>`.

- [ ] **Step 1: Write the failing tests**

Create `lib/content/latest.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { loadLatest } from '@/lib/content/latest'

describe('loadLatest', () => {
  it('merges all three collections into one list', async () => {
    const items = await loadLatest()
    const kinds = new Set(items.map((item) => item.kind))
    expect(kinds.has('ulasan')).toBe(true)
    expect(kinds.has('puisi')).toBe(true)
    expect(kinds.has('cerita')).toBe(true)
  })

  it('sorts newest first across collections', async () => {
    const items = await loadLatest()
    const dates = items.map((item) => item.date)
    const sorted = [...dates].sort().reverse()
    expect(dates).toEqual(sorted)
  })

  it('builds a correct href for each kind', async () => {
    const items = await loadLatest()
    for (const item of items) {
      expect(item.href).toBe(`/${item.kind}/${item.slug}`)
    }
  })

  it('respects the limit', async () => {
    const items = await loadLatest(2)
    expect(items).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/content/latest`.

- [ ] **Step 3: Write the merger**

Create `lib/content/latest.ts`:

```ts
import { cache } from 'react'
import { loadReviews, loadPoems, loadStories } from './load'

export type StreamKind = 'ulasan' | 'puisi' | 'cerita'

export type StreamItem = {
  kind: StreamKind
  slug: string
  title: string
  date: string
  href: string
  blurb?: string
}

const LABELS: Record<StreamKind, string> = {
  ulasan: 'Ulasan',
  puisi: 'Puisi',
  cerita: 'Cerita',
}

export function labelFor(kind: StreamKind): string {
  return LABELS[kind]
}

export const loadLatest = cache(async function loadLatest(
  limit?: number
): Promise<StreamItem[]> {
  const [reviews, poems, stories] = await Promise.all([
    loadReviews(),
    loadPoems(),
    loadStories(),
  ])

  const items: StreamItem[] = [
    ...reviews.map((review) => ({
      kind: 'ulasan' as const,
      slug: review.slug,
      title: review.title,
      date: review.date,
      href: `/ulasan/${review.slug}`,
      blurb: review.excerpt,
    })),
    ...poems.map((poem) => ({
      kind: 'puisi' as const,
      slug: poem.slug,
      title: poem.title,
      date: poem.date,
      href: `/puisi/${poem.slug}`,
    })),
    ...stories.map((story) => ({
      kind: 'cerita' as const,
      slug: story.slug,
      title: story.title,
      date: story.date,
      href: `/cerita/${story.slug}`,
      blurb: story.excerpt,
    })),
  ]

  items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  return typeof limit === 'number' ? items.slice(0, limit) : items
})
```

> The comparator is three-way. The two-way form (`a < b ? 1 : -1`) never returns `0`, violates the comparator contract, and was verified in Plan 1 to reverse same-date entries. Merging three collections makes date ties far more likely than within one.

> Poems carry no `blurb` — they have no excerpt, and a poem's first line is not a summary.

- [ ] **Step 4: Run to verify passing**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Replace the homepage**

Replace the entire contents of `app/page.tsx`:

```tsx
import Link from 'next/link'
import type { Metadata } from 'next'
import { loadLatest, labelFor } from '@/lib/content/latest'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'dsapoetra',
  description: 'Puisi, cerita pendek, dan ulasan buku dari Jakarta.',
}

export default async function Home() {
  const items = await loadLatest(10)

  return (
    <div className="mx-auto max-w-prose-measure px-6 py-20">
      <h1 className="text-3xl leading-tight">
        {site.personalName || site.name}
      </h1>

      <div className="mt-6 space-y-4 text-lg leading-8">
        <p>
          Saya menulis puisi dan cerita pendek, sedang menggarap novel, dan
          menuliskan ulasan buku-buku yang saya baca. Sudah {site.yearsWriting} tahun
          ini, dari {site.city}.
        </p>
        {site.detail ? <p>{site.detail}</p> : null}
        <p className="text-muted">
          Sehari-hari saya membangun perangkat lunak. Menulis yang membuat sisanya
          masuk akal.
        </p>
      </div>

      <h2 className="mt-16 font-mono text-xs uppercase tracking-widest text-muted">
        Terbaru
      </h2>

      {items.length === 0 ? (
        <p className="mt-8 text-muted">Belum ada tulisan.</p>
      ) : (
        <ul className="mt-8 space-y-8">
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="group block">
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  {labelFor(item.kind)}
                  {' · '}
                  <time dateTime={item.date}>{item.date}</time>
                </p>
                <h3 className="mt-1 text-xl leading-snug transition-colors group-hover:text-accent group-focus-visible:text-accent">
                  {item.title}
                </h3>
                {item.blurb ? (
                  <p className="mt-1 leading-7 text-muted">{item.blurb}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

> `site.detail` renders only when supplied. Nothing invented ships. When the owner fills it in, one sentence appears in the bio and no template changes.

> The bio deliberately puts Jakarta and the writing together. Do not soften this into a location line.

- [ ] **Step 6: Verify**

Run: `npm test && npx tsc --noEmit && npm run build`

Then inspect `.next/server/app/index.html` and confirm: all three content kinds appear in the stream, the dates are in descending order, and **no placeholder or lorem text is present**. Quote the stream markup in your report.

- [ ] **Step 7: Commit**

```bash
git add lib/content/latest.ts lib/content/latest.test.ts app/page.tsx
git commit -m "feat: replace scaffold homepage with bio and combined latest stream"
```

---

### Task 6: Restore navigation links and set metadataBase

The final wiring. Plan 1 deliberately omitted links to routes that did not exist yet; they exist now.

**Files:**
- Modify: `components/site-nav.tsx`
- Modify: `components/site-footer.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Add `/ulasan` to the nav**

In `components/site-nav.tsx`, add to the `links` array, as the FIRST entry:

```ts
  { href: '/ulasan', label: 'Ulasan' },
```

Final order: Ulasan, Puisi, Cerita.

- [ ] **Step 2: Restore the footer link**

In `components/site-footer.tsx`, re-add the `Link` import and the `/sekarang` link, restoring the two-item layout:

```tsx
import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 font-mono text-xs text-muted sm:flex-row sm:justify-between">
        <p>dsapoetra</p>
        <Link href="/sekarang" className="hover:text-ink focus-visible:text-ink">
          Sekarang
        </Link>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Set `metadataBase`**

In `app/layout.tsx`, add `metadataBase` to the existing `metadata` export:

```tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://dsapoetra.com'),
  title: 'dsapoetra',
  description: 'Puisi, cerita pendek, dan ulasan buku dari Jakarta.',
}
```

> Without this, relative Open Graph image URLs resolve against `localhost`, so share cards break in production while looking correct in development. There are no OG images yet; this must be in place before the first one exists.

Change nothing else in the layout — not the fonts, not `lang="id"`, not the body classes.

- [ ] **Step 4: Verify every link resolves**

Run: `npm run build`, then `npx next start` and check each nav and footer destination returns 200:

```bash
for p in / /ulasan /puisi /cerita /sekarang; do
  printf '%s -> ' "$p"
  curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:3000$p"
done
```

Expected: `200` for all five. Stop the server afterwards.

Also confirm an unknown slug still 404s:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/ulasan/tidak-ada
```

Expected: `404`.

- [ ] **Step 5: Full suite and commit**

Run: `npm test && npx tsc --noEmit && npm run build`

```bash
git add components/site-nav.tsx components/site-footer.tsx app/layout.tsx
git commit -m "feat: link ulasan and sekarang from the shell, set metadataBase"
```

---

## Done when

- `npm test` passes.
- `npm run build` succeeds with `/`, `/ulasan`, `/ulasan/[slug]`, `/puisi`, `/puisi/[slug]`, `/cerita`, `/cerita/[slug]`, and `/sekarang` all prerendered.
- No create-next-app scaffold remains; the homepage is the real bio and stream.
- Every nav and footer link returns 200; unknown slugs return 404.
- A review with no `videoUrl` renders as a complete page with no empty video slot; one with a `videoUrl` renders a link card that says it opens a new tab.
- Poems still render with literal line breaks and no date — unchanged by this plan.
- Nothing invented appears in the bio: `site.detail` is empty and its sentence is simply absent.

## Deferred to Plan 3

- OG images, `sitemap.xml`, `robots.txt`, RSS per section, JSON-LD.
- Swapping the review index `<img>` for `next/image` once real covers exist.
- A focus-ring token in `@theme` (see CARRY-FORWARD.md).
- A calendar-validity check on `isoDate`.
- An injectable `CONTENT_ROOT` so tests stop writing into the real content tree.
- An integration test asserting MDX renders, so a dependency bump cannot silently break it.
- Revisiting the now-n=3 duplication across index and detail pages.
- `export const dynamicParams = false` on the `[slug]` routes.

## Owner inputs still outstanding

- **`site.detail`** — one concrete, unglamorous, true detail of the writing life. The bio renders without it; supplying it is a one-line edit to `lib/site.ts`.
- **`site.personalName`** — leave empty to front the handle alone.
- **Book cover images** in `public/sampul/`, and real review content to replace `contoh-ulasan.mdx`.
