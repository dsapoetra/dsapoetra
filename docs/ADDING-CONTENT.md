# Adding content

Everything on this site is a Markdown file in `content/`. There is no CMS, no
database, no admin login. You write a file, commit it, and it is published.

## Where things go

| What | Folder | Becomes |
|---|---|---|
| Book review | `content/ulasan/` | `/ulasan/<filename>` |
| Poem | `content/puisi/` | `/puisi/<filename>` |
| Short story | `content/cerita/` | `/cerita/<filename>` |

**The filename becomes the URL**, so name files the way you want the link to
read: lowercase, words separated by hyphens, no spaces, no accents. Once a file
is published, renaming it breaks any link anyone has shared — pick the name once.

The `.mdx` extension is required. Files that do not end in `.mdx` are ignored.

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

## Quote your dates

Write `date: "2026-08-25"`, with the quotation marks.

Without them, YAML parses the date before the site can check it, and an
impossible date like `2026-02-30` is silently rolled forward to March 2nd. You
would never see the mistake; the byline would simply be wrong.

With quotes, an invalid date fails the build and names the file.

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

This is deliberate: a malformed file stops the build rather than publishing
something broken. Fix the file named in the message.

## Things that will bite

- **Renaming a published file** changes its URL and breaks shared links.
- **Unquoted dates** hide calendar mistakes (see above).
- **Colons inside a value** confuse YAML. Wrap the whole value in quotes:
  `title: "Buku: Sebuah Catatan"`.
- **Editing a poem in an editor that trims trailing whitespace** can change
  indentation you meant to keep.

## What is still placeholder

Replace these when you can — they currently appear in the sitemap, the feeds and
the share cards:

- `app/icon.svg` — a stand-in mark, not a real favicon
- `lib/site.ts` → `detail` — one concrete, true sentence about your writing life;
  the bio omits it entirely while it is empty rather than inventing something
- `lib/site.ts` → `personalName` — empty means the site fronts the handle
  `dsapoetra`; fill it in to front your name instead
