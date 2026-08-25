# dsapoetra — Design Spec

**Date:** 2026-08-25
**Status:** Approved for planning
**Repo:** `dimas-mart` (Next.js 16.3.2 / React 19 / Tailwind v4, App Router)

---

## 1. Context

A personal site for **dsapoetra**. The original brief was "a profile and some digital
products to sell," modelled on kotarois.me. Brainstorming changed the shape of it
substantially, and the reasoning matters more than the conclusion:

- The site's primary job is to **establish the person**, not to move units.
- **No digital products exist yet**, and none are planned for v1. See §10.
- The owner **writes poetry and short stories, is working on a novel, and reviews books**.
  Publishing a review every week is the intended cadence, and that cadence — not any product
  — is the site's engine.

The resulting positioning: **a programmer in Jakarta who writes, and reviews the books he
reads.**

### Amendment, 2026-08-25 — actual scale at launch

The original spec was written believing there was an existing archive to draw on: an
established weekly review habit, long-form posts on a platform to migrate, and video reviews
with an audience. The real numbers are **two written reviews and two videos**, with the
poems and stories similarly early.

Nothing about the positioning changes. Three things about the build do, and they are recorded
in place rather than here: the homepage carries a combined stream so the site does not read as
abandoned (§5), video becomes optional and linked rather than embedded (§7, §8), and migration
is not a launch concern (§9). The store is removed outright (§10).

The honest framing: this is a site for a writer who is starting, not one with a back catalogue.
Building it as though the archive already exists would produce a lot of empty scaffolding —
pagination, filters, grids — dressed up as capability.

## 2. Goals

1. A stranger knows who this person is within ten seconds.
2. Every form of writing — review, poem, story — is presented in the way that form deserves.
3. Publishing is effortless: one file, one commit.
4. The site reads as active and deliberate from its very first handful of pieces, rather than
   as an empty frame waiting to be filled.

## 3. Non-goals

- No store, cart, payments, or product delivery of any kind. See §10.
- No CMS, database, or admin UI. Content is flat files in the repo.
- No bilingual routing or language switcher. The site is Indonesian.
- No social-feed mirroring. Short-form stays on the platforms where it belongs.
- No blog comment system.
- No server-side state, secrets, or external service dependencies.

## 4. Audience

Indonesian readers and builders — peers, not clients. Copy is in **Bahasa Indonesia**
throughout, casual and unfussy. Route names are Indonesian.

Amended 2026-08-25: the original said "most arrive from video". With two videos on Instagram —
a platform that passes almost no traffic off itself — that is not true yet. There is no
established arrival path, which is a reason to make the writing findable (§9) rather than to
optimise the site for a referrer that does not exist.

## 5. Information architecture

| Route | Purpose | Presentation |
|---|---|---|
| `/` | Bio + one combined stream of the latest writing across all three sections | Reading-width, restrained |
| `/ulasan` | Index of book reviews | List with book cover, title, author |
| `/ulasan/[slug]` | One book: written review, with video above it **when one exists** | Prose, optional video card |
| `/puisi` | Poem index | Quiet list, titles only |
| `/puisi/[slug]` | A single poem | Narrow measure, undated, generous space |
| `/cerita` | Short story index | List with excerpt + reading time |
| `/cerita/[slug]` | A single story | Immersive single column |
| `/sekarang` | Novel progress, currently reading, what's being made | Short, dated, hand-maintained |

**Primary nav:** `ulasan · puisi · cerita`
**Secondary (footer):** `sekarang`, social links, RSS.

`/` is the only page that mixes registers; every other page commits to one.

**On the homepage being a combined stream.** Amended 2026-08-25. The three sections
were separated because volume would otherwise let reviews bury the poetry. That
reasoning holds at scale and does not hold yet: the site launches with roughly two
items per section. Three sparse pages read as abandoned. The homepage therefore
carries a single merged, dated stream of everything latest, so the site reads as
active while each section is still thin. The sections stay separate — they are
correct within a year — but the homepage compensates until then.

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

