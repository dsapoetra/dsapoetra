# dsapoetra — Design Spec

**Date:** 2026-08-25
**Status:** Approved for planning
**Repo:** `dimas-mart` (Next.js 16.3.2 / React 19 / Tailwind v4, App Router)

---

## 1. Context

A personal site for **dsapoetra**. The original brief was "a profile and some digital
products to sell," modelled on kotarois.me. Brainstorming changed the shape of it
substantially, and the reasoning matters more than the conclusion:

- The site's primary job is to **establish the person**, not to move units. The store is a
  quiet second act.
- **No digital products exist yet.** Shipping a populated storefront would mean shipping
  fiction. The store ships as an honest waitlist instead.
- The owner already **writes long-form** and **publishes a book review every week, on video
  and in writing**. That weekly cadence is the site's real engine — rarer and more valuable
  than any product.
- The owner also makes (or plans to make) **digital printables**. Scope narrowed these to
  reading- and writing-adjacent goods so that one coherent person sells them.

The resulting positioning: **a programmer who writes, reviews a book a week, and makes tools
for readers.**

## 2. Goals

1. A stranger arriving from a video knows who this person is within ten seconds.
2. Every form of writing — review, poem, story — is presented in the way that form deserves.
3. The weekly review is effortless to publish: one file, one commit.
4. The store exists as an honest, converting waitlist, and becomes a real store later without
   a rewrite.
5. Existing published posts move in without sacrificing the reach they already have.

## 3. Non-goals

- No cart, payments, orders, or file delivery. Checkout, when it exists, is external.
- No CMS, database, or admin UI. Content is flat files in the repo.
- No bilingual routing or language switcher. The site is Indonesian.
- No social-feed mirroring. Short-form stays on the platforms where it belongs.
- No blog comment system.

## 4. Audience

Indonesian readers and builders — peers, not clients. Most arrive from video. Copy is in
**Bahasa Indonesia** throughout, casual and unfussy. Route names are Indonesian.

## 5. Information architecture

| Route | Purpose | Presentation |
|---|---|---|
| `/` | Bio, latest review, featured writing, links, store teaser | Reading-width, restrained |
| `/ulasan` | Index of weekly book reviews | **Thumbnail grid** — visual, clickable |
| `/ulasan/[slug]` | One book: video on top, written review below | Video facade + prose |
| `/puisi` | Poem index | Quiet list, titles only |
| `/puisi/[slug]` | A single poem | Narrow measure, undated, generous space |
| `/cerita` | Short story index | List with excerpt + reading time |
| `/cerita/[slug]` | A single story | Immersive single column |
| `/sekarang` | Novel progress, currently reading, what's being made | Short, dated, hand-maintained |
| `/toko` | Waitlist for named products | Visual cards + email capture |

**Primary nav:** `ulasan · puisi · cerita · toko`
**Secondary (footer):** `sekarang`, social links, RSS.

`/` is the only page that mixes registers; every other page commits to one.

## 6. Design direction

**"Satu situs, dua nafas."** A literary base, with visual treatment only where it earns its
place. One aesthetic forced across poetry *and* video thumbnails would fail both.

### Type

| Role | Family | Usage |
|---|---|---|
| Reading | Serif (`Newsreader` or similar literary serif) | Poems, stories, review prose, bio |
| Interface | Sans (`Inter`) | Nav, buttons, labels, product cards |
| Metadata | Mono (`JetBrains Mono`) | Dates, tags, reading time, section eyebrows |

Loaded via `next/font/google`, self-hosted at build, `display: swap`. The mono is the only
place the programmer half shows in the aesthetic — everywhere else it shows in the craft.

### Measure and rhythm

- Prose: **62–68ch**.
- Poetry: **34–42ch**, wider line-height, `white-space: pre-wrap` to preserve the poet's line
  breaks exactly as written. Poems are never re-wrapped by the layout.
- Vertical rhythm on a 4px base scale.

### Colour

Near-monochrome, warm paper tone rather than pure white. Light and dark themes, both defined
explicitly as CSS custom properties in `globals.css` under Tailwind v4's `@theme`. Dark mode
follows `prefers-color-scheme` with no toggle in v1.

Accent colour is used sparingly and only for interactive affordance — never decoration.

### Where it gets visual

- `/ulasan` index: responsive thumbnail grid, 16:9 covers, title and book author beneath.
- `/toko`: product cards with real imagery.
- Everything else: text, space, and restraint.

## 7. Content model

MDX files under `content/`, parsed at build time. Each type has a typed frontmatter schema
validated during the build so a malformed post fails the build rather than the page.

### `content/ulasan/*.mdx`

