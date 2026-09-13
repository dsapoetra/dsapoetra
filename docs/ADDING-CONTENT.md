# Adding content

Everything on this site is a Markdown file in `content/`. There is no CMS, no
database, no admin login. You write a file, commit it, and it is published.

## Where things go

Two kinds of file live in `content/`.

**Collections** — a folder of files, one per thing, as many as you like:

| What | Folder | Becomes |
|---|---|---|
| Book review | `content/ulasan/` | `/ulasan/<filename>` |
| Poem | `content/puisi/` | `/puisi/<filename>` |
| Short story | `content/cerita/` | `/cerita/<filename>` |
| Product | `content/produk/` | A card in the shop on `/` and `/toko` |

**Singletons** — one fixed file, because there is only ever one of the thing:

| What | File | Becomes |
|---|---|---|
| What you are up to | `content/sekarang.mdx` | `/sekarang`, and the summary card on `/` |
| Novel progress | `content/novel.mdx` | The progress strip on `/` |
| The book shelf | `content/rak.md` | The whole of `/ulasan`, and a page per book |
| A page's own words | `content/tulisan.mdx` | The headline and title block on `/tulisan` |

That last row is a different kind of thing from the two above it: it holds the
*page's* words — headline, intro, the ruled fields along the bottom of the sheet
— rather than a piece of writing. One file per page, named after the route.
**[content/README.md](../content/README.md)** covers it on its own.

For collections, **the filename becomes the URL or the slug**, so name files the
way you want the link to read: lowercase, words separated by hyphens, no spaces,
no accents. Once a file is published, renaming it breaks any link anyone has
shared — pick the name once.

The `.mdx` extension is required. Files that do not end in `.mdx` are ignored,
which is why `.gitkeep` can sit in an empty folder without becoming a poem.

## The shape of a file

Every file starts with a fenced block of metadata called frontmatter, then the
writing itself.

### A poem — `content/puisi/hujan-di-bulan-juni.mdx`

```mdx
---
title: Hujan di Bulan Juni
date: "2026-08-25"
---

Baris pertama
baris kedua

Bait kedua, setelah baris kosong
```

Only `title` and `date` are needed.

**Your line breaks survive exactly as you type them.** Poems are deliberately not
run through the Markdown renderer, because Markdown collapses single newlines
into flowing paragraphs — which would quietly destroy the shape of every poem.
Single newlines stay line breaks; a blank line starts a new stanza; leading
spaces for indentation are preserved.

**The date is never displayed on a poem.** It exists only to order the list. This
is intentional: a poem should not look stale because it was written in March.

### A short story — `content/cerita/judul-cerita.mdx`

```mdx
---
title: Judul Cerita
date: "2026-08-25"
excerpt: Satu atau dua kalimat. Muncul di daftar cerita dan di kartu share.
---

Isi cerita. Paragraf dipisahkan baris kosong, seperti Markdown biasa.

Bisa pakai **tebal**, *miring*, [tautan](https://contoh.com), dan blockquote.
```

Stories **do** show their date and an estimated reading time, calculated
automatically.

### A book review — `content/ulasan/judul-buku.mdx`

```mdx
---
title: Judulnya menurut kamu, bukan judul bukunya
book:
  title: Judul Asli Buku
  author: Nama Penulis
date: "2026-08-25"
cover: /sampul/judul-buku.jpg
excerpt: Satu atau dua kalimat tentang isi ulasan.
videoUrl: https://www.instagram.com/p/XXXXXXX/
tags: ["nonfiksi", "manajemen"]
---

Isi ulasan.
```

Required: `title`, `book.title`, `book.author`, `date`, `cover`, `excerpt`.
Optional: `videoUrl`, `canonicalUrl`, `tags`.

`title` is your headline for the review — it does not have to be the book's
title, and it usually reads better if it is not.

### A product — `content/produk/sunyi-hanya-angan.mdx`

```mdx
---
title: Sunyi Hanya Angan
kind: E-book · PDF + EPUB
price: 49000
order: 1
cover:
  tone: ink
  caption: |
    Kumpulan puisi
    2022–2026
---

Empat puluh delapan puisi, termasuk yang tidak pernah saya terbitkan di situs ini.
```

Required: `title`, `kind`, `price`, `cover.tone`, `cover.caption`.
Optional: `order`, `buyUrl`, `download`.

**The body is the description.** Unlike a story's `excerpt`, a product's blurb is
not a frontmatter field — it is the prose below the `---`. Wrap it across as many
lines as you like; it is collapsed onto one line when it reaches the card.

`kind` is the small line above the title: `E-book · PDF + EPUB`,
`Template · Notion`, `Kelas · rekaman`. Whatever tells someone what they are
actually buying.

