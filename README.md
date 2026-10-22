# dsapoetra.com

A personal portfolio, half Angel and half Demon. The homepage leads with a
split hero and the latest posts from Medium (pulled from the RSS feed);
**Creation** holds experience, case studies, projects and technical notes.

Next.js App Router, no CMS, no database, no admin login. Every page is static;
the homepage re-reads the Medium feed at most once an hour.

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
| Publish a Medium post | nothing: publish on Medium, it appears within the hour |
| Publish a case study | new file in `content/case-studies/` |
| Publish a technical note | new file in `content/notes/` |
| Add a job or a project | new file in `content/experience/` or `content/projects/` |
| Change your name, location, footer links, Medium feed | `content/site.md` |
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
components/       header, footer, markdown renderer, theme switch, side card
lib/content/      read markdown -> validate -> typed objects
lib/medium.ts     read the Medium RSS feed into posts
lib/nav.ts        the nav items and which URLs each owns
lib/theme.ts      the Angel/Demon switch's shared logic
docs/DESIGN.md    tokens, theme toggle, cards, how to add content
```

Routes: `/`, `/creation`, `/creation/<case-study>`, `/notes/<note>`, `/about`,
`/now`. The old `/work` URLs and `/writing` redirect permanently
(`next.config.ts`).

A note lives at a short URL of its own (`/notes/outbox-pattern`, not
`/creation/notes/...`) because that is the better link to share. `lib/nav.ts`
is what still marks **Creation** in the nav while you read it.

### Three things worth knowing before you change the code

1. **A missing collection is an empty section; a missing page file is a broken
   build.** `readCollection` returns `[]` for a directory that is not there, so
   deleting a folder cleanly removes its section. `readDoc` throws. The two are
   different on purpose: a typo'd page filename must fail rather than render
   blank.

2. **Colour comes from a token, never a literal.** Every theme token in
   `app/globals.css` has an Angel and a Demon value; a hex typed inline will
   look right in one theme and wrong in the other.

3. **A Medium outage hides the posts, never breaks the page.** If the feed
   cannot be fetched the homepage section simply does not render.

## Design

`docs/DESIGN.md` explains the Angel/Demon tokens, the theme toggle, the card
language, and how to add a Medium post or a project.

The theme follows the system until the visitor picks a side with the
halo/horns button in the header (Angel = light, Demon = dark). The choice is
remembered per browser and applied before first paint, so there is no flash
of the wrong side.
