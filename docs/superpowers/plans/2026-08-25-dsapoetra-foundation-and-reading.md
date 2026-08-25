# dsapoetra — Plan 1: Foundation & Reading

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the typographic foundation, the MDX content pipeline, and the two quiet reading sections — `/puisi` and `/cerita` — so the site is genuinely readable end to end.

**Architecture:** Content is MDX files on disk under `content/`, read at build time by a small typed loader that parses frontmatter with `gray-matter` and validates it with Zod so a malformed post fails the build rather than the page. Every route is a statically generated Server Component. The loader is pure and file-system-driven, which makes it the natural place for the test suite to live; the pages above it stay thin.

**Tech Stack:** Next.js 16.3.2 (App Router), React 19.2.8, TypeScript (strict), Tailwind CSS v4, MDX via `next-mdx-remote-client`, Zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-25-dsapoetra-design.md`

## Global Constraints

- **Next.js 16.3.2.** Route `params` is a **Promise** and must be awaited: `{ params }: { params: Promise<{ slug: string }> }`. This differs from older Next.js — do not destructure `params` synchronously.
- **All content routes are statically generated** via `generateStaticParams`. No client-side data fetching on first paint.
- **Server Components by default.** `'use client'` is permitted in this plan only if a task explicitly says so. No task in this plan does.
- **Copy is Bahasa Indonesia.** UI labels, nav, empty states, error text. Route segments are Indonesian: `/puisi`, `/cerita`.
- **`<html lang="id">`.**
- **Type roles:** serif (`Newsreader`) for reading; sans (`Inter`) for interface; mono (`JetBrains Mono`) for metadata only.
- **Measure:** prose 62–68ch; poetry 34–42ch.
- **Poems preserve the poet's line breaks exactly.** Never re-wrap or normalise whitespace in a poem body.
- **Dates are stored on poems for ordering but never displayed.**
- **Tailwind v4** — theme values are declared with `@theme` in CSS, not in a `tailwind.config.js`. Do not create a JS config file.
- Package manager is **npm** (repo has `package-lock.json`).

---

### Task 1: Test harness

Nothing in this plan can be test-driven until a runner exists. This task's deliverable is a working `npm test`.

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `lib/content/slug.ts`
- Test: `lib/content/slug.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `npm test` runs Vitest. `slugFromFilename(filename: string): string` — strips a `.mdx` extension and returns the bare slug.

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest@^3
```

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.ts`. The alias mirrors `tsconfig.json`'s `@/*` → repo root so tests import the same way app code does.

```ts
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
})
```

- [ ] **Step 3: Add the test script**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write the failing test**

Create `lib/content/slug.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { slugFromFilename } from '@/lib/content/slug'

describe('slugFromFilename', () => {
  it('strips the .mdx extension', () => {
    expect(slugFromFilename('hujan-di-bulan-juni.mdx')).toBe('hujan-di-bulan-juni')
  })

  it('leaves a bare slug untouched', () => {
    expect(slugFromFilename('hujan-di-bulan-juni')).toBe('hujan-di-bulan-juni')
  })

  it('only strips the final extension', () => {
    expect(slugFromFilename('bagian.1.mdx')).toBe('bagian.1')
  })
})
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/content/slug`.

- [ ] **Step 6: Write the minimal implementation**

Create `lib/content/slug.ts`:

```ts
export function slugFromFilename(filename: string): string {
  return filename.replace(/\.mdx$/, '')
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 3 tests.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts lib/content/slug.ts lib/content/slug.test.ts
git commit -m "test: add vitest harness and slug helper"
```

---

### Task 2: Design tokens, fonts, and root layout

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: CSS custom properties `--color-paper`, `--color-ink`, `--color-muted`, `--color-rule`, `--color-accent`; Tailwind utilities `font-serif`, `font-sans`, `font-mono`; measure utilities `max-w-prose-measure` (66ch) and `max-w-verse-measure` (38ch). `<html lang="id">`.

- [ ] **Step 1: Replace the font imports in the root layout**

Rewrite `app/layout.tsx` entirely. Note `lang="id"` and that the metadata is Indonesian.

```tsx
import type { Metadata } from 'next'
import { Newsreader, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const serif = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  display: 'swap',
})

const sans = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const mono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'dsapoetra',
  description: 'Puisi, cerita, dan ulasan buku.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="id"
      className={`${serif.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink font-serif">
        {children}
      </body>
    </html>
  )
}
```

> `LayoutProps<'/'>` is a Next.js 16 generated type and is already used by the existing layout. Keep it.

- [ ] **Step 2: Replace globals.css with the token system**

Rewrite `app/globals.css` entirely. Light values live on bare `:root`; dark values override under `prefers-color-scheme`.

```css
@import "tailwindcss";

