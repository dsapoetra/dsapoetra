# dsapoetra — Plan 3: Discoverability & Robustness

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the site findable and shareable — sitemap, robots, RSS, OG images, structured data — and close the test-infrastructure hazard and accessibility gaps carried forward from Plans 1 and 2.

**Architecture:** Everything here is additive and static. The discoverability surfaces are Next.js file conventions (`sitemap.ts`, `robots.ts`, `opengraph-image.tsx`) plus Route Handlers for RSS, all reading the existing content loaders. The one structural change is giving the content loader an injectable root, which removes the reason tests currently write into the live content tree.

**Tech Stack:** Next.js 16.3.2 (App Router), React 19.2.8, TypeScript strict, Tailwind v4, Zod, Vitest, `next/og`. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-25-dsapoetra-design.md` (§9 SEO, §11 accessibility)

**Prior art — read before starting:** `docs/superpowers/plans/CARRY-FORWARD.md`. It records defects found the hard way, including one this plan finally fixes properly and one approach that must NOT be retried.

## Global Constraints

- **Next.js 16.3.2.** Route `params` is a **Promise** and must be awaited.
- **Every route statically generated.** No request-time APIs in `sitemap.ts` or `robots.ts` — using one silently makes them dynamic.
- **Server Components only.** No task in this plan needs `'use client'`.
- **Copy is Bahasa Indonesia**; `<html lang="id">`.
- **Tailwind v4** — `@theme` in CSS, never a `tailwind.config.js`.
- **Design tokens, reuse only:** `bg-paper`/`text-ink`/`text-muted`/`border-rule`/`text-accent`/`bg-highlight`/`text-on-highlight`; `font-serif`/`font-sans`/`font-mono`; `max-w-prose-measure`/`max-w-verse-measure`.
- **Never write `bg-highlight text-ink`.** `--ink` inverts between themes and `--highlight` does not; that pairing measures 2.20:1 in dark mode. Text on a highlight uses `text-on-highlight`.
- **Canonical URL base is `https://dsapoetra.com`**, already set as `metadataBase`. Read it from `site.url` in `lib/site.ts`; do not hardcode it in new files.
- **`site.detail` and `site.personalName` are empty strings.** Nothing may be invented for them. Anything rendering the bio must omit rather than fabricate.
- Package manager is **npm**.

---

### Task 1: Injectable content root

The structural fix for a hazard carried through two plans: tests write fixtures into the live `content/` tree, so an interrupted run leaves files the next build publishes as real pages. Verified empirically, not hypothetical.

**Read `CARRY-FORWARD.md` first.** A filename-prefix filter was tried and reverted — it cannot work, because positive-assertion fixtures must be loadable and therefore cannot carry the filtered prefix. Do not reintroduce one.

**Files:**
- Modify: `lib/content/load.ts`
- Modify: `lib/content/sekarang.ts`
- Modify: `lib/content/load.test.ts`
- Modify: `lib/content/latest.test.ts`
- Modify: `lib/content/sekarang.test.ts`
- Modify: `vitest.config.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `contentRoot(): string` in `lib/content/load.ts`, resolving `process.env.CONTENT_ROOT` at call time with the repo's `content/` as default. All four collection loaders and `loadSekarang` route through it. Public loader signatures are unchanged.

- [ ] **Step 1: Replace the module constant with a call-time getter**

In `lib/content/load.ts`, replace the `CONTENT_ROOT` constant:

```ts
/**
 * Resolved per call, not at module load, so tests can point the loaders at a
 * temporary directory via CONTENT_ROOT. Reading it at module scope would bake
 * in whatever was set when the module was first imported, which under ESM is
 * effectively once per process.
 */
export function contentRoot(): string {
  return process.env.CONTENT_ROOT ?? path.join(process.cwd(), 'content')
}
```

Then inside `readCollection`, replace the use of the old constant:

```ts
  const absolute = path.join(contentRoot(), dir)
```

Leave the rest of `readCollection` untouched — the ENOENT-only tolerance, the throw-on-malformed behaviour, and the three-way comparator are all correct and were hard-won.

- [ ] **Step 2: Route the sekarang loader through it too**

In `lib/content/sekarang.ts`, import `contentRoot` from `./load` and replace the hardcoded path:

```ts
  const file = path.join(contentRoot(), 'sekarang.mdx')
