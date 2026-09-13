# dsapoetra

A personal site for poems, short stories and book reviews, with a small shop
attached. Next.js App Router, deployed on Vercel.

**Everything published on this site is a Markdown file in [`content/`](content/).**
There is no CMS, no database and no admin login. You edit a file, commit it, and
it is live. You should never need to open a `.tsx` file to publish.

---

## Editing the content

Find what you want to change, open the file, commit. That is the whole process.

| I want to… | Edit | Guide |
|---|---|---|
| Publish a poem | new file in `content/puisi/` | [ADDING-CONTENT](docs/ADDING-CONTENT.md#a-poem--contentpuisihujan-di-bulan-junimdx) |
| Publish a short story | new file in `content/cerita/` | [ADDING-CONTENT](docs/ADDING-CONTENT.md#a-short-story--contentceritajudul-ceritamdx) |
| Publish a book review | new file in `content/ulasan/` | [ADDING-CONTENT](docs/ADDING-CONTENT.md#a-book-review--contentulasanjudul-bukumdx) |
| Sell something | new file in `content/produk/` | [ADDING-CONTENT](docs/ADDING-CONTENT.md#a-product--contentproduksunyi-hanya-anganmdx) |
| Update "what I'm up to now" | `content/sekarang.mdx` | [ADDING-CONTENT](docs/ADDING-CONTENT.md) |
| Update novel progress | `content/novel.mdx` | [ADDING-CONTENT](docs/ADDING-CONTENT.md#novel-progress--contentnovelmdx) |
| Change the words *on* a page — its headline, intro, title block | `content/tulisan.mdx` | [content/README](content/README.md) |
| Turn the shop on or off | move files in/out of `content/produk/` | [content/produk-draf/README](content/produk-draf/README.md) |
| Add the file a buyer downloads | `private/produk/` | [private/produk/README](private/produk/README.md) |

Two kinds of file live in `content/`, and the difference matters:

- **Collections** — a folder of files, one per thing (`puisi/`, `cerita/`,
  `ulasan/`, `produk/`). Add as many as you like. **The filename becomes the
  URL**, so name it the way you want the link to read, and settle it before you
  publish — renaming breaks every link anyone has shared.
- **Page copy** — one file named after a route (`tulisan.mdx` → `/tulisan`),
  holding that page's own headline, intro and title block. Not writing; the
  words the page is *made of*.

### Three things that will bite you

Each is covered properly in the guides, but they are worth knowing before your
first file:

1. **Quote your dates.** `date: "2026-08-25"`, with the quotation marks.
   Unquoted, an impossible date like `2026-02-30` is silently rolled forward
   instead of failing.
2. **Write prices with no dots.** `price: 49000`, never `49.000` — in YAML that
   second one means *forty-nine*.
3. **A thing that is not ready is absent, not empty.** Delete the file and the
   section disappears cleanly. There is no on/off switch anywhere, because the
   file *is* the switch.

### Publishing

```bash
npm run dev     # look at it: http://localhost:3000
npm run build   # catch mistakes before pushing
git add content/
git commit -m "ulasan: judul buku"
git push
```

The sitemap, both RSS feeds, share cards and structured data all update
themselves from the file you wrote. A malformed file stops the build and names
itself in the error, in Indonesian — it never publishes something broken.

---

## Running it locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

| Command | Does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build — the real check before pushing |
| `npm test` | Test suite (vitest) |
| `npm run lint` | ESLint |

Payments need credentials to work end to end; copy `.env.example` to
`.env.local` and see [docs/PAYMENTS.md](docs/PAYMENTS.md). Without them the shop
still lists and the basket still works — it just says plainly that payment is
not connected.

## Where things live

```
content/          everything published — see content/README.md
  puisi/          poems
  cerita/         short stories
  ulasan/         book reviews
  produk/         what is for sale (empty = no shop at all)
  produk-draf/    parked products, invisible to the site
  tulisan.mdx     the words on /tulisan
  sekarang.mdx    /sekarang
  novel.mdx       the novel progress strip
private/produk/   files buyers download — never served publicly
app/              routes
components/       shared UI
lib/              loaders, payments, email, site config
docs/             the guides
```

Design note: the site is laid out as a set of numbered drawing sheets — a
blueprint. The palette, the typography and the sheet frame are documented at the
top of [`app/globals.css`](app/globals.css), and the sheet register that numbers
the pages lives in [`lib/site.ts`](lib/site.ts).

## Docs

- **[docs/ADDING-CONTENT.md](docs/ADDING-CONTENT.md)** — poems, stories,
  reviews, products. Start here.
- **[content/README.md](content/README.md)** — supplying a page's own words with
  a Markdown file.
- **[docs/PAYMENTS.md](docs/PAYMENTS.md)** — DOKU setup, credentials, how orders
  are fulfilled.

## Deploying

The repo is linked to the Vercel project `dimas-mart`, so `main` is what ships.
Secrets are set on Vercel and never committed:

```bash
vercel env add DOKU_SECRET_KEY production
```

`.env.example` lists every variable the site reads, names only. See
[docs/PAYMENTS.md](docs/PAYMENTS.md) for which ones payments need and what
happens while they are unset.