:root {
  --paper: #fbfaf7;
  --ink: #1c1b19;
  --muted: #6b6862;
  --rule: #e3e0d8;
  --accent: #7a5c3e;
}

@media (prefers-color-scheme: dark) {
  :root {
    --paper: #14130f;
    --ink: #ece8e0;
    --muted: #8f8b83;
    --rule: #2c2a25;
    --accent: #c3a17a;
  }
}

@theme inline {
  --color-paper: var(--paper);
  --color-ink: var(--ink);
  --color-muted: var(--muted);
  --color-rule: var(--rule);
  --color-accent: var(--accent);

  --font-serif: var(--font-newsreader);
  --font-sans: var(--font-inter);
  --font-mono: var(--font-jetbrains);
}

@utility max-w-prose-measure {
  max-width: 66ch;
}

@utility max-w-verse-measure {
  max-width: 38ch;
}
```

> The `next/font` variables are deliberately named `--font-newsreader` /
> `--font-inter` / `--font-jetbrains`, **not** `--font-serif` / `--font-sans` /
> `--font-mono`. The latter are the Tailwind theme keys; reusing the same names
> would make `@theme` emit `--font-serif: var(--font-serif)`, a circular
> reference that silently falls back to the browser default. Do not "tidy" these
> into matching names.

- [ ] **Step 3: Verify the build compiles**

Run: `npm run build`
Expected: build succeeds. The existing `app/page.tsx` still renders; it gets replaced in Plan 2.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: add typographic tokens, fonts, and Indonesian root layout"
```

---

### Task 3: Site shell — navigation and footer

**Files:**
- Create: `components/site-nav.tsx`
- Create: `components/site-footer.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: tokens from Task 2.
- Produces: `<SiteNav />` and `<SiteFooter />`, both default-exported Server Components taking no props. Rendered by the root layout around `{children}`.

> The store link (`/toko`) is intentionally absent — it arrives in Plan 3 with the page it points at. A nav link to a 404 is worse than no link.

- [ ] **Step 1: Create the navigation**

Create `components/site-nav.tsx`:

```tsx
import Link from 'next/link'

const links = [
  { href: '/ulasan', label: 'Ulasan' },
  { href: '/puisi', label: 'Puisi' },
  { href: '/cerita', label: 'Cerita' },
]