```

- [ ] **Step 3: Point the tests at a temporary directory**

In each of `lib/content/load.test.ts`, `lib/content/latest.test.ts` and `lib/content/sekarang.test.ts`, create a unique temp directory in `beforeAll`, set `process.env.CONTENT_ROOT` to it, write the fixtures there instead of into `content/`, and remove the whole directory in `afterAll`.

Use `node:fs/promises` `mkdtemp` with `node:os` `tmpdir()` so each test file gets its own directory and they cannot collide:

```ts
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

let root: string

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'dsapoetra-'))
  process.env.CONTENT_ROOT = root
  // ...create subdirectories and fixtures under `root` as before
})

afterAll(async () => {
  delete process.env.CONTENT_ROOT
  await rm(root, { recursive: true, force: true })
})
```

Keep every existing assertion. The fixtures can keep their current `uji-` names — the name no longer matters, because they are no longer anywhere the build can see.

`sekarang.test.ts` currently asserts against the real `content/sekarang.mdx`; write an equivalent fixture into the temp root instead so it no longer depends on live content.

- [ ] **Step 4: Remove the serialisation stopgap**

In `vitest.config.ts`, delete `fileParallelism: false` and its explanatory comment. It existed only because test files shared the live `content/` directories; they no longer do.

- [ ] **Step 5: Prove the race is actually gone**

Run the suite ten times with shuffling, which is how the original flake was measured:

```bash
for i in $(seq 1 10); do npx vitest run --sequence.shuffle >/dev/null 2>&1 && echo "run $i PASS" || echo "run $i FAIL"; done
```

Expected: 10 PASS. The original flake showed 4 failures in 8 runs, so anything less than a clean sweep means this is not fixed.

- [ ] **Step 6: Prove nothing writes into `content/` any more**

```bash
git status --porcelain content/
npm test >/dev/null 2>&1
git status --porcelain content/
```

Expected: empty both times. Report the actual output.

- [ ] **Step 7: Verify and commit**

Run: `npx tsc --noEmit && npm run lint && npm run build`

```bash
git add lib/content vitest.config.ts
git commit -m "refactor: give the content loader an injectable root

Tests wrote fixtures into the live content tree, so an interrupted run
left files the next build published as real pages. Each test file now
works in its own temp directory via CONTENT_ROOT.

Removes fileParallelism: false, which existed only because test files
shared those directories."
```

---

### Task 2: Sitemap and robots

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`

**Interfaces:**
- Consumes: `loadReviews`, `loadPoems`, `loadStories`; `site` from `@/lib/site`.
- Produces: `/sitemap.xml`, `/robots.txt`.

- [ ] **Step 1: Create the sitemap**

Create `app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next'
import { loadReviews, loadPoems, loadStories } from '@/lib/content/load'
import { site } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [reviews, poems, stories] = await Promise.all([
    loadReviews(),
    loadPoems(),
    loadStories(),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: site.url, changeFrequency: 'weekly', priority: 1 },
    { url: `${site.url}/ulasan`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${site.url}/puisi`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${site.url}/cerita`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${site.url}/sekarang`, changeFrequency: 'monthly', priority: 0.4 },
  ]

  const entries: MetadataRoute.Sitemap = [
    ...reviews.map((r) => ({
      url: `${site.url}/ulasan/${r.slug}`,
      lastModified: r.date,
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    })),
    ...poems.map((p) => ({
      url: `${site.url}/puisi/${p.slug}`,
      lastModified: p.date,
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    })),
    ...stories.map((s) => ({
      url: `${site.url}/cerita/${s.slug}`,
      lastModified: s.date,
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    })),
  ]

  return [...staticRoutes, ...entries]
}
```

> Reviews carrying a `canonicalUrl` point elsewhere as canonical. They stay in the sitemap — the sitemap lists what exists on this site; the canonical tag tells crawlers which copy is authoritative. Those are different jobs.

- [ ] **Step 2: Create robots**

Create `app/robots.ts`:

```ts
import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${site.url}/sitemap.xml`,
  }
}
```

- [ ] **Step 3: Verify both are static and correct**

Run `npm run build` and confirm `/sitemap.xml` and `/robots.txt` appear in the route table as **static**, not dynamic. If either is marked dynamic, something used a request-time API — find it.

