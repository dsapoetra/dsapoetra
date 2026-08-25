# Carry-forward notes for Plans 2 and 3

Things learned while building Plan 1 that later plans must not rediscover. Each
one cost a review round or a fix round to find.

## Content schemas

**YAML silently converts unquoted dates to `Date` objects.** `gray-matter` parses
frontmatter with js-yaml, and an unquoted `date: 2026-01-10` scalar arrives as a
JavaScript `Date`, not a string. A plain `z.string().regex(...)` schema fails
against every hand-authored file.

Reuse the exported `isoDate` from `lib/content/schema.ts` for the `ulasan` and
`produk` schemas rather than writing a new date field. It already normalizes
`Date` back to `YYYY-MM-DD`, and it does so via `toISOString()` — which matters,
because js-yaml builds the date at UTC midnight and any local-time getter
(`getFullYear`/`getMonth`/`getDate`) shifts it a day backwards in every timezone
behind UTC.

**Known gap, worth closing when you touch it:** the validation is format-only, so
a calendar-invalid date passes. Unquoted `2026-02-30` is silently rolled over by
js-yaml to `2026-03-02`; quoted, it passes the regex and renders an invalid
`<time datetime="2026-02-30">`. Add a `z.refine` calendar check to `isoDate`.

## Sorting

Use a three-way comparator. The two-way form returns `-1` for equal values, which
violates the comparator contract and was verified to *reverse* same-date entries
rather than leave them alone. On a site publishing a weekly review alongside poems
and stories, same-day entries are certain, not hypothetical.

`lib/content/load.ts` already has the correct form — follow it.

## The content loader

`readCollection` tolerates only `ENOENT` and rethrows every other `readdir`
failure, so a permissions error or a renamed directory fails the build instead of
publishing an empty section. Keep that distinction when extending it: a *missing*
directory is fine, a *broken* one is not.

`loadPoems`/`loadStories` are wrapped in React's `cache`. Wrap any new collection
loader the same way — the single-item helpers call the collection loader and
filter, so without it each detail page re-reads and re-validates the whole corpus
twice.

`CONTENT_ROOT` has no injection point, so the tests write fixtures into the real
`content/` tree. Cleanup works, but an interrupted run can leave `__uji-*.mdx`
behind and the next build would publish them as real pages. Giving the loader an
injectable root would close this.

## Poems are not like everything else

The poetry pages are deliberately the inverse of the story pages in three ways.
Do not "harmonize" them:

| | Poems | Stories |
|---|---|---|
| Measure | 38ch verse | 66ch prose |
| Date | never displayed | displayed |
| Body | stanza `<p>` + `<br />`, never MDX | rendered through `MdxContent` |

Poem bodies must never pass through MDX — it collapses single newlines into
paragraphs, which destroys the line structure the poems exist for. The stanza
markup (rather than CSS `white-space` alone) is what carries that structure into
the accessibility tree.

## Page structure

The two index pages and two detail pages share roughly 25 lines of shape. At n=2
that duplication is correct and was deliberately left alone. Revisit it when
`/ulasan` makes it n=3 — that is the right moment to abstract, not before.

## Verification standard

"It builds" is not evidence that it works. `MdxContent` shipped with a green build
while being imported by no page, so the build proved only that the file compiled.
Rendering was not actually confirmed until a later task used it.

When a task produces something not yet exercised by a route, verification means
inspecting the prerendered HTML under `.next/server/app/`, not reading the source.

**Open item:** MDX rendering is still proven only by hand-inspected build output —
nothing in `npm test` would catch a renderer regression on a dependency bump. An
integration test asserting that a story's MDX body renders to real `<p>` elements
would close this.

## Before any production deploy

`app/page.tsx` is still create-next-app scaffold serving English marketing copy,
and it is the destination of the always-visible logo link in the nav — so it is
effectively the site's front door. It also references design tokens that no longer
exist (Tailwind v4 silently declines to emit them, so there is no build error).
Plan 2 replaces it. Do not deploy before then.

## Deferred, with the plan that owns them

- Focus-ring token in `@theme` — the UA focus ring is intact today only because
  Tailwind v4's preflight never emits `outline: none`. One `outline-none`
  anywhere silently breaks it.
- `description` metadata for poem pages (poems have no `excerpt`; a site-level
  fallback would beat nothing on a share card).
- `export const dynamicParams = false` on the `[slug]` routes, so unknown slugs
  404 statically rather than via a runtime render.