export default function SiteNav() {
  return (
    <header className="border-b border-rule">
      <nav
        aria-label="Navigasi utama"
        className="mx-auto flex max-w-5xl items-baseline justify-between px-6 py-5"
      >
        <Link href="/" className="font-mono text-sm tracking-tight text-ink">
          dsapoetra
        </Link>
        <ul className="flex gap-6 font-sans text-sm">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-muted transition-colors hover:text-ink focus-visible:text-ink"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
```

> `/ulasan` is listed but is built in Plan 2. If Plan 2 is not yet done when this ships, temporarily remove that entry rather than linking to a 404.

- [ ] **Step 2: Create the footer**

Create `components/site-footer.tsx`:

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

> `/sekarang` is built in Plan 2. Same rule as above applies.

- [ ] **Step 3: Wire both into the root layout**

In `app/layout.tsx`, add the imports below the existing `./globals.css` import:

```tsx
import SiteNav from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'
```

Then replace the `<body>` contents:

```tsx
      <body className="min-h-full flex flex-col bg-paper text-ink font-serif">
        <SiteNav />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
```

- [ ] **Step 4: Verify the build compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add components/site-nav.tsx components/site-footer.tsx app/layout.tsx
git commit -m "feat: add site navigation and footer shell"
```

---

### Task 4: Content loader with validated frontmatter

The core of the plan. Pure, file-system-driven, and fully testable — which is why it carries the heaviest test suite.

**Files:**
- Create: `lib/content/schema.ts`
- Create: `lib/content/load.ts`
- Test: `lib/content/load.test.ts`
- Create: `content/puisi/.gitkeep`
- Create: `content/cerita/.gitkeep`

**Interfaces:**
- Consumes: `slugFromFilename` from Task 1.
- Produces:
  - `poemSchema`, `storySchema` (Zod schemas)
  - `type Poem = { slug: string; title: string; date: string; body: string }`
  - `type Story = { slug: string; title: string; date: string; excerpt: string; body: string }`
  - `loadPoems(): Promise<Poem[]>` — newest first
  - `loadPoem(slug: string): Promise<Poem | null>`
  - `loadStories(): Promise<Story[]>` — newest first
  - `loadStory(slug: string): Promise<Story | null>`

- [ ] **Step 1: Install dependencies**

```bash
npm install gray-matter zod
```

- [ ] **Step 2: Write the schemas**

Create `lib/content/schema.ts`:

```ts
import { z } from 'zod'

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date harus dalam format YYYY-MM-DD')

export const poemSchema = z.object({
  title: z.string().min(1, 'title wajib diisi'),
  date: isoDate,
})

export const storySchema = z.object({
  title: z.string().min(1, 'title wajib diisi'),
  date: isoDate,
  excerpt: z.string().min(1, 'excerpt wajib diisi'),
})

export type PoemFrontmatter = z.infer<typeof poemSchema>
export type StoryFrontmatter = z.infer<typeof storySchema>
```

- [ ] **Step 3: Write the failing tests**

Create `lib/content/load.test.ts`. These write real fixture files into `content/` and clean up after themselves, so the loader is exercised against the actual file system it will use in production.

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { loadPoems, loadPoem, loadStories, loadStory } from '@/lib/content/load'

const poemDir = path.join(process.cwd(), 'content/puisi')
const storyDir = path.join(process.cwd(), 'content/cerita')
const fixtures = ['__uji-satu.mdx', '__uji-dua.mdx', '__uji-rusak.mdx']

beforeAll(async () => {
  await mkdir(poemDir, { recursive: true })
  await mkdir(storyDir, { recursive: true })

  await writeFile(
    path.join(poemDir, '__uji-satu.mdx'),
    '---\ntitle: Uji Satu\ndate: 2026-01-10\n---\n\nbaris pertama\nbaris kedua\n'
  )
  await writeFile(
    path.join(poemDir, '__uji-dua.mdx'),
    '---\ntitle: Uji Dua\ndate: 2026-03-20\n---\n\nsatu baris saja\n'
  )
  await writeFile(
    path.join(storyDir, '__uji-satu.mdx'),
    '---\ntitle: Cerita Uji\ndate: 2026-02-01\nexcerpt: Ringkasan singkat.\n---\n\nIsi cerita.\n'
  )
})

afterAll(async () => {
  for (const name of fixtures) {
    await rm(path.join(poemDir, name), { force: true })
    await rm(path.join(storyDir, name), { force: true })
  }
})

describe('loadPoems', () => {
  it('returns poems sorted newest first', async () => {
    const poems = await loadPoems()
    const slugs = poems.map((p) => p.slug)
    expect(slugs.indexOf('__uji-dua')).toBeLessThan(slugs.indexOf('__uji-satu'))
  })

  it('derives the slug from the filename', async () => {
    const poems = await loadPoems()
    expect(poems.some((p) => p.slug === '__uji-satu')).toBe(true)
  })

  it('preserves the poet line breaks in the body', async () => {
    const poem = await loadPoem('__uji-satu')
    expect(poem?.body).toContain('baris pertama\nbaris kedua')
  })
})

describe('loadPoem', () => {
  it('returns null for an unknown slug', async () => {
    expect(await loadPoem('tidak-ada')).toBeNull()
  })
})

describe('loadStories', () => {
  it('carries the excerpt through', async () => {
    const stories = await loadStories()
    const story = stories.find((s) => s.slug === '__uji-satu')
    expect(story?.excerpt).toBe('Ringkasan singkat.')
  })
})

describe('loadStory', () => {
  it('returns null for an unknown slug', async () => {
    expect(await loadStory('tidak-ada')).toBeNull()
  })
})

describe('validation', () => {
  it('throws a helpful error when frontmatter is invalid', async () => {
    await writeFile(
      path.join(poemDir, '__uji-rusak.mdx'),
      '---\ntitle: Tanpa Tanggal\n---\n\nisi\n'
    )
    await expect(loadPoems()).rejects.toThrow('__uji-rusak.mdx')
    await rm(path.join(poemDir, '__uji-rusak.mdx'), { force: true })
  })
})
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/content/load`.

- [ ] **Step 5: Write the loader**

Create `lib/content/load.ts`:

```ts
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { z } from 'zod'
import { slugFromFilename } from './slug'
import { poemSchema, storySchema } from './schema'

const CONTENT_ROOT = path.join(process.cwd(), 'content')

export type Poem = {
  slug: string
  title: string
  date: string
  body: string
}

export type Story = {
  slug: string
  title: string
  date: string
  excerpt: string
  body: string
}

async function readCollection<T extends { date: string }>(
  dir: string,
  schema: z.ZodType<T>
): Promise<Array<T & { slug: string; body: string }>> {
  const absolute = path.join(CONTENT_ROOT, dir)

  let filenames: string[]
  try {
    filenames = await readdir(absolute)
  } catch {
    return []
  }

  const entries = await Promise.all(
    filenames
      .filter((name) => name.endsWith('.mdx'))
      .map(async (name) => {
        const raw = await readFile(path.join(absolute, name), 'utf8')
        const { data, content } = matter(raw)
        const parsed = schema.safeParse(data)

        if (!parsed.success) {
          const detail = parsed.error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('; ')
          throw new Error(`Frontmatter tidak valid di ${dir}/${name} — ${detail}`)
        }

        return {
          ...parsed.data,
          slug: slugFromFilename(name),
          body: content.trim(),
        }
      })
  )

  return entries.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export async function loadPoems(): Promise<Poem[]> {
  return readCollection('puisi', poemSchema)
}

export async function loadPoem(slug: string): Promise<Poem | null> {
  const poems = await loadPoems()
  return poems.find((poem) => poem.slug === slug) ?? null
}

export async function loadStories(): Promise<Story[]> {
  return readCollection('cerita', storySchema)
}

export async function loadStory(slug: string): Promise<Story | null> {
  const stories = await loadStories()
  return stories.find((story) => story.slug === slug) ?? null
}
```

> `readCollection` returns `[]` for a missing directory so the site builds before any content exists, but throws on a *malformed* file so a typo can never ship silently.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — all suites green.

- [ ] **Step 7: Create the content directories**

```bash
mkdir -p content/puisi content/cerita
touch content/puisi/.gitkeep content/cerita/.gitkeep
```

- [ ] **Step 8: Commit**

```bash
git add lib/content/schema.ts lib/content/load.ts lib/content/load.test.ts content package.json package-lock.json
git commit -m "feat: add MDX content loader with validated frontmatter"
```

---

### Task 5: MDX rendering component

**Files:**
- Create: `components/mdx-content.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `<MdxContent source={string} />` — a default-exported async Server Component that compiles an MDX string and renders it with the site's prose styling.

- [ ] **Step 1: Install the MDX renderer**

```bash
npm install next-mdx-remote-client
```

- [ ] **Step 2: Create the component**

Create `components/mdx-content.tsx`:

```tsx
import { MDXRemote } from 'next-mdx-remote-client/rsc'

const components = {
  h2: (props: React.ComponentProps<'h2'>) => (
    <h2 className="mt-10 mb-3 font-sans text-lg font-semibold text-ink" {...props} />
  ),
  h3: (props: React.ComponentProps<'h3'>) => (
    <h3 className="mt-8 mb-2 font-sans text-base font-semibold text-ink" {...props} />
  ),
  p: (props: React.ComponentProps<'p'>) => (
    <p className="mb-5 leading-8 text-ink" {...props} />
  ),
  a: (props: React.ComponentProps<'a'>) => (
    <a className="text-accent underline underline-offset-4" {...props} />
  ),
  blockquote: (props: React.ComponentProps<'blockquote'>) => (
    <blockquote
      className="my-6 border-l-2 border-rule pl-5 text-muted italic"
      {...props}
    />
  ),
  hr: () => <hr className="my-10 border-rule" />,
}

export default function MdxContent({ source }: { source: string }) {
  return <MDXRemote source={source} components={components} />
}
```

- [ ] **Step 3: Verify the build compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add components/mdx-content.tsx package.json package-lock.json
git commit -m "feat: add MDX rendering component with prose styling"
```

---

### Task 6: `/puisi` — index and poem page

Poems are the strictest typographic case in the whole site: narrow measure, no dates, and line breaks preserved exactly as written. The body is rendered as pre-wrapped text rather than through MDX, because MDX would collapse the poet's line breaks into paragraphs.

**Files:**
- Create: `app/puisi/page.tsx`
- Create: `app/puisi/[slug]/page.tsx`
- Create: `content/puisi/contoh-puisi.mdx`

**Interfaces:**
- Consumes: `loadPoems`, `loadPoem`, `type Poem` from Task 4.
- Produces: routes `/puisi` and `/puisi/[slug]`.

- [ ] **Step 1: Add a sample poem so the route has something to render**

Create `content/puisi/contoh-puisi.mdx`:

```mdx
---
title: Contoh Puisi
date: 2026-08-01
---

Baris pertama menunggu
baris kedua yang belum datang

dan jeda ini disengaja
```

> Placeholder content, clearly named. Replace with real poems; delete this file once they exist.

- [ ] **Step 2: Create the index page**

Create `app/puisi/page.tsx`. No dates are rendered — per the spec, poems are undated in presentation.

```tsx
import Link from 'next/link'
import type { Metadata } from 'next'
import { loadPoems } from '@/lib/content/load'

export const metadata: Metadata = {
  title: 'Puisi — dsapoetra',
  description: 'Kumpulan puisi.',
}

export default async function PuisiIndex() {
  const poems = await loadPoems()

  return (
    <div className="mx-auto max-w-prose-measure px-6 py-16">
      <h1 className="font-mono text-xs uppercase tracking-widest text-muted">Puisi</h1>

      {poems.length === 0 ? (
        <p className="mt-8 text-muted">Belum ada puisi di sini.</p>
      ) : (
        <ul className="mt-8 divide-y divide-rule">
          {poems.map((poem) => (
            <li key={poem.slug}>
              <Link
                href={`/puisi/${poem.slug}`}
                className="block py-4 text-xl transition-colors hover:text-accent focus-visible:text-accent"
              >
                {poem.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create the poem page**

Create `app/puisi/[slug]/page.tsx`. Note `params` is awaited — a Next.js 16 requirement.

```tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { loadPoems, loadPoem } from '@/lib/content/load'

export async function generateStaticParams() {
  const poems = await loadPoems()
  return poems.map((poem) => ({ slug: poem.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const poem = await loadPoem(slug)
  if (!poem) return {}
  return { title: `${poem.title} — dsapoetra` }
}

export default async function PoemPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const poem = await loadPoem(slug)

  if (!poem) notFound()

  return (
    <article className="mx-auto max-w-verse-measure px-6 py-24">
      <h1 className="mb-10 text-2xl leading-snug">{poem.title}</h1>
      <div className="whitespace-pre-wrap text-lg leading-9">{poem.body}</div>
    </article>
  )
}
```

> `whitespace-pre-wrap` is what preserves the line breaks. Do not replace this with an MDX render — MDX collapses single newlines and would destroy the poem's shape.

- [ ] **Step 4: Verify the routes build and prerender**

Run: `npm run build`
Expected: build succeeds and the output lists `/puisi` plus a prerendered `/puisi/contoh-puisi`.

- [ ] **Step 5: Check it in the browser**

Run: `npm run dev`, open `http://localhost:3000/puisi`, click through to the poem.
Expected: the poem's line breaks and blank line appear exactly as written in the MDX file. No date is shown anywhere.

- [ ] **Step 6: Commit**

```bash
git add app/puisi content/puisi/contoh-puisi.mdx
git commit -m "feat: add puisi index and poem pages"
```

---

### Task 7: `/cerita` — index and story page

Stories are ordinary prose: wider measure, dated, MDX-rendered, with a reading time in the metadata line.

**Files:**
- Create: `lib/content/reading-time.ts`
- Test: `lib/content/reading-time.test.ts`
- Create: `app/cerita/page.tsx`
- Create: `app/cerita/[slug]/page.tsx`
- Create: `content/cerita/contoh-cerita.mdx`

**Interfaces:**
- Consumes: `loadStories`, `loadStory`, `type Story` from Task 4; `MdxContent` from Task 5.
- Produces: `readingTimeMinutes(text: string): number`; routes `/cerita` and `/cerita/[slug]`.

- [ ] **Step 1: Write the failing reading-time test**

Create `lib/content/reading-time.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readingTimeMinutes } from '@/lib/content/reading-time'

describe('readingTimeMinutes', () => {
  it('rounds up to at least one minute', () => {
    expect(readingTimeMinutes('satu dua tiga')).toBe(1)
  })

  it('estimates at 200 words per minute', () => {
    const text = Array.from({ length: 400 }, () => 'kata').join(' ')
    expect(readingTimeMinutes(text)).toBe(2)
  })

  it('returns one minute for empty text', () => {
    expect(readingTimeMinutes('')).toBe(1)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/content/reading-time`.

- [ ] **Step 3: Write the implementation**

Create `lib/content/reading-time.ts`:

```ts
const WORDS_PER_MINUTE = 200

export function readingTimeMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 3 tests.

- [ ] **Step 5: Add a sample story**

Create `content/cerita/contoh-cerita.mdx`:

```mdx
---
title: Contoh Cerita
date: 2026-08-10
excerpt: Sebuah cerita pendek untuk menguji tata letak.
---

Ini paragraf pembuka. Panjangnya cukup untuk melihat bagaimana lebar kolom
bekerja pada layar yang berbeda.

Ini paragraf kedua, supaya jarak antarparagraf terlihat.
```

> Placeholder content, clearly named. Delete once real stories exist.

- [ ] **Step 6: Create the index page**

Create `app/cerita/page.tsx`:

```tsx
import Link from 'next/link'
import type { Metadata } from 'next'
import { loadStories } from '@/lib/content/load'
import { readingTimeMinutes } from '@/lib/content/reading-time'

export const metadata: Metadata = {
  title: 'Cerita — dsapoetra',
  description: 'Kumpulan cerita pendek.',
}

export default async function CeritaIndex() {
  const stories = await loadStories()

  return (
    <div className="mx-auto max-w-prose-measure px-6 py-16">
      <h1 className="font-mono text-xs uppercase tracking-widest text-muted">Cerita</h1>

      {stories.length === 0 ? (
        <p className="mt-8 text-muted">Belum ada cerita di sini.</p>
      ) : (
        <ul className="mt-8 space-y-8">
          {stories.map((story) => (
            <li key={story.slug}>
              <Link href={`/cerita/${story.slug}`} className="group block">
                <h2 className="text-xl transition-colors group-hover:text-accent">
                  {story.title}
                </h2>
                <p className="mt-1 leading-7 text-muted">{story.excerpt}</p>
                <p className="mt-2 font-mono text-xs text-muted">
                  {readingTimeMinutes(story.body)} menit baca
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Create the story page**

Create `app/cerita/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { loadStories, loadStory } from '@/lib/content/load'
import { readingTimeMinutes } from '@/lib/content/reading-time'
import MdxContent from '@/components/mdx-content'

export async function generateStaticParams() {
  const stories = await loadStories()
  return stories.map((story) => ({ slug: story.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const story = await loadStory(slug)
  if (!story) return {}
  return { title: `${story.title} — dsapoetra`, description: story.excerpt }
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const story = await loadStory(slug)

  if (!story) notFound()

  return (
    <article className="mx-auto max-w-prose-measure px-6 py-20">
      <h1 className="text-3xl leading-tight">{story.title}</h1>
      <p className="mt-3 mb-12 font-mono text-xs text-muted">
        <time dateTime={story.date}>{story.date}</time>
        {' · '}
        {readingTimeMinutes(story.body)} menit baca
      </p>
      <MdxContent source={story.body} />
    </article>
  )
}
```

- [ ] **Step 8: Verify the build and run the full suite**

Run: `npm test && npm run build`
Expected: all tests pass; build succeeds and lists `/cerita` plus a prerendered `/cerita/contoh-cerita`.

- [ ] **Step 9: Check both sections in the browser**

Run: `npm run dev` and visit `/puisi`, a poem, `/cerita`, and a story.
Expected: poems are narrow with preserved line breaks and no dates; stories are wider with a date and reading time; nav and footer appear on every page; both light and dark colour schemes are legible.

- [ ] **Step 10: Commit**

```bash
git add lib/content/reading-time.ts lib/content/reading-time.test.ts app/cerita content/cerita/contoh-cerita.mdx
git commit -m "feat: add cerita index and story pages with reading time"
```

---

## Done when

- `npm test` passes.
- `npm run build` succeeds with `/puisi`, `/puisi/[slug]`, `/cerita`, and `/cerita/[slug]` prerendered.
- A malformed frontmatter file fails the build with a message naming the offending file.
- Poems render with their line breaks intact and no visible date.
- Nav and footer render on every page, in both colour schemes.

## Deferred to later plans

- `/ulasan`, the video facade, and canonical handling — Plan 2.
- `/`, `/sekarang` — Plan 2.
- `/toko`, waitlist, email provider — Plan 3.
- Sitemap, RSS, OG images, JSON-LD, analytics — Plan 3.
- The nav links to `/ulasan` and the footer link to `/sekarang` point at routes that do not exist until Plan 2. If Plan 1 is deployed alone, remove them first.