Then inspect the generated files under `.next/server/app/` and confirm every URL is absolute, uses `https://dsapoetra.com`, and that no `uji-` or `contoh-` fixture slug appears that should not. Quote the output.

- [ ] **Step 4: Commit**

```bash
git add app/sitemap.ts app/robots.ts
git commit -m "feat: add sitemap and robots"
```

---

### Task 3: RSS feeds

Next.js has no RSS file convention, so these are Route Handlers.

**Files:**
- Create: `lib/rss.ts`
- Test: `lib/rss.test.ts`
- Create: `app/rss.xml/route.ts`
- Create: `app/ulasan/rss.xml/route.ts`

**Interfaces:**
- Produces: `renderFeed(opts): string`; routes `/rss.xml` (everything) and `/ulasan/rss.xml` (reviews only).

- [ ] **Step 1: Write the failing tests**

Create `lib/rss.test.ts`. The escaping tests matter most — an unescaped ampersand or angle bracket in a title produces invalid XML, and a book title containing `&` is entirely ordinary.

```ts
import { describe, it, expect } from 'vitest'
import { renderFeed } from '@/lib/rss'

const base = {
  title: 'dsapoetra',
  description: 'Tulisan terbaru.',
  feedUrl: 'https://dsapoetra.com/rss.xml',
  siteUrl: 'https://dsapoetra.com',
}

describe('renderFeed', () => {
  it('produces a channel with the given metadata', () => {
    const xml = renderFeed({ ...base, items: [] })
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('<title>dsapoetra</title>')
    expect(xml).toContain('<link>https://dsapoetra.com</link>')
  })

  it('escapes XML-significant characters in titles', () => {
    const xml = renderFeed({
      ...base,
      items: [{ title: 'Ruang & Waktu <catatan>', url: 'https://dsapoetra.com/a', date: '2026-08-01' }],
    })
    expect(xml).toContain('Ruang &amp; Waktu &lt;catatan&gt;')
    expect(xml).not.toContain('Ruang & Waktu <catatan>')
  })

  it('escapes descriptions too', () => {
    const xml = renderFeed({
      ...base,
      items: [{ title: 'A', url: 'https://dsapoetra.com/a', date: '2026-08-01', description: 'satu & dua' }],
    })
    expect(xml).toContain('satu &amp; dua')
  })

  it('emits an RFC-822 pubDate', () => {
    const xml = renderFeed({
      ...base,
      items: [{ title: 'A', url: 'https://dsapoetra.com/a', date: '2026-08-01' }],
    })
    expect(xml).toMatch(/<pubDate>[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4}/)
  })

  it('uses the url as a stable guid', () => {
    const xml = renderFeed({
      ...base,
      items: [{ title: 'A', url: 'https://dsapoetra.com/a', date: '2026-08-01' }],
    })
    expect(xml).toContain('<guid isPermaLink="true">https://dsapoetra.com/a</guid>')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/rss`.

- [ ] **Step 3: Write the renderer**

Create `lib/rss.ts`:

```ts
export type FeedItem = {
  title: string
  url: string
  date: string
  description?: string
}

export type FeedOptions = {
  title: string
  description: string
  feedUrl: string
  siteUrl: string
  items: FeedItem[]
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function rfc822(date: string): string {
  return new Date(`${date}T00:00:00Z`).toUTCString()
}

export function renderFeed(options: FeedOptions): string {
  const items = options.items
    .map((item) => {
      const description = item.description
        ? `\n      <description>${escapeXml(item.description)}</description>`
        : ''
      return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid isPermaLink="true">${escapeXml(item.url)}</guid>
      <pubDate>${rfc822(item.date)}</pubDate>${description}
    </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(options.title)}</title>
    <description>${escapeXml(options.description)}</description>
    <link>${escapeXml(options.siteUrl)}</link>
    <language>id</language>
    <atom:link href="${escapeXml(options.feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`
}
```

> The `&` replacement must come first. Escaping `<` to `&lt;` before escaping `&` would then turn that `&` into `&amp;lt;`.

- [ ] **Step 4: Run to verify passing**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Create the combined feed route**

Create `app/rss.xml/route.ts`:

```ts
import { loadLatest } from '@/lib/content/latest'
import { renderFeed } from '@/lib/rss'
import { site } from '@/lib/site'