Amended 2026-08-25, at the owner's direction: originally near-monochrome warm greys, briefly
yellow-and-blue, now **Midnight & Tomato** — midnight ink on warm off-white, tomato red for
links, coral highlight blocks. The brief was "playful and manly". Red is the editor's pen,
which gives a book reviewer's site an accent that means something rather than merely looking
good; the midnight ink grounds it; the coral blocks carry the playfulness.

Light and dark themes are both defined explicitly as CSS custom properties in `globals.css`
under Tailwind v4's `@theme`. Dark mode follows `prefers-color-scheme` with no toggle in v1.

**Two rules keep this readable. Both were established by measurement, not taste.**

1. **`--highlight` is only ever a background, never a foreground.** Coral as text on this
   paper is far too pale to read.

2. **Text sitting on the highlight uses `--on-highlight`, never `--ink`.** `--ink` inverts
   between themes; the highlight does not. In dark mode, light ink on coral measures
   2.20:1 — unreadable. `--on-highlight` stays dark in both themes and measures 6.72:1.
   **Never write `bg-highlight text-ink`.**

`--accent` (tomato/coral) carries every link, hover and interactive affordance, because it
has to work as text.

Do not set body text on a saturated background: it can pass contrast and still be fatiguing
across a ten-minute short story, which is the length this site is built for. The paper stays
calm; the accent does the work.

Measured contrast, light: ink/paper 15.86:1, muted/paper 5.50:1, accent/paper 5.75:1,
on-highlight/highlight 6.72:1. Dark: ink/paper 15.53:1, muted/paper 7.01:1,
accent/paper 7.90:1, on-highlight/highlight 6.72:1. All exceed WCAG AA; body text exceeds
AAA in both themes.

### Where it gets visual

- `/ulasan` index: a list anchored by **book covers** — portrait, not 16:9 — with title and
  author beside each. Amended 2026-08-25: originally specified as a video-thumbnail grid,
  which assumed every review had video. Most do not. Covers are also the better anchor for a
  reader: a shelf is legible in a way a wall of video stills is not.
- Everything else: text, space, and restraint.

## 7. Content model

MDX files under `content/`, parsed at build time. Each type has a typed frontmatter schema
validated during the build so a malformed post fails the build rather than the page.

### `content/ulasan/*.mdx`

```
title: string            # the review's title
book: { title, author }  # the book being reviewed
date: ISO date
cover: string            # path to the book cover image
excerpt: string          # 1-2 sentences, used on the index and in metadata
videoUrl?: string        # OPTIONAL. Full URL to the video, when one exists.
canonicalUrl?: string    # original platform URL, when cross-posted
tags?: string[]
```

**`videoUrl` is optional, and most reviews will not have it.** Amended 2026-08-25:
originally specified as required, on the mistaken assumption that every review was
recorded. The review page must read as complete and deliberate with no video at all —
a layout built around a video slot will look broken on the majority of pages. It is
a full URL rather than a platform/id pair because the video is linked, not embedded
(§8).

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

### No product content type

Amended 2026-08-25: `content/produk/*.mdx` and the `/toko` route are removed from the
spec entirely. See §10.

## 8. Video handling

Videos are **linked, not embedded**. Amended 2026-08-25.

The original design specified a click-to-load facade wrapping a real embed, written when
the videos were assumed to be on YouTube. They are on Instagram, where embedding is heavy,
requires the platform's own script, and frequently fails outright for Reels. A player that
sometimes refuses to appear is worse than an honest link.

A review with a `videoUrl` therefore renders a **video card**: the book cover, a play
affordance, and a label naming the platform and the book. It is an `<a>` opening the video
on its platform in a new tab — not a `<button>`, because it navigates. It must be obvious
that it leaves the site; a control that looks like an inline player and instead navigates
away is a dark pattern.

A review with no `videoUrl` renders no card and no empty slot.

If the video platform later becomes YouTube, this section is worth revisiting — a facade
embed is genuinely better there, and the `videoUrl` field already carries enough information.

## 9. SEO

Per-page `metadata`, Open Graph and Twitter cards, generated OG images for reviews,
`sitemap.xml`, `robots.txt`, an RSS feed per section, and JSON-LD (`Person` on `/`,
`Review` + `Book` on review pages).

`metadataBase` is `https://dsapoetra.com`. Without it, relative OG image URLs resolve
against `localhost` and share cards break in production while looking correct locally.