```
title: string            # the review's title
book: { title, author }  # the book being reviewed
date: ISO date
video: { platform: 'youtube' | 'tiktok' | 'instagram', id: string }
cover: string            # path to thumbnail image
excerpt: string          # 1-2 sentences, used on the index and in metadata
canonicalUrl?: string    # original platform URL, when migrated
tags?: string[]
```

### `content/puisi/*.mdx`

```
title: string
date: ISO date           # stored for ordering, NOT displayed
```

### `content/cerita/*.mdx`

```
title: string
date: ISO date
excerpt: string
```

### `content/produk/*.mdx`

```
name: string
status: 'waitlist' | 'available'
blurb: string
images: string[]
price?: string           # only when status is 'available'
externalUrl?: string     # Gumroad / Karyakarsa / Lynk / Mayar, when available
```

The `status` field is the seam that turns the waitlist into a store. When real products
exist, they are added with `status: 'available'` and an `externalUrl`; the same page renders
buy links instead of the capture form. No rewrite, no new routes.

## 8. Video handling

Raw third-party iframes are not used. A YouTube embed can outweigh every other byte on the
page, and the audience is on Indonesian mobile connections.

Each review page renders a **facade**: the cover image, a play affordance, correct aspect
ratio, and the real embed injected only on click or keyboard activation. The facade is a
`<button>` with an accessible label naming the book, so it is reachable without a mouse.

Non-YouTube platforms fall back to a labelled link out rather than a broken embed.

## 9. Migration and SEO

Existing posts are copied in **in full**, with `canonicalUrl` in frontmatter rendering a
`<link rel="canonical">` pointing back to the original platform. The site looks substantial
from day one; the platform keeps its ranking authority; no duplicate-content penalty. Once
the domain has authority of its own, canonicals can be flipped by editing frontmatter.

Also included: per-page `metadata`, Open Graph and Twitter cards, generated OG images for
reviews, `sitemap.xml`, `robots.txt`, an RSS feed per section, and JSON-LD (`Person` on `/`,
`Review` + `Book` on review pages).

## 10. Waitlist

`/toko` names specific products in progress — it does not say "coming soon" in a grey box.
Each card states what the thing is and roughly when it lands. A single email field captures
interest.

Requirements: the submission must actually persist somewhere the owner can retrieve it; the
form must show pending, success, duplicate, and failure states; it must work without
JavaScript where reasonable (Server Action); and it must not leak the address list publicly.

**The email/storage provider is deliberately unspecified here.** It will be selected against
what is actually available and provisioned for this project, rather than assumed. That
selection is the first task of implementation, and it is the only external service the site
depends on.

## 11. Performance and accessibility

Budgets, enforced by judgement at review rather than tooling in v1:

- Static generation for every route. No client-side data fetching on first paint.
- No raw video iframes on load (see §8).
- Images through `next/image`, explicit dimensions, modern formats.
- Client JavaScript limited to: the video facade, the waitlist form, and the mobile nav.
  Everything else is a Server Component.

Accessibility: semantic landmarks, one `h1` per page, visible focus states, keyboard-operable
video facade and nav, `lang="id"` on `<html>`, and contrast that holds in both themes. Poems
preserve their line structure for screen readers as well as sighted readers.

## 12. Analytics

Minimal and privacy-respecting, no cookie banner. The site is about to test demand with a
waitlist; shipping it blind wastes the experiment. Provider chosen alongside the email
service in §10.

## 13. Content inputs required from the owner

These are values, not open design questions. The build proceeds with clearly-marked
placeholders where they are missing, and none of them block structural work.

1. **Bio facts** — city, how long they have been writing, and one small concrete detail of
   the writing life. The last one is what stops the bio reading like a résumé; it cannot be
   invented.
2. **Video platform** and approximate number of existing reviews.
3. **Name to front** — the handle `dsapoetra` or a personal name.
4. **Domain**, if one is owned.
5. **Profile photograph**, if the bio is to carry one.
6. **The existing posts** to migrate, with their original URLs for canonicals.

## 14. Out of scope for v1, by design

Cart and payments; product file delivery; comments; newsletter sending (capture only);
a `/uses` page; dark-mode toggle; search; pagination (until volume demands it); tag archives.

Each of these is additive and none require restructuring what is specified above.

## 15. Milestones

1. **Foundation** — design tokens, typography, layout shell, nav, footer, theming.
2. **Reading** — MDX pipeline, frontmatter validation, `/puisi` and `/cerita`.
3. **Reviews** — `/ulasan` grid, review page, video facade, canonical handling.
4. **Home and Sekarang** — bio, composition of latest content, links.
5. **Store** — provider selection, `/toko`, waitlist Server Action, states.
6. **Polish** — metadata, OG images, sitemap, RSS, JSON-LD, analytics, accessibility pass.

Milestones 1–4 have no external dependencies and can be built before any provider decision.
