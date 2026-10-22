# Design

Half Angel, half Demon. `app/globals.css` implements this file; when the two
disagree, fix one of them.

## The idea

Every page is built from two palettes, used as an organising idea rather
than a split down the middle of every screen.

- **Angel**: warm white, soft gold, pale sky. Humanist serif (Newsreader),
  round corners. The writing life.
- **Demon**: near-black, deep crimson, ember. Geometric sans (Space Grotesk),
  near-square corners. The working life.

Only the homepage hero shows both at once: a diagonal split (stacked, with a
near-horizontal seam, under 721px) with the name and tagline sitting on a
glowing gold-to-crimson seam. The visitor's chosen side colours the rest of
the site, and cards lean to one side or the other within it.

## Tokens

There are two layers.

**Side palettes** never change with the theme. The hero and the cards read
them directly.

| Angel | Demon | Used for |
|---|---|---|
| `--angel-bg` | `--demon-bg` | page |
| `--angel-card` | `--demon-card` | card surface |
| `--angel-sunk` | `--demon-sunk` | code blocks, placeholders |
| `--angel-fg` | `--demon-fg` | body text |
| `--angel-fg2` | `--demon-fg2` | secondary text |
| `--angel-fg3` | `--demon-fg3` | meta: dates, reading times |
| `--angel-acc` | `--demon-acc` | links, active nav (dark gold / ember) |
| `--angel-line` | `--demon-line` | hairlines, card borders |
| `--angel-line-hover` | `--demon-line-hover` | card border on hover |
| `--angel-glow` | `--demon-glow` | link and card glow (gold / crimson). **Never text** |
| `--angel-sky` | `--demon-ember` | decoration only |
| `--angel-grid`, `--angel-grid2` | `--demon-grid`, `--demon-grid2` | graph-paper background |

**Theme tokens** are what every other rule reads: `--bg`, `--fg`, `--fg2`,
`--fg3`, `--acc`, `--card`, `--sunk`, `--line`, `--line-hover`, `--grid`,
`--grid2`, `--glow`, plus `--halo` / `--horns` (display values for the toggle
icon). They point at one side:

- `:root` and `.side-angel` map them to Angel.
- `:root[data-theme="dark"]`, `.side-demon`, and `prefers-color-scheme: dark`
  (when no side has been picked) map them to Demon.

So `.side-angel` / `.side-demon` on any element puts that element on a side
whatever the page theme. That is how the cards work.

Rules:

- Colour comes from a token, never a literal.
- Text tokens (`fg`, `fg2`, `fg3`, `acc`) must be at least 4.5:1 against
  `bg`, `card` and `sunk` of their own side. `lib/contrast.test.ts` reads the
  hexes out of `globals.css` and fails `npm test` if one is not.

## Type

Two families, self-hosted by `next/font` in `app/layout.tsx`.

| Face | Variable | Where |
|---|---|---|
| Newsreader 400/500/600 + italic | `--serif` | Angel: Writing wing, hero name, Angel card titles |
| Space Grotesk 400 to 700 | `--sans` | Demon: Work wing, nav, all meta, Demon card titles |

`--mono` is an alias for `--sans`, kept so older rules for values (dates,
tags) still have a name to point at.

## Theme toggle

`components/theme-toggle.tsx`, in the header. A round button with a head
that wears a halo on the Angel side and horns on the Demon side.

- Values are stored under the CSS names: `light` = Angel, `dark` = Demon, in
  localStorage key `dsapoetra-theme` (`lib/theme.ts`).
- **Nothing stored** means the visitor has not picked a side. No
  `data-theme` is set and `prefers-color-scheme` decides, live.
- A click sets `data-theme` on `<html>` to the other side and stores it.
  That attribute is the only thing that changes; the tokens do the rest.
- `THEME_BOOT_SCRIPT` runs before first paint and applies a stored choice, so
  there is no flash of the wrong side.
- The icon is picked by CSS (`--halo` / `--horns`), so it is right before
  hydration too. The accessible name says the current side and the next one.

## Cards

`components/side-card.tsx` is the one card for Medium posts, case studies
and projects. Props: `side`, `title`, and optionally `meta`, `body`, `tags`,
`href`, `cta`.

- The link stretches over the whole card. External links (`http…`) open in a
  new tab with `rel="noopener"` and say so to screen readers.
- Hover: the card tilts 1.2° toward its side (Angel left, Demon right) and
  glows in `--glow`. The tilt only runs under
  `prefers-reduced-motion: no-preference`.
- Side: Medium posts by topic (see below); case studies and projects
  alternate.

All links glow on hover: gold on Angel, crimson on Demon.

## Motion

Three things move: the card tilt, the seam's slow breathing glow, and colour
transitions. The tilt and the seam are opt-in under
`prefers-reduced-motion: no-preference`, so they are absent, not just fast,
for anyone who asked for less motion.

## Adding content

### A Medium post

Publish it on Medium. That is all.

The homepage reads the feed in `content/site.md` (`medium:`) at build time
and re-reads it at most once an hour (`revalidate = 3600` in `app/page.tsx`),
so a new post appears within the hour with no commit or deploy.

- The feed carries only the **newest 10** posts. Older ones drop off.
- Side: a post leans **Demon** if any tag or title word starts with one of
  `DEMON_WORDS` in `lib/medium.ts` (software, java, system, architecture,
  aws, …). Everything else leans **Angel**. Tag a post `software-…` to push
  it Demon; edit `DEMON_WORDS` to change the rule.
- Excerpt: the first ~220 characters of the post's prose, with headings,
  captions, quotes and code removed.
- If the feed cannot be fetched, the section is hidden rather than breaking
  the page. Remove `medium:` from `site.md` to hide it on purpose.

### A project

Add a file to `content/projects/`:

```md
---
name: Subscription billing engine
summary: Recurring billing with proration, dunning and invoice PDFs.
tags: [java 21, spring boot 3, postgres]
order: 1
link:
  label: github
  href: https://github.com/dsapoetra
---
```

`order` sets position; the card's side alternates by position. `link` is
optional, and the card reads "View on {label}".

## Layout

Measures, one per template:

| Template | Max width |
|---|---|
| Home (below the hero) | 880 |
| Work landing | 960 |
| Case study, note, About, Now | 720 |
| Writing landing | 680 |
| Poem | 640 |
| Story | 620 |

Cards: one column, two from 721px. Everything else collapses to one column
under 720px. The hero is written mobile first; the rest of the stylesheet is
desktop first with a `max-width: 720px` block at the end.

## Copy rules

- No em dashes.
- `2026-09-02` in lists; `6 September 2026` in prose and on cards; `Sep 2026`
  in the Writing lists.
- Meta separator is `·`.
- The writing wing is called **Writing**, never "personal" or "misc".