export const dynamic = 'force-static'

export async function GET() {
  const items = await loadLatest(50)

  const xml = renderFeed({
    title: site.name,
    description: 'Puisi, cerita pendek, dan ulasan buku.',
    feedUrl: `${site.url}/rss.xml`,
    siteUrl: site.url,
    items: items.map((item) => ({
      title: item.title,
      url: `${site.url}${item.href}`,
      date: item.date,
      description: item.blurb,
    })),
  })

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
```

- [ ] **Step 6: Create the reviews-only feed**

Create `app/ulasan/rss.xml/route.ts`, same shape but reading `loadReviews()`, titled `dsapoetra — Ulasan`, with `feedUrl` `${site.url}/ulasan/rss.xml` and each item's `description` its `excerpt`.

- [ ] **Step 7: Advertise the feeds**

In `app/layout.tsx`, add to the existing `metadata` export — do not change anything else in that file:

```ts
  alternates: {
    types: {
      'application/rss+xml': [{ url: '/rss.xml', title: 'dsapoetra' }],
    },
  },
```

- [ ] **Step 8: Verify the XML is actually valid**

Build, then check both feeds parse. A feed that looks fine and does not parse is the normal failure here:

```bash
npm run build
npx next start &
sleep 4
curl -s http://localhost:3000/rss.xml | head -20
curl -s http://localhost:3000/rss.xml | python3 -c "import sys,xml.dom.minidom; xml.dom.minidom.parseString(sys.stdin.read()); print('rss.xml: VALID XML')"
curl -s http://localhost:3000/ulasan/rss.xml | python3 -c "import sys,xml.dom.minidom; xml.dom.minidom.parseString(sys.stdin.read()); print('ulasan/rss.xml: VALID XML')"
```

Stop the server afterwards. **Do not touch port 3001** if something is running there, and never run broad process sweeps like `pkill -f next`.

Report the actual output.

- [ ] **Step 9: Commit**

```bash
git add lib/rss.ts lib/rss.test.ts app/rss.xml app/ulasan/rss.xml app/layout.tsx
git commit -m "feat: add RSS feeds for everything and for reviews"
```

---

### Task 4: Open Graph images

**Files:**
- Create: `app/opengraph-image.tsx`
- Create: `app/ulasan/[slug]/opengraph-image.tsx`

- [ ] **Step 1: Create the site-wide OG image**

Create `app/opengraph-image.tsx`. Use the site palette's hex values directly — `ImageResponse` renders outside the Tailwind pipeline, so utility classes are unavailable.

```tsx
import { ImageResponse } from 'next/og'
import { site } from '@/lib/site'

export const alt = 'dsapoetra — puisi, cerita, dan ulasan buku'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: '#f8f5ef',
          color: '#151b26',
        }}
      >
        <div
          style={{
            display: 'flex',
            background: '#ff7a59',
            color: '#151b26',
            padding: '8px 20px',
            fontSize: 28,
            letterSpacing: 4,
            alignSelf: 'flex-start',
          }}
        >
          DSAPOETRA
        </div>
        <div style={{ marginTop: 40, fontSize: 64, lineHeight: 1.15 }}>
          Puisi, cerita pendek,
          <br />
          dan ulasan buku.
        </div>
        <div style={{ marginTop: 32, fontSize: 30, color: '#5c6470' }}>
          {site.url.replace('https://', '')}
        </div>
      </div>
    ),
    size
  )
}
```

> No custom font is loaded. `ImageResponse` needs font files supplied as buffers, and fetching them at build time makes the build depend on the network. The default face is acceptable for a placeholder; loading Newsreader properly is a later refinement.

- [ ] **Step 2: Create the per-review OG image**

Create `app/ulasan/[slug]/opengraph-image.tsx`, following the same visual structure but showing the review's title and the book's title and author. It receives `params` — **and `params` is a Promise here too**:

```tsx
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const review = await loadReview(slug)
  // ...
}
```

Handle a missing review by rendering the generic card rather than throwing — a build-time throw here fails the whole build.

Export `alt` as a function is not supported; export a static `alt` string describing the card generically.

- [ ] **Step 3: Verify the images actually render**

Build, then confirm the PNGs exist and are non-trivial in size:

```bash
npm run build
find .next -name "opengraph-image*" -type f | head
```

Then start the server and fetch one, confirming a `200` and `image/png`:

```bash
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' http://localhost:3000/opengraph-image
```

A build that succeeds without producing an image means the convention is not wired correctly. Report the actual output.

- [ ] **Step 4: Commit**

```bash
git add app/opengraph-image.tsx "app/ulasan/[slug]/opengraph-image.tsx"
git commit -m "feat: add open graph images for the site and each review"
```

---

### Task 5: Structured data

**Files:**
- Create: `components/json-ld.tsx`
- Modify: `app/page.tsx`
- Modify: `app/ulasan/[slug]/page.tsx`

- [ ] **Step 1: Create the component**

Create `components/json-ld.tsx`:

```tsx
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
```

> The `<` escaping is not optional. Content is author-written, but a `<` inside any string would let the JSON break out of the `<script>` element. Escaping it as `<` is valid JSON and inert in HTML.

- [ ] **Step 2: Add `Person` to the homepage**

In `app/page.tsx`, render a `JsonLd` with a `Person` describing the site owner. Use `site.personalName || site.name` for `name`, and include `url`, `jobTitle` and `address` (Jakarta). **Do not invent any field** — if `site.detail` or `site.personalName` is empty, simply omit what depends on it.

- [ ] **Step 3: Add `Review` to review pages**

In `app/ulasan/[slug]/page.tsx`, render a `JsonLd` with schema.org `Review`, `itemReviewed` as a `Book` carrying the book's title and author, `datePublished` as the review date, and `author` as the site owner. Omit `reviewRating` — the content model has no rating and inventing one would be false structured data, which is worse than none.

- [ ] **Step 4: Verify it parses**

Build, then extract and parse the JSON-LD from the prerendered HTML:

```bash
npm run build
grep -o '<script type="application/ld+json">[^<]*</script>' .next/server/app/index.html | head -1
```

Parse the extracted JSON with `python3 -m json.tool` and confirm it is valid. Do the same for a review page. Report the output.

- [ ] **Step 5: Commit**

```bash
git add components/json-ld.tsx app/page.tsx "app/ulasan/[slug]/page.tsx"
git commit -m "feat: add Person and Review structured data"
```

---

### Task 6: Accessibility and error pages

Closes gaps flagged across both prior plans' reviews.

**Files:**
- Modify: `app/globals.css`
- Modify: `components/site-nav.tsx`
- Modify: `components/site-footer.tsx`
- Create: `app/global-error.tsx`

- [ ] **Step 1: Add a focus-ring token**

The site's keyboard focus currently relies on the browser default outline. That works today only because Tailwind v4's preflight never sets `outline: none` — one `outline-none` anywhere silently removes every focus indicator on the site.

In `app/globals.css`, add a focus token to both themes and expose it:

```css
  --focus: #b23122;   /* light: matches accent */