`price` is **whole rupiah with no separators**: `49000`, not `49.000`. See the
warning below — this one is worth reading before you write your first price.

`order` is the shelf position, lowest first. Leave it out and the product sorts
after everything that has one, so adding a product never means renumbering the
rest. The homepage shows the first three; `/toko` shows all of them.

### Product covers

There is no product photography, so a cover is a flat block of colour with a
caption on it. `tone` picks the colour:

| `tone` | Looks like |
|---|---|
| `ink` | The dark ink block — cream on the dark page |
| `accent` | The deep red |
| `highlight` | The coral |

Those three stay visibly distinct in both light and dark mode. There is no fourth
option, and a tone the site does not know fails the build rather than rendering
an invisible card.

`caption` is the text laid over the block. Two short lines usually read best, and
the `|` in the example is YAML for "keep my line breaks":

```yaml
cover:
  tone: ink
  caption: |
    Kumpulan puisi
    2022–2026
```

The caption is decoration — the real title sits directly underneath it — so a
screen reader skips it rather than reading a slightly different title twice.

### The file people get after paying

Put the file in `private/produk/` and name it:

```yaml
download: sunyi-hanya-angan.pdf
```

That folder is outside `public/`, so the file is not reachable by URL. After
payment the buyer is emailed a private, signed link that expires in 30 days.

A **bare filename only** — no slashes, no `../`. Anything else fails the build,
because that value ends up in a filesystem path.

A product with no `download:` still sells: the receipt lists it under "menyusul"
and you send it yourself. Same if `download:` names a file that is not actually
deployed — the check happens when the link is signed, so a buyer is never handed
a link that fails when they click it.

Keep files to a few MB. If you ever sell video, move to Vercel Blob rather than
committing it to git.

### Selling a product that lives somewhere else

Add `buyUrl` with the full URL:

```yaml
buyUrl: https://lynk.id/dsapoetra/sunyi-hanya-angan
```

"Beli" then links straight there and the product never enters the basket. That is
the right shape when the product already has its own checkout page on Lynk,
Karyakarsa, Gumroad or similar.

Without `buyUrl`, the product goes into the basket and is paid for through DOKU.
See **[docs/PAYMENTS.md](PAYMENTS.md)** for how that is set up and what still
needs your credentials.

### Novel progress — `content/novel.mdx`

```mdx
---
status: draf awal
chaptersDone: 3
chaptersTotal: 24
updated: "2026-08-25"
---

Bab tiga sedang dirapikan.
```

Required: `status`, `chaptersDone`, `chaptersTotal`, `updated`.

`status` is the short state next to the word "Novel" — `draf awal`, `revisi
kedua`, whatever is true. The two counts draw the row of squares. The body is an
optional one-line note under them; leave it out and nothing renders there.

`chaptersDone` is clamped to `chaptersTotal`, so a typo shows up as a full bar
rather than as broken layout.

### Rak buku — `content/rak.md`

This is the one file that holds every book you have read, are reading, or mean
to read. It draws the whole of `/ulasan`: the pile of what is next, the pile of
what is done, and — behind the "Lihat daftar lengkap" toggle — all of it,
grouped into phases.

It is a `.md` file, not `.mdx`, because there is nothing to render: it is a
list.

```md
---
title: 125 buku, sepuluh sekaligus.
intro: Sepuluh berikutnya ada di tumpukan. Selesai satu, daftarnya maju.
---

## Fase 1 · Sembilan puluh hari pertama

- The Coaching Habit — Michael Bungay Stanier · finished
- Humble Inquiry — Schein & Schein · reading 45%
- Na Willa — Reda Gaudiamo · finished · id
- Radical Candor — Kim Scott
```

`title` and `intro` are the headline and the paragraph under it. Only `title`
is required.

**A `## ` heading starts a phase.** Phases are drawn in file order, one pile
each. Name them whatever you like — they are your shelves, not a fixed set.

**A `- ` line is a book**, written `Judul — Penulis`. The separator is an em
dash with a space on each side: **`—`, not `-` and not `–`**. Copy it from a
line that already works. Getting it wrong stops the build and names the line.

After the author you can add any number of tags, each after a ` · ` (middle
dot, the same one `kind` uses on a product):

| Tag | Means |
|---|---|
| *nothing* | Antre — not started. Drawn as an outlined book. |
| `finished` | Read. Moves it out of the queue and into the Finished pile. |
| `reading 45%` | Open right now, 45% in. Draws a bar along the bottom edge. |
| `paused 60%` | Put down at 60%. Same bar, honest label. |
| `id` | The book is in Bahasa Indonesia. Draws a blue band on the edge. |

So `- Filosofi Teras — Henry Manampiring · finished · id` is a finished
Indonesian book, and the order of the tags does not matter.

