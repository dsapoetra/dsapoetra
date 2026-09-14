# Editing the site

Everything published here is a markdown file in this folder. Find the file,
edit it, commit. That is the whole process. You should never need to open a
`.tsx` file to publish.

## Where things live

| To do this | Add or edit |
|---|---|
| Publish a poem | new file in `poems/` |
| Publish a short story | new file in `stories/` |
| Publish a reading note | new file in `reading/` |
| Publish a case study | new file in `case-studies/` |
| Publish a technical note | new file in `notes/` |
| Add a job | new file in `experience/` |
| Add a project | new file in `projects/` |
| Change your name, location, or footer links | `site.md` |
| Change the homepage sentence or the two cards | `pages/home.md` |
| Change the Work page headline and intro | `pages/work.md` |
| Change the Writing page's one-line note | `pages/writing.md` |
| Rewrite the About page | `pages/about.md` |
| Update "what I'm up to now" | `pages/now.md` |

Two kinds of file live here, and the difference matters:

- **Collections** are folders of files, one per thing. Add as many as you like.
  **The filename becomes the URL**, so name it the way you want the link to
  read, and settle it before you publish. Renaming breaks every link anyone has
  shared.
- **Page copy** is a single file named after a route (`pages/now.md` → `/now`).
  It holds that page's own headline and intro. Not writing; the words the page
  is *made of*.

## Five things that will bite you

1. **Quote your dates.** `date: "2026-09-02"`, with the quotation marks.
   Unquoted, YAML turns it into a date object rather than a string and the
   build fails. This is deliberate: it fails loudly instead of sorting wrong.
2. **A thing that is not ready is absent, not empty.** Delete the file and the
   entry disappears cleanly. Delete a whole folder and its section disappears
   with it. There is no on/off switch anywhere, because the file *is* the
   switch.
3. **A poem's line breaks come straight out of the file.** Type it the way it
   should read. Poems never go through the markdown renderer, so a single line
   break stays a line break and a blank line stays a stanza gap.
4. **Reading times are computed, not written.** They come from the word count
   at 200 words a minute. Only set `readingTime:` when the count lies.
5. **No em dashes.** House style. Use a comma or a colon.

## Frontmatter, by folder

### `poems/`

```yaml
---
title: Hujan di Bintaro
date: "2026-07-19"
lang: id        # optional. `id` adds a "· ID" tag. Omit for English.
align: center   # optional. Default is left.
---
```

The body is the poem, exactly as typed.

### `stories/`

```yaml
---
title: The Night Shift at Terminal Three
date: "2026-08-14"
lang: en
readingTime: 14   # optional. Computed if absent.
dropcap: true     # optional. Big first letter.
---
```

The body is markdown prose. `dropcap` suits an opening that starts on a name
and fights one that starts on dialogue.

### `reading/`

```yaml
---
title: "Book 47 of 125: Laut Bercerita, Leila S. Chudori"
date: "2026-08-21"
lang: id
---
```

Quote a title that contains a colon, or YAML reads it as a key.

### `case-studies/`

```yaml
---
title: Strangling a live PHP payments monolith
date: "2026-08-30"
summary: One sentence. This is the card text on the Work page.
readingTime: 12   # optional
context:          # the three-cell block under the title, any keys you like
  System: ...
  Scale: ...
  My role: ...
reflection: |     # optional. Renders as "What I'd do differently".
  Free text.
---
```

Inside the body you can drop a diagram:

```jsx
<Diagram caption="Proxy routing between the monolith and the services" />
<Diagram src="/diagrams/routing.svg" caption="Proxy routing" />
```

Without `src` it renders a dashed placeholder captioned with what the diagram
should show. That is on purpose: an undrawn diagram stays visible as a hole in
the piece instead of quietly vanishing, so it gets drawn.

### `notes/`

```yaml
---
title: "Outbox pattern without a framework: 200 lines and a cron"
date: "2026-09-02"
category: system design    # right-hand column on the Work page
summary: ...               # optional, used for search engines
---
```

### `experience/`

Ordered by the `order:` field, lowest first. The `01-` prefix on the filename
is only there so the folder reads in the same order; it is stripped from
everything else.

```yaml
---
company: OLX Indonesia
role: Engineering Manager, Payments and Monetization
period: 2022 to now        # printed as written, not parsed
order: 1
summary: What the company does.        # optional, grey line above
scope: "Scope of ownership: ..."       # optional, grey line below
---
```

The body is the main paragraph: what *you* did.

### `projects/`

```yaml
---
name: Subscription billing engine
summary: One line.
tags: [java 21, spring boot 3, postgres]   # lowercase
order: 1
link:                                      # optional
  label: github
  href: https://github.com/...
---
```

### `pages/home.md`

The homepage sentence is two fields because the typeface switch mid-sentence
is the design: `lead` is set in sans, `leadSerif` in serif, on the same line.

### `pages/about.md`

Add `photo: /me.jpg` (a file in `public/`) and `photoAlt:` when you have one.
Until then the page renders a dashed placeholder holding the space.

## Adding a photo or a diagram

Put the file in `public/` and reference it with a leading slash:
`public/me.jpg` → `photo: /me.jpg`.