```
```css
    --focus: #ff8b6b; /* dark */
```
```css
  --color-focus: var(--focus);
```

Then add an explicit, global focus style so it cannot be lost:

```css
:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 3px;
}
```

- [ ] **Step 2: Make nav and footer hover use the accent**

`site-nav.tsx` and `site-footer.tsx` currently use `hover:text-ink focus-visible:text-ink`, while the spec says the accent carries interactive affordance. Change both to `hover:text-accent focus-visible:text-accent` for consistency with every other link on the site.

- [ ] **Step 3: Add a global error boundary**

Next's built-in global error page replaces the whole document, so it ships without `lang` and without a `<main>`. Create `app/global-error.tsx` in Bahasa Indonesia.

This is the one file in the plan that **must** be a Client Component — `global-error.tsx` is required to be one. Add `'use client'` here and only here. Because it replaces the document, it must render its own `<html lang="id">` and `<body>`, and it cannot use the root layout's fonts, so use inline styles with the palette's hex values.

- [ ] **Step 4: Verify focus is visible and the error page is correct**

Build, then confirm:
- The compiled CSS contains the `:focus-visible` rule and both `--focus` values (grep the built CSS chunk).
- `.next/server/app/_not-found.html` still serves the Indonesian 404 from Plan 2.
- The global error page carries `lang="id"`.

Report what you found.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css components/site-nav.tsx components/site-footer.tsx app/global-error.tsx
git commit -m "feat: add an explicit focus ring and an Indonesian global error page"
```