**The queue is not a list you maintain.** It is the first ten unfinished books
in the file. Tag one `finished` and it leaves the pile; the next one moves up on
its own. That is the only bookkeeping there is.

#### How a review attaches to a book

Each book gets a URL from its title: lowercase, and every run of anything that
is not a letter or a number becomes one hyphen. `The Coaching Habit` becomes
`the-coaching-habit`, so the book lives at `/ulasan/the-coaching-habit`.

Write `content/ulasan/the-coaching-habit.mdx` — an ordinary review, exactly as
documented above — and that book's page picks up its cover, its date, its video
and its writing. Nothing in `rak.md` changes. The two files find each other by
name.

A book with no review file still has a page: the generated cover, the status,
and a line saying the notes are not written yet. **That is the normal case.** A
shelf of 125 books with a handful of reviews is a reading log, which is what it
is meant to be.

Two titles that produce the same slug stop the build, because they would want
the same URL.

#### Sampul buku

A book shows a real cover when there is an image at
**`public/sampul/<slug>.jpg`** — the same slug that gives the book its URL. No
line in `rak.md` points at it; the filename is the whole link, exactly like a
review.

Most of them are already there. To fetch the rest:

```bash
node scripts/ambil-sampul.mjs           # only books that have no cover yet
node scripts/ambil-sampul.mjs --force   # fetch everything again
node scripts/ambil-sampul.mjs --only na-willa,akar
```

It searches Open Library by title and author, saves what it finds, and prints a
list of what it could not. **It never guesses** — a search that only matches on
title is rejected unless the author's surname matches too, because a wrong cover
is much worse than no cover. Indonesian titles mostly miss; Open Library barely
carries them.

`.png`, `.webp` and `.avif` work too. Portrait shape is best, but covers are
letterboxed rather than cropped, so an odd shape will not lose its title.

**A book with no cover is not broken.** It gets a block in its own spine colour
with the title set large and the author along the bottom — which is what the
shelf already looked like, and reads as deliberate. Add the file yourself
whenever you want the real thing.

#### Turning the shelf off

Delete `content/rak.md` and `/ulasan` goes back to being the plain list of
written reviews. Put it back and the shelf returns. Nothing else changes.

## Turning a section off

Nothing here has an on/off switch, because the file **is** the switch.

- **Delete `content/novel.mdx`** and the progress strip disappears from the
  homepage.
- **Delete `content/tulisan.mdx`** and `/tulisan` falls back to its own built-in
  headline and drops its title block. The listings are untouched — they come from
  the collections, not from this file.
- **Delete `content/rak.md`** and `/ulasan` goes back to the plain list of
  written reviews. The reviews themselves are untouched — they live in
  `content/ulasan/`, not in the shelf file.
- **Empty `content/produk/`** and the entire shop goes with it: the homepage
  section, the `Toko` link in the nav and footer, the sitemap entry, and the
  basket. `/toko` and `/keranjang` start returning 404 instead of showing an
  empty shelf.

Put the files back and everything returns. Nothing needs editing in code either
way — this is the same rule the "ask me anything" links follow: **a thing that is
not ready is absent, not empty.**

## Quote your dates

Write `date: "2026-08-25"`, with the quotation marks. Same for `updated:` in
`novel.mdx` and `sekarang.mdx`, and for anything number-shaped in a page's
`titleBlock` — `value: "2026"`.

Without them, YAML parses the date before the site can check it, and an
impossible date like `2026-02-30` is silently rolled forward to March 2nd. You
would never see the mistake; the byline would simply be wrong.

With quotes, an invalid date fails the build and names the file.

## Write prices without the dots

Write `price: 49000`. Not `49.000`, not `"Rp 49.000"`, not `49,000`.

This is the nastiest trap in the whole file format, because it does not look like
a mistake. In YAML, `49.000` is not "forty-nine thousand" — it is the decimal
number **49**. And 49 is a perfectly valid whole number, so nothing would flag
it. The card would quietly read `Rp 49`, and you would find out when somebody
bought a poetry collection for the price of nothing.

There is no way to tell the two apart after the fact, so the site guards it with
a floor instead: **any price under 1,000 that is not exactly 0 is rejected**, with
a message naming the mistake. `price: 0` is still allowed, for something you are
giving away.

The dots go in on the way out, not on the way in — `49000` in the file renders as
`Rp 49.000` on the page.

## Linking a video

Add `videoUrl` with the full URL. Instagram, YouTube and TikTok all work — the
platform name is read from the link, so both `instagram.com/p/...` and
`instagram.com/reel/...` are fine.

The review page then shows a card above the writing:

> ▶ Tonton ulasan *[book title]* di Instagram
> Membuka Instagram di tab baru

