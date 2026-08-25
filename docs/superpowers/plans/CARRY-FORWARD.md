# Carry-forward notes for Plans 2 and 3

Things learned while building Plan 1 that later plans must not rediscover. Each
one cost a review round or a fix round to find.

## Known project values

**City: Jakarta. Writing: four years.**

Both are bio facts for the Plan 2 homepage. Jakarta is worth using deliberately
rather than dropping in as a location line: the reader's default picture of
Jakarta is speed, density and commerce, which sits against a life of poetry, a
novel in progress, and a book finished every week. That friction is the hook —
it makes the person specific instead of generic. Do not smooth it away into
"a writer based in Jakarta."

Four years is long enough to state plainly and be believed, and short enough that
claiming more would ring false. Say the number.

**Domain: `dsapoetra.com`.**

Set `metadataBase: new URL('https://dsapoetra.com')` in the root layout's
`metadata` export. Without it, Next.js resolves relative Open Graph and Twitter
image URLs against `localhost`, so share cards break in production while
everything looks fine locally. Nothing in Plan 1 needs it — there are no OG
images yet — but it must land before the first one does.

It is also the base for `sitemap.xml`, `robots.txt`, and the RSS feeds in Plan 3,
and for the `Person` JSON-LD `url` on the homepage.

Note this does not by itself settle whether the site fronts the handle
`dsapoetra` or a personal name — the domain can carry the handle while the bio
and JSON-LD carry the real name, which is usually the better arrangement, since
people search for the person.

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

**This has already bitten twice, and the second time was worse.**

*First:* a leftover `__uji-*-rusak.mdx` from an interrupted run caused a confusing
burst of unrelated test failures. `readCollection` re-reads the directory on every
call and throws for the whole collection if *any* file in it is malformed, so one
stray fixture fails every test that loads that collection. If tests start failing
inexplicably, check for stray `__uji-*` files under `content/` before debugging
anything else.

*Second:* once a second test file (`latest.test.ts`) also began reading those
directories, the suite became genuinely flaky — measured at 4 failures in 8 full
runs. `load.test.ts` deliberately writes a malformed file for one assertion, and
with Vitest's default parallel workers that transient file lands mid-read for the
other file's `loadPoems()`/`loadStories()`/`loadReviews()` calls, failing assertions
that have nothing to do with it.

The stopgap in place is `fileParallelism: false` in `vitest.config.ts`, with a
comment explaining the mechanism. It is honest and costs nothing at five test files
and sub-second runs — but it is brute force, and it silently taxes every future test
file.

**The real fix is an injectable content root**, so each test file works in its own
temporary directory instead of the live `content/` tree. That removes the coupling
structurally and restores parallelism. Do this in Plan 3, before the suite grows —
the cost of the stopgap rises with every test added, and a suite that has been made
reliable by serialising it is one careless `describe.concurrent` away from being
flaky again.

### A filter was tried here. Do not try it again.

An attempt was made to have `readCollection` skip `__`-prefixed filenames, so a
leftover fixture could never be prerendered. **It does not work, and the reason is
structural rather than an implementation slip.**

The positive-assertion tests — the ones proving the loader *does* load valid files —
need their fixtures to load. So those fixtures cannot carry the filtered prefix. Strip
the prefix to keep them loadable and you also strip them out of the filter's protection.
Whatever prefix means "test-only, never publish" is exactly the prefix those tests need
in order to be test-only. The two requirements are in direct conflict, and no renaming
scheme resolves it at the loader level.

What actually shipped was a filter guarding `__uji-*`, a name nothing in the suite
produces, plus a green test proving the filter worked on that name. Verified
empirically: dropping a `uji-interrupted-leftover.mdx` into `content/puisi/` and
building published it as a real route. The filter has been reverted — an inert guard
with a passing test is worse than no guard, because it reads as protection.

**Do this instead:** leave the loader unfiltered and add a check that **fails loudly**
when fixture-named files are found in `content/` — a prebuild script, or a CI step
before the build. That converts silent publication into a visible, blocking error and
tells the truth about what is protected. Pair it with the injectable content root above,
which removes the failure mode entirely.

## React `cache()` does nothing in tests

`loadPoems`, `loadStories` and `loadReviews` are wrapped in React's `cache()`. That
wrapping is real and works in production, but it is **completely inert under Vitest**,
and it is worth knowing why so nobody re-derives it.

React ships two builds. The standard one — the build Node and Vitest resolve for a
plain `"react"` import — exports `cache` as a pure passthrough that simply calls the
function. The memoizing implementation exists only in the `react-server` build, behind
an export condition that only Next.js's RSC bundler activates.

Two consequences:

- **The tests do not exercise memoization at all.** Every call re-reads the directory.
  Do not write a test asserting that a loader is cached; it will fail, and the failure
  will not mean what it looks like it means.
- **The suite is not order-dependent because of `cache`.** An earlier concern held that
  the deliberate malformed-frontmatter test might poison later calls by memoizing a
  rejected promise. It cannot — there is no memoization to poison. In real RSC `cache`
  *does* memoize rejections, but that is scoped to a single request and content files
  are not mutated mid-request, so it is not a problem there either.

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