---

### Task 7: Content robustness

**Files:**
- Modify: `lib/content/schema.ts`
- Test: `lib/content/load.test.ts`
- Modify: `app/ulasan/[slug]/page.tsx`, `app/puisi/[slug]/page.tsx`, `app/cerita/[slug]/page.tsx`

- [ ] **Step 1: Write failing tests for calendar-invalid dates**

`isoDate` validates format only, so `2026-02-30` passes. Unquoted in YAML it is silently rolled over to `2026-03-02`; quoted it renders an invalid `<time datetime="2026-02-30">`.

Add tests asserting that a quoted `"2026-02-30"` and a quoted `"2026-13-01"` are both rejected with an error naming the file, and that a real date like `"2026-02-28"` and a leap day `"2028-02-29"` are accepted.

- [ ] **Step 2: Run to verify failure**

Run: `npm test`. Expected: the invalid-date cases fail — they currently pass validation.

- [ ] **Step 3: Add a calendar check to `isoDate`**

Extend the existing `isoDate` in `lib/content/schema.ts` with a `.refine` confirming the date round-trips — parse it as UTC and check the year, month and day come back unchanged. Keep the Bahasa Indonesia message style of the existing validators.

Do not replace the `z.preprocess` that normalises YAML `Date` objects; add to it.

- [ ] **Step 4: Run to verify passing**

Run: `npm test`. Expected: all pass.

- [ ] **Step 5: Make unknown slugs 404 statically**

Add to all three `[slug]/page.tsx` files:

```ts
export const dynamicParams = false
```

This makes any slug not returned by `generateStaticParams` a static 404 rather than a runtime render, satisfying the constraint that every content route is statically generated.

- [ ] **Step 6: Verify**

Run `npm test && npx tsc --noEmit && npm run lint && npm run build`, then start the server and confirm an unknown slug still returns 404 for each section. Report the codes.

- [ ] **Step 7: Commit**

```bash
git add lib/content/schema.ts lib/content/load.test.ts app/ulasan app/puisi app/cerita
git commit -m "feat: reject calendar-invalid dates and 404 unknown slugs statically"
```

---

## Done when

- `npm test` passes, and ten shuffled runs pass without a single failure.
- `npm test` leaves `content/` untouched — verified with `git status --porcelain content/`.
- `npm run build` succeeds; `/sitemap.xml` and `/robots.txt` are **static**, and both RSS feeds parse as valid XML.
- OG images render as real PNGs, site-wide and per review.
- The JSON-LD on the homepage and a review page both parse as valid JSON.
- `:focus-visible` produces a visible ring that does not depend on browser defaults.
- A calendar-invalid date fails the build, naming the file.
- Nothing invented appears anywhere: `site.detail` and `site.personalName` are still empty and everything depending on them is omitted.

## Declared deviations from the spec

**Spec §9 asks for "an RSS feed per section". This plan builds two feeds, not four.**

A combined `/rss.xml` covering everything, plus `/ulasan/rss.xml` for the weekly reviews —
the one section with a publishing cadence, and the one a reader would plausibly subscribe to
on its own. Dedicated `puisi` and `cerita` feeds would each carry two items and no schedule;
that is scaffolding, not a feature, and the combined feed already delivers those posts to
anyone subscribed.

Adding them later is a copy of the reviews route with a different loader. Revisit when either
section has a rhythm worth subscribing to independently.

## Deferred beyond this plan

- Swapping the review index `<img>` for `next/image` — **blocked on the owner supplying real cover artwork**; `next/image` fails the build on a missing local file.
- Loading Newsreader into the OG images as a font buffer.
- Analytics — the spec defers it until there is enough traffic to learn from.
- Pagination and tag archives — not until volume demands them.
- Revisiting the index/detail page duplication, now n=3 or n=4.

## Owner inputs still outstanding

- **`site.detail`** — one concrete, unglamorous, true detail of the writing life. The bio omits its sentence until supplied.
- **`site.personalName`** — empty fronts the handle alone.
- **Book cover images** in `public/sampul/`, and real content replacing the three `contoh-*.mdx` placeholders.
- **A replacement `app/icon.svg`** — the current one is a placeholder mark.