**The video is linked, not embedded, on purpose.** Instagram's embed is heavy,
needs their script, and often refuses to render Reels at all — a player that
sometimes fails is worse than a link that always works.

Leave `videoUrl` out and the page is a clean written review with no empty gap
where a video would have been. Most reviews will not have one, and that is the
normal case, not a deficiency.

**Write the review anyway, even when there is a video.** Search engines cannot
read a video, and a reader who does not want to watch one needs something on the
page. The video brings people in; the writing is what makes the page work on its
own.

## Cover images

`cover` points at a file in `public/`, conventionally `public/sampul/`. So
`cover: /sampul/judul-buku.jpg` means `public/sampul/judul-buku.jpg`.

A missing file does not break the build — you get a broken-image box on the
index. Portrait shape works best; the index reserves an 80×120 slot.

For a book on the shelf that has **no** review file, there is no frontmatter to
put `cover:` in — the image is found by filename instead. See
[Sampul buku](#sampul-buku) above.

## Publishing

```bash
npm run dev     # look at it: http://localhost:3000
npm run build   # catch mistakes before pushing
git add content/
git commit -m "ulasan: judul buku"
git push
```

That is the whole process. The sitemap, both RSS feeds, the share card and the
structured data all update themselves from the file you just wrote.

## When the build refuses

Errors name the offending file and say what is wrong, in Indonesian:

| Message | Meaning |
|---|---|
| `title wajib diisi` | `title` is missing or empty |
| `date harus dalam format YYYY-MM-DD` | Wrong date shape |
| `date bukan tanggal kalender yang valid` | A date that does not exist, like Feb 30 |
| `excerpt wajib diisi` | `excerpt` missing on a story or review |
| `cover wajib diisi` | `cover` missing on a review |
| `videoUrl harus berupa URL lengkap` | Needs the full `https://...`, not a fragment |
| `kind wajib diisi` | `kind` missing on a product |
| `price ditulis dalam rupiah penuh tanpa titik` | You wrote `49.000` — see above |
| `price harus bilangan bulat` | A price with real decimals, like `49500.5` |
| `price tidak boleh negatif` | Self-explanatory |
| `cover.tone harus ink, accent, atau highlight` | A colour the site does not have |
| `cover.caption wajib diisi` | The cover block has no text on it |
| `buyUrl harus berupa URL lengkap` | Needs `https://...`, not `/beli` |
| `status wajib diisi` | `status` missing in `novel.mdx` |
| `chaptersTotal harus bilangan bulat` | A fractional chapter count |
| `tidak ada " — " antara judul dan penulis` | A book line in `rak.md` using `-` or `–` instead of `—` |
| `buku ini belum punya fase` | A book line in `rak.md` sitting above the first `## ` heading |
| `tanda "..." tidak dikenal` | A tag `rak.md` does not know — see the tag table above |
| `menghasilkan slug "..." yang sudah dipakai` | Two books in `rak.md` want the same URL |

This is deliberate: a malformed file stops the build rather than publishing
something broken. Fix the file named in the message.

## Things that will bite

- **Renaming a published file** changes its URL and breaks shared links.
- **Unquoted dates** hide calendar mistakes (see above).
- **Colons inside a value** confuse YAML. Wrap the whole value in quotes:
  `title: "Buku: Sebuah Catatan"`.
- **Editing a poem in an editor that trims trailing whitespace** can change
  indentation you meant to keep.
- **Writing a price the way you would say it** — `49.000` — silently means 49.
  The floor catches it, but know why the build stopped.
- **Renaming a product file** empties that product out of anyone's in-progress
  basket. Harmless, but it is why the slug should be settled before launch.
- **The `·` in `kind`** is a middle dot, not a full stop or a hyphen. Copy it
  from an existing file rather than retyping it.

## What is still placeholder

Replace these when you can — they currently appear in the sitemap, the feeds and
the share cards:

- `app/icon.svg` — a stand-in mark, not a real favicon
- `lib/site.ts` → `detail` — one concrete, true sentence about your writing life;
  the bio omits it entirely while it is empty rather than inventing something
- `lib/site.ts` → `personalName` — empty means the site fronts the handle
  `dsapoetra`; fill it in to front your name instead
- **DOKU credentials** — the checkout code is finished, but no keys are set, so
  the basket says payment is not connected. See [PAYMENTS.md](PAYMENTS.md)
- **Product files** — `private/produk/` is empty, so every receipt currently says
  "menyusul". Add the files and a `download:` line to deliver automatically
- `content/produk/*.mdx` — **all three products came from the design mockup, not
  from you.** The titles, blurbs and prices are placeholders that made the layout
  real. Replace them with what is actually for sale, or delete them until there
  is something
- `content/novel.mdx` — **3 of 24 chapters also came from the mockup.** Put the
  real figures in, or delete the file to drop the strip