**Migration is not a launch concern.** Amended 2026-08-25: the original plan assumed an
existing archive to bring across. There are roughly two written reviews. The optional
`canonicalUrl` field remains in the schema — it costs nothing and is correct if anything is
ever cross-posted — but no migration work is scheduled.

Also included: per-page `metadata`, Open Graph and Twitter cards, generated OG images for
reviews, `sitemap.xml`, `robots.txt`, an RSS feed per section, and JSON-LD (`Person` on `/`,
`Review` + `Book` on review pages).

## 10. No store

Amended 2026-08-25, at the owner's direction. `/toko`, the waitlist, the email capture, and
the product content type are all removed from the spec.

The reasoning: the site launches with roughly two reviews, some poems, and some stories. A
waitlist asks a stranger to hand over an email address for future products from someone
whose work they have just encountered for the first time. That converts badly, and the
addresses it does collect go cold long before there is anything to sell them.

Consequence: **the site now has no external service dependency at all.** No email provider,
no database, no server-side state, no secrets. Every route is static. This is a materially
simpler and cheaper thing to run, and it removes the only part of the original design that
could break in production without anyone noticing.

Adding a store later requires a new content type and two routes. It does not require
rewriting anything specified here.

## 11. Performance and accessibility

Budgets, enforced by judgement at review rather than tooling in v1:

- Static generation for every route. No client-side data fetching on first paint.
- No third-party video embeds at all — videos are links (see §8).
- Images through `next/image`, explicit dimensions, modern formats. Book covers carry
  meaningful `alt` naming the book, not "cover image".
- Client JavaScript limited to the mobile nav, if that even needs it. Everything else is a
  Server Component. Amended 2026-08-25: the video facade and waitlist form, previously the
  two main sources of client JS, no longer exist.

Accessibility: semantic landmarks, one `h1` per page, visible focus states, keyboard-operable
nav, `lang="id"` on `<html>`, and contrast that holds in both themes. Poems preserve their
line structure for screen readers as well as sighted readers. A video card must announce that
it leaves the site.

## 12. Analytics

Deferred. Amended 2026-08-25: analytics was specified to measure a waitlist experiment that
no longer exists, and at two reviews there is not yet enough traffic for numbers to mean
anything. Revisit when there is something to learn. Keeping it out also preserves §10's
result that the site has no external dependencies.

## 13. Content inputs required from the owner

These are values, not open design questions. The build proceeds with clearly-marked
placeholders where they are missing, and none of them block structural work.

**Supplied:** city is **Jakarta**; writing for **four years**; domain is **dsapoetra.com**;
video is on **Instagram**, two videos; two written reviews.

**Still outstanding:**

1. **One small concrete detail of the writing life** — unglamorous, specific, true. This is
   what stops the bio reading like a résumé and it cannot be invented. It is the only content
   input that materially changes the homepage.
2. **Name to front** — the handle `dsapoetra` or a personal name. Default if unanswered:
   `dsapoetra` as the site identity, matching the domain, with a personal name left as an
   editable constant.
3. **Profile photograph**, if the bio is to carry one.

Jakarta is worth using deliberately rather than as a location line. The reader's default
picture of the city is speed and commerce; it sits against a life of poetry, a novel, and a
book finished every week. That friction is what makes the bio specific. Do not smooth it into
"a writer based in Jakarta".

## 14. Out of scope for v1, by design

Cart, payments, and any store; comments; newsletters; a `/uses` page; dark-mode toggle;
search; pagination (until volume demands it); tag archives; analytics; video embedding.

Each of these is additive and none require restructuring what is specified above.

## 15. Milestones

1. **Foundation** — design tokens, typography, layout shell, nav, footer, theming. *(done)*
2. **Reading** — MDX pipeline, frontmatter validation, `/puisi` and `/cerita`. *(done)*
3. **Reviews** — `/ulasan` list, review page, optional video card.
4. **Home and Sekarang** — bio, combined latest stream, links; replaces the scaffold page.
5. **Polish** — metadata, OG images, sitemap, RSS, JSON-LD, accessibility pass.

Amended 2026-08-25: the former milestone 5 (Store) is removed. No milestone has an external
dependency; the whole site is static.
