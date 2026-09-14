# dsapoetra.com

A personal site in two wings. **Work** is payments engineering: experience,
case studies, projects, technical notes. **Writing** is short stories, poems
and reading notes. The graph paper under both is what makes them one site.

Next.js App Router, no CMS, no database, no admin login. Every page is static.

**Everything published here is a markdown file in [`content/`](content/).**
You edit a file, commit it, and it is live. You should never need to open a
`.tsx` file to publish. Start at [`content/README.md`](content/README.md).

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
```

| Command | |
|---|---|
| `npm run dev` | development server |
| `npm run build` | production build, and the content check |
| `npm start` | serve the production build |
| `npm test` | unit tests |
| `npm run lint` | eslint |

There are no environment variables and nothing to configure. `npm install &&
npm run build` is the whole deployment.

## Publishing

| To do this | Edit |
|---|---|
| Publish a poem | new file in `content/poems/` |
| Publish a short story | new file in `content/stories/` |
| Publish a reading note | new file in `content/reading/` |
| Publish a case study | new file in `content/case-studies/` |
| Publish a technical note | new file in `content/notes/` |
| Add a job or a project | new file in `content/experience/` or `content/projects/` |
| Change your name, location, footer links | `content/site.md` |
| Change a page's own words | the matching file in `content/pages/` |
| Update "what I'm up to now" | `content/pages/now.md` |

Full frontmatter reference, and the five things that will bite you, are in
[`content/README.md`](content/README.md).

**The build is the proofreader.** Every file is validated against a schema as
it is read, and a bad date or a missing title fails the build with the
filename and the field, rather than rendering a broken page. If `npm run build`
passes, the content is well-formed.

## How it fits together

```
content/          every word on the site
app/              one folder per route
components/       header, footer, markdown renderer, theme switch
lib/content/      read markdown -> validate -> typed objects
lib/nav.ts        the four nav items and which URLs each owns
lib/theme.ts      the light/dark/auto switch's shared logic
docs/DESIGN.md    what the design boards specified
```

Routes: `/`, `/work`, `/work/<case-study>`, `/notes/<note>`, `/writing`,
`/poems/<poem>`, `/stories/<story>`, `/reading/<note>`, `/about`, `/now`.

A piece lives at a short URL of its own (`/poems/ledger`, not
`/writing/poems/ledger`) because that is the better link to share. `lib/nav.ts`
is what still marks **Writing** in the nav while you read it.

### Three things worth knowing before you change the code

1. **A missing collection is an empty section; a missing page file is a broken
   build.** `readCollection` returns `[]` for a directory that is not there, so
   deleting a folder cleanly removes its section. `readDoc` throws. The two are
   different on purpose: a typo'd page filename must fail rather than render
   blank.

2. **Poems never go through the markdown renderer.** Their line and stanza
   breaks are the work itself, and markdown would collapse them. They render as
   raw text under `white-space: pre-line`.

3. **Colour comes from a token, never a literal.** Every token in
   `app/globals.css` has a dark-mode counterpart; a hex typed inline will look
   right in one theme and wrong in the other.

## Design

The site implements a Claude Design handoff. `docs/DESIGN.md` is the record of
what the boards specified: tokens, type scale, measures, layout rules and copy
rules. When `app/globals.css` and that file disagree, the file is what the
boards said.

Dark mode follows the system by default, and the chip in the header switches
between `auto`, `light` and `dark`. The choice is remembered per browser and
applied before first paint, so there is no flash of the wrong theme.
